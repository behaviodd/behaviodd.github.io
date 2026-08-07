# K-POP Digging Club

> 좋아하는 K-POP 트랙 하나로, 전 세계 숨겨진 음악을 발굴하는 하이브리드 음악 디스커버리 서비스

**URL**: [https://behaviodd.github.io/digging/](https://behaviodd.github.io/digging/)

---

## 서비스 개요

K-POP Digging Club은 K-POP 청취자가 익숙한 취향의 벽을 넘어 새로운 음악을 발견할 수 있도록 돕는 웹 기반 음악 추천 서비스입니다.

Spotify 또는 Apple Music 트랙 링크를 입력하면, 해당 곡의 음악적 특성(태그, 템포, 청취 패턴)을 분석하여 **K-POP을 제외한** 전 세계 유사 곡을 최대 30곡까지 추천합니다.

### 핵심 가치

- **디깅(Digging)**: 알고리즘이 아닌 탐험으로 음악을 발견하는 경험
- **크로스 장르**: K-POP의 음악적 DNA를 공유하는 비K-POP 곡 발굴
- **숨겨진 보석**: 인기도가 아닌 음악적 깊이를 기준으로 추천

---

## 사용 흐름

```
1. Spotify 또는 Apple Music 트랙 URL 입력
2. [Dig] 버튼 클릭
3. 5개 소스에서 후보 수집 → K-POP 필터링 → Stage 1 스코어링
4. Deezer Track Features로 Stage 2 재랭킹
5. 최대 30곡 추천 결과 확인
6. 미리 듣기 / 좋아요·스킵 피드백 / Spotify 플레이리스트 생성
```

---

## 주요 기능

### 하이브리드 디스커버리 엔진

5개의 독립적인 후보 수집 소스와 BPM 수집을 병렬로 실행하여 단일 플랫폼의 추천 편향을 극복합니다.

| 소스 | 플랫폼 | 탐색 방식 |
|------|--------|-----------|
| Source A | Last.fm | 청취 패턴 기반 유사 트랙 |
| Source C | Last.fm | 태그별 인기 트랙 (인접 장르 확장 포함) |
| Source D | Deezer | 태그 키워드 검색 |
| Source E | ListenBrainz | 유사 아티스트 → Deezer 인기곡 |
| Source F | Deezer | 관련 아티스트 → 인기곡 |
| BPM Data | Deezer | 템포 매칭용 BPM 수집 |

### 2단계 스코어링 시스템 (100점 만점)

각 후보곡에 대해 복합적인 음악적 유사도를 점수화합니다.
Stage 1에서 85점 예산으로 코어 점수를 내고, Stage 2에서 오디오 피처로 최대 15점을 더합니다.

#### Stage 1 — 코어 (85점)

| 요소 | 배점 | 설명 |
|------|------|------|
| Digging Index | 23 | 청취 깊이(재생/리스너 비율) + 희소성 보너스 |
| Vibe Match | 22 | TF-IDF 가중 태그 유사도 |
| Multi-Source Confidence | 12 | 다중 소스 교차 검증 (4개 이상 12 / 3개 10 / 2개 6) |
| Listener Behavior | 10 | Last.fm 청취 패턴 기반 유사도 |
| BPM Match | 10 | 하모닉 템포 매칭 (half/double tempo 포함) |
| Cross-Platform | 8 | 플랫폼 간 존재 확인 (3개 이상 8 / 2개 5) |
| Feedback Bias | ±8 | 사용자 취향 프로필 보정 |

Digging Index에는 **Vibe 감쇠**가 걸립니다 — `vibeScore < 5`면 ×0.5, `< 10`이면 ×0.75.
태그 유사도가 낮은데 희소하기만 한 곡이 상위에 오르는 것을 막습니다.

#### Stage 2 — Deezer Track Features (+15점)

Worker에서 Deezer `/track/{id}` 를 배치 호출해 오디오 피처를 비교합니다 (`TF_MAX = 15`).

| 피처 | 가중치 | 설명 |
|------|--------|------|
| Gain | 50% | 라우드니스 — 에너지 프록시 |
| BPM | 30% | 정밀 BPM (track 엔드포인트) |
| Duration | 20% | 곡 길이 유사도 (3분 차이 = 최대 감점) |

#### 데이터 누락 시 비례 재정규화

고정 보상점 대신 **누락 요소를 제외한 나머지를 스케일업**해, 어떤 조합이 빠지든 이론적
최대점이 100점이 되게 합니다. 데이터가 있는 곡이 구조적으로 유리해지는 편향을 없애기
위한 처리입니다.

| 시나리오 | 처리 | 이론적 최대 |
|----------|------|-----------|
| 모든 데이터 있음 | Stage 1 + Stage 2 | 100 |
| BPM 없음 | Stage 1 코어를 85점 예산으로 재정규화 | 100 |
| Track Features 없음 | Stage 1 점수 × (100 / 85) | 100 |
| BPM + TF 없음 | 위 두 처리 연속 적용 | 100 |

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

결과 화면에서 7개 데이터 소스의 가용 상태를 실시간으로 표시합니다.
후보 수집 5개 + BPM Data + Track Features 입니다.

```
●●●○●●● 6/7 sources
```

Track Features가 레이트 리밋에 걸리면 `(audio features limited)` 표기가 덧붙습니다.

---

## 기술 스택

### 프론트엔드

- **Jekyll** (GitHub Pages) 정적 사이트
- 순수 JavaScript (프레임워크 미사용), 단일 페이지 인라인 스크립트
- 터미널 스타일 UI (JetBrains Mono, scanline effect)
- 미리듣기는 **iTunes 우선 → Deezer 폴백** (iTunes는 URL 만료 없음, JSONP 직접 호출)

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
| Deezer Track Features | KV: 검색 7일 / 트랙 30일 | Stage 2 배치 조회 |

### 사용 외부 API

| API | 용도 | 인증 |
|-----|------|------|
| Spotify Web API | 시드 트랙 정보, 검색, 플레이리스트 생성 | Client Credentials + PKCE |
| Last.fm API | 유사 트랙, 태그, 아티스트 정보, 태그 유사도 | API Key |
| Deezer API | 태그 검색, 관련 아티스트, BPM, Track Features, 프리뷰 | 공개 |
| iTunes Search API | Apple Music 메타데이터, 프리뷰(1순위) | JSONP (프록시 미경유) |
| MusicBrainz API | 아티스트/녹음 MBID 확인 | User-Agent |
| ListenBrainz Labs API | 세션 기반 유사 아티스트 | 공개 |

---

## 아키텍처

```
┌─────────────┐     ┌──────────────────────┐     ┌─────────────────┐
│   Browser    │────▶│  Cloudflare Worker    │────▶│  Spotify API    │
│              │     │  (kpop-digging-proxy) │────▶│  Last.fm API    │
│  digging.html│     │                      │────▶│  Deezer API     │
│  inline JS   │     │  - Token management  │────▶│  MusicBrainz    │
│              │     │  - CORS proxy        │────▶│  ListenBrainz   │
│              │     │  - Response caching   │     └─────────────────┘
│              │     │  - KV cache (TF)      │
└──────┬───────┘     └──────────────────────┘
       │
       │ JSONP (direct)
       │   ┌─────────────────┐
       ├──▶│  iTunes API      │  메타데이터 + 프리뷰
       │   └─────────────────┘
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
Spotify / Apple Music Track URL
       │
       ▼
[Step 1] Seed 분석
  ├── Spotify 또는 iTunes: 트랙 메타데이터
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
[Step 3] Stage 1 스코어링 (max 85 → 정규화)
  ├── TF-IDF 코퍼스 구축 (비음악적 태그 제외)
  ├── Digging Index에 Vibe 감쇠 적용
  ├── BPM 데이터 없을 시 비례 재정규화
  └── 취향 프로필 바이어스 (시간 감쇠 포함)
       │
       ▼
[Step 3.5] Stage 2 Track Features (+15)
  ├── Worker에서 Deezer /track/{id} 배치 호출 (KV 캐시)
  ├── gain / BPM / duration 유사도 계산
  └── TF 데이터 없을 시 비례 재정규화 (× 100/85)
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

- 프리뷰는 30초로 제한됩니다 (iTunes 우선, 없으면 Deezer)
- 일부 국가에서 프리뷰가 제공되지 않을 수 있습니다
- Last.fm 태그 데이터는 사용자 입력 기반이므로 노이즈가 포함될 수 있습니다
- Apple Music은 입력(메타데이터 조회)만 지원하며, 플레이리스트 생성은 Spotify만 가능합니다
- Spotify 플레이리스트 생성에는 Spotify 계정 연동이 필요합니다
- Track Features가 레이트 리밋에 걸리면 Stage 2가 생략되고 Stage 1 점수가 재정규화됩니다
- 취향 프로필은 브라우저 localStorage에 저장되어 기기 간 동기화되지 않습니다
