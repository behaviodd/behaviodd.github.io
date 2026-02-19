# K-POP Digging Club

> 좋아하는 K-POP 트랙 하나로, 전 세계 숨겨진 음악을 발굴하는 하이브리드 음악 디스커버리 서비스

**URL**: [https://behaviodd.github.io/digging/](https://behaviodd.github.io/digging/)

---

## 서비스 개요

K-POP Digging Club은 K-POP 청취자가 익숙한 취향의 벽을 넘어 새로운 음악을 발견할 수 있도록 돕는 웹 기반 음악 추천 서비스입니다.

Spotify 트랙 링크를 입력하면, 해당 곡의 음악적 특성(태그, 템포, 청취 패턴)을 분석하여 **K-POP을 제외한** 전 세계 유사 곡을 최대 30곡까지 추천합니다.

### 핵심 가치

- **디깅(Digging)**: 알고리즘이 아닌 탐험으로 음악을 발견하는 경험
- **크로스 장르**: K-POP의 음악적 DNA를 공유하는 비K-POP 곡 발굴
- **숨겨진 보석**: 인기도가 아닌 음악적 깊이를 기준으로 추천

---

## 사용 흐름

```
1. Spotify 트랙 URL 입력
2. [Dig] 버튼 클릭
3. 6개 소스에서 후보 수집 → K-POP 필터링 → 스코어링
4. 최대 30곡 추천 결과 확인
5. 미리 듣기 / 좋아요·스킵 피드백 / Spotify 플레이리스트 생성
```

---

## 주요 기능

### 하이브리드 디스커버리 엔진

6개의 독립적인 음악 데이터 소스를 병렬로 탐색하여 단일 플랫폼의 추천 편향을 극복합니다.

| 소스 | 플랫폼 | 탐색 방식 |
|------|--------|-----------|
| Source A | Last.fm | 청취 패턴 기반 유사 트랙 |
| Source C | Last.fm | 태그별 인기 트랙 (인접 장르 확장 포함) |
| Source D | Deezer | 태그 키워드 검색 |
| Source E | ListenBrainz | 유사 아티스트 → Deezer 인기곡 |
| Source F | Deezer | 관련 아티스트 → 인기곡 |
| BPM Data | Deezer | 템포 매칭용 BPM 수집 |

### 7요소 스코어링 시스템 (100점 만점)

각 후보곡에 대해 복합적인 음악적 유사도를 점수화합니다.

| 요소 | 배점 | 설명 |
|------|------|------|
| Listener Behavior | 12 | Last.fm 청취 패턴 기반 유사도 |
| Vibe Match | 25 | TF-IDF 가중 태그 유사도 |
| Digging Index | 28 | 청취 깊이(재생/리스너 비율) + 희소성 보너스 |
| Multi-Source Confidence | 15 | 다중 소스 교차 검증 보너스 |
| Cross-Platform | 10 | 플랫폼 간 존재 확인 |
| BPM Match | 10 | 하모닉 템포 매칭 (half/double tempo 포함) |
| Feedback Bias | ±8 | 사용자 취향 프로필 보정 |

### K-POP 3단계 필터링

추천 결과에서 K-POP을 정밀하게 제거하여 진정한 크로스 장르 발견을 보장합니다.

1. **아티스트 블록리스트**: Last.fm의 k-pop, kpop, korean pop 태그 상위 아티스트 ~500명
2. **한글 감지**: 아티스트명에 한글(가-힣, ㄱ-ㅎ)이 포함된 경우 자동 제외
3. **태그 필터**: 곡 태그에 K-POP 관련 키워드가 포함된 경우 제외

### 인접 장르 확장

시드 곡의 태그에서 Last.fm `tag.getSimilar` API를 활용하여 인접 장르를 자동 탐색합니다.

```
dream pop → shoegaze, ethereal, ambient pop, noise pop ...
```

기존 태그 + 확장 태그를 합산하여 더 넓은 범위의 음악을 발견합니다.

### 취향 학습 시스템

- 좋아요/스킵 피드백으로 태그·아티스트별 선호도를 학습
- **7일 반감기** 시간 감쇠 적용 — 최근 취향을 더 강하게 반영
- localStorage 기반으로 별도 회원가입 없이 동작

### Spotify 플레이리스트 생성

- Spotify PKCE OAuth 연동 (클라이언트 사이드, 서버 미경유)
- 추천 결과에서 원하는 곡을 선택 → 한 번에 플레이리스트 생성
- 제목 자동 생성: `Digging: {시드 곡 이름}`

### 소스 신뢰도 표시

결과 화면에서 6개 데이터 소스의 가용 상태를 실시간으로 표시합니다.

```
●●●○●● 5/6 sources
```

---

## 기술 스택

### 프론트엔드

- **Jekyll** (GitHub Pages) 정적 사이트
- 순수 JavaScript (프레임워크 미사용), ~1200줄 인라인 스크립트
- 터미널 스타일 UI (JetBrains Mono, scanline effect)
- Deezer 30초 프리뷰 재생 + Spotify IFrame Embed API

### 백엔드 (Cloudflare Worker)

- **서버리스 API 프록시** — CORS 해결 + API 키 보호
- Spotify Client Credentials 토큰 자동 관리
- 엔드포인트별 캐시 전략:

| API | 캐시 TTL | 비고 |
|-----|----------|------|
| Spotify (트랙/검색) | 5~60분 | 엔드포인트별 차등 |
| Last.fm | 24시간 | 태그/유사 트랙 등 |
| Deezer (검색) | 30분 | 프리뷰 URL 만료 대비 |
| Deezer (기타) | 24시간 | 아티스트 메타데이터 등 |
| MusicBrainz | 7일 | MBID 등 변동 없는 데이터 |
| ListenBrainz | 24시간 | 유사 아티스트 |

### 사용 외부 API

| API | 용도 | 인증 |
|-----|------|------|
| Spotify Web API | 시드 트랙 정보, 검색, 플레이리스트 생성 | Client Credentials + PKCE |
| Last.fm API | 유사 트랙, 태그, 아티스트 정보, 태그 유사도 | API Key |
| Deezer API | 태그 검색, 관련 아티스트, BPM, 프리뷰 | 공개 |
| MusicBrainz API | 아티스트/녹음 MBID 확인 | User-Agent |
| ListenBrainz Labs API | 세션 기반 유사 아티스트 | 공개 |

---

## 아키텍처

```
┌─────────────┐     ┌──────────────────────┐     ┌─────────────────┐
│   Browser    │────▶│  Cloudflare Worker    │────▶│  Spotify API    │
│              │     │  (kpop-digging-proxy) │────▶│  Last.fm API    │
│  digging.html│     │                      │────▶│  Deezer API     │
│  ~1200 lines │     │  - Token management  │────▶│  MusicBrainz    │
│  inline JS   │     │  - CORS proxy        │────▶│  ListenBrainz   │
│              │     │  - Response caching   │     └─────────────────┘
└─────────────┘     └──────────────────────┘
       │
       │ PKCE OAuth (direct)
       ▼
┌─────────────┐
│  Spotify     │
│  Auth + API  │
│  (Playlist)  │
└─────────────┘
```

---

## 알고리즘 상세 흐름

```
Spotify Track URL
       │
       ▼
[Step 1] Seed 분석
  ├── Spotify: 트랙 메타데이터
  ├── Last.fm: 트랙 태그 + 아티스트 태그
  ├── Last.fm: 유사 트랙 목록
  └── MusicBrainz: 아티스트 MBID 확인
       │
       ▼
[Step 1.5] 태그 확장
  ├── 비음악적 태그 필터링 (~40개 블랙리스트)
  └── tag.getSimilar로 인접 장르 태그 확장 (최대 +6개)
       │
       ▼
[Step 1.6] 병렬 후보 수집
  ├── K-POP 아티스트 블록리스트 구축 (~500명)
  ├── Source A: Last.fm 유사 트랙 (K-POP 필터 적용)
  ├── Source C: Last.fm 태그별 인기 트랙 (확장 태그 포함, 최대 12태그)
  ├── Source D: Deezer 태그 검색 (확장 태그 포함, 최대 8태그)
  ├── Source E: ListenBrainz 유사 아티스트 → Deezer 인기곡
  ├── Source F: Deezer 관련 아티스트 → 인기곡
  └── BPM 수집 (Deezer)
       │
       ▼
[Step 2] 후보 분석 (상위 80곡)
  ├── 가중 복합 사전 스코어링으로 상위 80곡 선별
  ├── Last.fm: 각 후보의 재생수, 리스너수, 태그
  └── Deezer: 각 후보의 BPM
       │
       ▼
[Step 3] 7요소 스코어링 (max 100)
  ├── TF-IDF 코퍼스 구축 (비음악적 태그 제외)
  ├── Digging Index에 Vibe 감쇠 적용
  ├── BPM 데이터 없을 시 동적 배점 재분배
  └── 취향 프로필 바이어스 (시간 감쇠 포함)
       │
       ▼
[Step 4] 다양성 필터
  ├── 아티스트당 1곡 제한
  ├── 제목 정규화 중복 제거
  └── 최대 30곡 출력
       │
       ▼
[Result] 추천 결과 + 소스 신뢰도 표시
```

---

## 제한사항

- Deezer 프리뷰는 30초로 제한됩니다
- 일부 국가에서 Deezer 프리뷰가 제공되지 않을 수 있습니다
- Last.fm 태그 데이터는 사용자 입력 기반이므로 노이즈가 포함될 수 있습니다
- Spotify 플레이리스트 생성에는 Spotify 계정 연동이 필요합니다
- 취향 프로필은 브라우저 localStorage에 저장되어 기기 간 동기화되지 않습니다
