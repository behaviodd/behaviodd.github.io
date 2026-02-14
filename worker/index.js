/**
 * Cloudflare Worker — Spotify API Proxy
 *
 * Manages Client Credentials tokens and proxies requests to Spotify Web API.
 * Environment variables (Secrets): SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET
 */

const SPOTIFY_TOKEN_URL = 'https://accounts.spotify.com/api/token';
const SPOTIFY_API_BASE = 'https://api.spotify.com';
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
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
  };
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const origin = request.headers.get('Origin') || '';

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders(origin) });
    }

    if (request.method !== 'GET' || url.pathname !== '/api/spotify') {
      return new Response('Not Found', { status: 404, headers: corsHeaders(origin) });
    }

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

      return new Response(body, {
        status: spotifyRes.status,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=300',
          ...corsHeaders(origin),
        },
      });
    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), {
        status: 502,
        headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
      });
    }
  },
};
