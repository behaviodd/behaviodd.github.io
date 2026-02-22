/**
 * Cloudflare Worker — Spotify, Last.fm, MusicBrainz, ListenBrainz & Deezer API Proxy
 *
 * Manages Client Credentials tokens and proxies requests to Spotify Web API.
 * Proxies read-only requests to Last.fm, MusicBrainz, Deezer APIs.
 * Proxies POST requests to ListenBrainz Labs API.
 * Environment variables (Secrets): SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET, LASTFM_API_KEY
 */

const SPOTIFY_TOKEN_URL = 'https://accounts.spotify.com/api/token';
const SPOTIFY_API_BASE = 'https://api.spotify.com';
const LASTFM_API_BASE = 'https://ws.audioscrobbler.com/2.0/';
const MUSICBRAINZ_API_BASE = 'https://musicbrainz.org/ws/2/';
const LISTENBRAINZ_API_BASE = 'https://labs.api.listenbrainz.org/';
const DEEZER_API_BASE = 'https://api.deezer.com/';
const ALLOWED_ORIGIN = 'https://behaviodd.github.io';

let cachedToken = null;
let tokenExpiresAt = 0;

async function getToken(env) {
  const now = Date.now();
  if (cachedToken && now < tokenExpiresAt - 60_000) {
    return cachedToken;
  }

  const res = await fetch(SPOTIFY_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization:
        'Basic ' + btoa(env.SPOTIFY_CLIENT_ID + ':' + env.SPOTIFY_CLIENT_SECRET),
    },
    body: 'grant_type=client_credentials',
  });

  if (!res.ok) {
    throw new Error('Token request failed: ' + res.status);
  }

  const data = await res.json();
  cachedToken = data.access_token;
  tokenExpiresAt = now + data.expires_in * 1000;
  return cachedToken;
}

function corsHeaders(origin) {
  const allowed = origin === ALLOWED_ORIGIN || origin === 'http://localhost:4000';
  return {
    'Access-Control-Allow-Origin': allowed ? origin : ALLOWED_ORIGIN,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
  };
}

async function handleSpotify(url, env, origin) {
  const endpoint = url.searchParams.get('endpoint');
  if (!endpoint || !endpoint.startsWith('/v1/')) {
    return new Response(JSON.stringify({ error: 'Invalid endpoint' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
    });
  }

  try {
    const token = await getToken(env);
    const spotifyUrl = SPOTIFY_API_BASE + endpoint;

    const spotifyRes = await fetch(spotifyUrl, {
      headers: { Authorization: 'Bearer ' + token },
    });

    const body = await spotifyRes.text();

    // Never cache error responses (4xx, 5xx) — especially 429 rate limits
    if (!spotifyRes.ok) {
      return new Response(body, {
        status: spotifyRes.status,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store',
          ...corsHeaders(origin),
        },
      });
    }

    // Endpoint-specific cache durations (success only)
    let cacheMaxAge = 300; // default 5min
    if (/\/v1\/artists\/[^/]+\/albums/.test(endpoint) || /\/v1\/albums\/[^/]+\/tracks/.test(endpoint)) {
      cacheMaxAge = 3600; // 1h — discography rarely changes
    } else if (/\/v1\/search/.test(endpoint)) {
      cacheMaxAge = 600; // 10min
    }

    return new Response(body, {
      status: spotifyRes.status,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=' + cacheMaxAge,
        ...corsHeaders(origin),
      },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 502,
      headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
    });
  }
}

async function handleLastfm(url, env, origin) {
  if (!env.LASTFM_API_KEY) {
    return new Response(JSON.stringify({ error: 'Last.fm API key not configured' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
    });
  }

  const params = new URLSearchParams(url.search);
  params.set('api_key', env.LASTFM_API_KEY);
  params.set('format', 'json');

  try {
    const lfmRes = await fetch(LASTFM_API_BASE + '?' + params.toString());
    const body = await lfmRes.text();

    return new Response(body, {
      status: lfmRes.status,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=86400',
        ...corsHeaders(origin),
      },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 502,
      headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
    });
  }
}

async function handleMusicBrainz(url, origin) {
  const path = url.searchParams.get('path');
  if (!path) {
    return new Response(JSON.stringify({ error: 'Missing path parameter' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
    });
  }

  try {
    // Forward all query params except 'path' to MusicBrainz
    const params = new URLSearchParams(url.search);
    params.delete('path');
    params.set('fmt', 'json');

    const mbUrl = MUSICBRAINZ_API_BASE + path + '?' + params.toString();
    const mbRes = await fetch(mbUrl, {
      headers: {
        'User-Agent': 'KpopDiggingClub/1.0 (https://behaviodd.github.io/digging/)',
        Accept: 'application/json',
      },
    });

    const body = await mbRes.text();

    if (!mbRes.ok) {
      return new Response(body, {
        status: mbRes.status,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store',
          ...corsHeaders(origin),
        },
      });
    }

    return new Response(body, {
      status: mbRes.status,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=604800', // 7 days
        ...corsHeaders(origin),
      },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 502,
      headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
    });
  }
}

async function handleListenBrainz(request, origin) {
  try {
    const body = await request.text();
    const url = new URL(request.url);
    const endpoint = url.searchParams.get('endpoint');
    if (!endpoint) {
      return new Response(JSON.stringify({ error: 'Missing endpoint parameter' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
      });
    }

    const lbRes = await fetch(LISTENBRAINZ_API_BASE + endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: body,
    });

    const resBody = await lbRes.text();

    if (!lbRes.ok) {
      return new Response(resBody, {
        status: lbRes.status,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store',
          ...corsHeaders(origin),
        },
      });
    }

    return new Response(resBody, {
      status: lbRes.status,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=86400', // 24 hours
        ...corsHeaders(origin),
      },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 502,
      headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
    });
  }
}

async function handleDeezer(url, origin) {
  const path = url.searchParams.get('path');
  if (!path) {
    return new Response(JSON.stringify({ error: 'Missing path parameter' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
    });
  }

  try {
    // Forward all query params except 'path' to Deezer
    const params = new URLSearchParams(url.search);
    params.delete('path');

    const deezerUrl = DEEZER_API_BASE + path + (params.toString() ? '?' + params.toString() : '');
    const dzRes = await fetch(deezerUrl);
    const body = await dzRes.text();

    if (!dzRes.ok) {
      return new Response(body, {
        status: dzRes.status,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store',
          ...corsHeaders(origin),
        },
      });
    }

    // Deezer returns HTTP 200 with error object for rate limits and other errors
    try {
      const parsed = JSON.parse(body);
      if (parsed.error) {
        return new Response(body, {
          status: parsed.error.code === 4 ? 429 : 502,
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-store',
            ...corsHeaders(origin),
          },
        });
      }
    } catch { /* not JSON or no error field — proceed normally */ }

    // Shorter cache for search results (preview URLs expire), longer for metadata
    const isSearch = path.startsWith('search/');
    const cacheMaxAge = isSearch ? 1800 : 86400; // 30min for search, 24h for others

    return new Response(body, {
      status: dzRes.status,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=' + cacheMaxAge,
        ...corsHeaders(origin),
      },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 502,
      headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
    });
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const origin = request.headers.get('Origin') || '';

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders(origin) });
    }

    // POST routes
    if (request.method === 'POST') {
      if (url.pathname === '/api/listenbrainz') {
        return handleListenBrainz(request, origin);
      }
      return new Response('Not Found', { status: 404, headers: corsHeaders(origin) });
    }

    // GET routes
    if (request.method !== 'GET') {
      return new Response('Not Found', { status: 404, headers: corsHeaders(origin) });
    }

    if (url.pathname === '/api/spotify') {
      return handleSpotify(url, env, origin);
    }
    if (url.pathname === '/api/lastfm') {
      return handleLastfm(url, env, origin);
    }
    if (url.pathname === '/api/musicbrainz') {
      return handleMusicBrainz(url, origin);
    }
    if (url.pathname === '/api/deezer') {
      return handleDeezer(url, origin);
    }

    return new Response('Not Found', { status: 404, headers: corsHeaders(origin) });
  },
};
