---
title: Matome Keyword 구축기
date: 2026-02-14
layout: post
---

# Matome Keyword

> 키워드 하나로 뉴스를 수집하고, AI가 핵심만 요약해주는 뉴스 마토메 서비스

**URL**: [https://matome-keyword.vercel.app](https://matome-keyword.vercel.app)

## 서비스 개요

Matome Keyword는 사용자가 입력한 키워드를 기반으로 한국 뉴스를 실시간 수집하고, 머신러닝 또는 생성형 AI로 핵심 내용을 요약하는 웹 서비스입니다.

쏟아지는 뉴스 속에서 **원하는 주제만 빠르게 파악**하고 싶을 때를 위해 만들었습니다. 키워드를 쉼표로 구분해 입력하면, 최대 500건의 기사를 수집하고 3가지 요약 방식 중 하나로 핵심을 정리해줍니다.

---

## 핵심 기능

### 멀티소스 뉴스 수집

3개 뉴스 소스에서 RSS 피드를 동시에 탐색합니다.

| 소스 | 탐색 방식 |
|------|-----------|
| Google News | Google News RSS — 키워드 검색 |
| Naver News | Google News RSS — `site:news.naver.com` 필터 |
| Daum News | Google News RSS — `site:v.daum.net` 필터 |

키워드마다 3개 소스를 순회하므로, 키워드 3개를 입력하면 총 9개의 RSS 피드를 파싱합니다. URL 기반 중복 제거와 날짜 범위 필터링을 거쳐 최신순으로 정렬합니다.

### 3가지 요약 엔진

사용자가 상황에 따라 선택할 수 있는 3가지 요약 방식을 제공합니다.

| 엔진 | 방식 | 특징 |
|------|------|------|
| LexRank | 그래프 기반 문장 추출 | 기본값, API 키 불필요, 빠름 |
| LSA | 잠재 의미 분석 | 다른 관점의 핵심 문장 추출 |
| Gemini | Google Gemini API | 자연스러운 한국어 요약, API 키 필요 |

LexRank와 LSA는 로컬 ML 라이브러리(sumy + NLTK)로 동작하여 외부 의존 없이 요약이 가능합니다. Gemini는 더 자연스러운 요약을 원할 때 API 키를 입력해 사용합니다.

### 텍스트 전처리

뉴스 본문에서 노이즈를 제거하는 18개 이상의 정규식 패턴을 적용합니다.

- HTML 태그 제거 및 엔티티 디코딩
- 기자명, 저작권 표시, 사진 캡션 제거
- 뉴스 사이트별 상용구(v.daum.net, news.naver.com 등) 정리
- 중복 공백/줄바꿈 정규화

이 전처리가 요약 품질에 직접적으로 영향을 줍니다. 노이즈가 섞인 텍스트에서는 LexRank 같은 추출 요약 알고리즘이 무의미한 문장을 선택할 수 있기 때문입니다.

---

## 기술 스택

### 백엔드

| 항목 | 선택 | 이유 |
|------|------|------|
| 프레임워크 | FastAPI | 비동기 지원, Pydantic 검증, 자동 문서화 |
| 서버 | Uvicorn | ASGI 서버, 로컬 개발용 |
| 배포 | Vercel Serverless | Python 서버리스 함수 지원, GitHub 연동 |
| RSS 파싱 | feedparser | 표준 RSS/Atom 파서 |
| 요약 (로컬) | sumy + NLTK | LexRank/LSA 알고리즘, punkt 토크나이저 |
| 요약 (AI) | google-genai | Gemini 2.5 Flash 모델 |
| HTML 처리 | lxml | 빠른 HTML/XML 파싱 |

### 프론트엔드

- **순수 HTML + JavaScript** — 프레임워크 없이 단일 HTML 파일
- **Pretendard** 폰트 (CDN)
- **Design Tokens** — @makestar/design-system에서 추출한 CSS 변수
- Light/Dark 테마 지원 (localStorage 영속화)

---

## 아키텍처

```
사용자 입력 (키워드, 날짜, 요약 방식)
       │
       ▼
[Frontend: index.html]
  ├── 키워드 파싱 (쉼표 분리)
  ├── 요청 빌드 (JSON)
  └── POST /api/search
       │
       ▼
[FastAPI: api/index.py]
  ├── Pydantic 검증
  ├── 날짜 파싱 (ISO 포맷)
  └── core.fetch_news() 호출
       │
       ▼
[Core: core.py → fetch_news()]
  ├── 키워드 × 소스(3) = RSS URL 생성
  ├── feedparser로 각 피드 파싱
  ├── HTML 정제 + 상용구 제거
  ├── 날짜 범위 필터링
  ├── URL 기반 중복 제거
  └── 최신순 정렬 → 상위 N건 반환
       │
       ▼
[Core: core.py → summarize_articles()]
  ├── LexRank/LSA → sumy 로컬 추출
  └── Gemini → API 호출 (한국어 뉴스 분석 프롬프트)
       │
       ▼
[응답: articles + summary + warnings]
       │
       ▼
[Frontend: renderResults()]
  ├── 키워드 칩 표시
  ├── 요약 패널 (불릿 리스트)
  └── 뉴스 카드 렌더링
       ├── 소스 배지 (GOOGLE/NAVER/DAUM)
       ├── 키워드 태그
       ├── 제목 (원문 링크)
       ├── 설명 미리보기 (2줄)
       └── 발행일
```

---

## 작업 과정

### Step 1 — 핵심 엔진 (core.py)

가장 먼저 뉴스 수집과 요약의 핵심 로직을 작성했습니다.

Google News RSS는 `q={keyword}` 파라미터로 검색 결과를 RSS로 제공합니다. 여기에 `site:news.naver.com` 같은 필터를 추가하면 특정 포털의 뉴스만 골라낼 수 있습니다. 한국어 설정(`hl=ko&gl=KR&ceid=KR:ko`)을 넣어 한국 뉴스에 집중했습니다.

RSS에서 가져온 description에는 HTML 태그, 기자 이름, 저작권 문구 등 노이즈가 많습니다. 이것을 정리하지 않으면 요약 품질이 크게 떨어지므로, `clean_html()`과 `remove_boilerplate()`에서 18개 이상의 정규식을 적용해 정제합니다.

요약은 **로컬 우선** 전략을 택했습니다. sumy 라이브러리의 LexRank(그래프 기반)와 LSA(잠재 의미 분석)를 기본으로 제공하고, 더 자연스러운 결과가 필요한 경우에만 Gemini API를 사용합니다.

### Step 2 — API 서버 (api/index.py)

FastAPI로 REST API를 구성했습니다. Pydantic 모델로 요청/응답을 정의하여 타입 안전성을 확보하고, CORS를 전면 개방하여 프론트엔드와의 통신을 허용했습니다.

```
POST /api/search
  → keywords: ["AI", "반도체"]
  → date_from: "2026-02-01"
  → method: "lexrank"
  ← articles: [{title, link, source, ...}, ...]
  ← summary: "• 핵심 포인트 1\n• 핵심 포인트 2..."
  ← warnings: ["[Google News] RSS 피드 오류..."]
```

에러 처리를 **경고 누적 방식**으로 설계했습니다. 개별 RSS 피드가 실패해도 전체가 중단되지 않고, 성공한 결과를 반환하면서 실패 내역을 warnings 배열에 담아 사용자에게 알려줍니다.

### Step 3 — Vercel 서버리스 대응

Vercel 서버리스 환경에서 NLTK punkt 토크나이저를 로드하는 것이 까다로웠습니다. 서버리스 함수는 파일 시스템이 읽기 전용이므로(`/tmp`만 쓰기 가능) NLTK의 기본 다운로드 경로가 작동하지 않습니다.

해결 방법:
1. 프로젝트 로컬에 `punkt_tab` 데이터를 미리 번들
2. `/tmp/nltk_data`를 대안 경로로 설정
3. 3곳(프로젝트 내, /tmp, NLTK 기본)을 순차 탐색하여 첫 번째 발견된 데이터 사용

### Step 4 — 프론트엔드

프레임워크 없이 단일 HTML 파일로 전체 UI를 구성했습니다. React나 Vue를 쓰지 않은 이유는 간단합니다 — 폼 하나와 결과 목록뿐인 UI에 프레임워크 오버헤드가 불필요하기 때문입니다.

@makestar/design-system에서 CSS 변수(시맨틱 토큰)를 추출하는 `sync-tokens.sh` 스크립트를 작성했습니다. `index.css`에서 `:root`와 `[data-theme="dark"]` 블록을 파싱해 `design-tokens.css`로 생성합니다. 디자인 시스템을 업데이트하면 스크립트 한 번으로 토큰을 동기화할 수 있습니다.

### Step 5 — XSS 방어

사용자 입력(키워드)과 외부 데이터(RSS 기사 제목/본문)를 DOM에 렌더링할 때 XSS를 방지해야 합니다. `innerHTML` 대신 `textContent`를 사용하는 `esc()` 헬퍼를 만들어 모든 동적 텍스트에 적용했습니다.

---

## 프로젝트 구조

```
matome-keyword/
├── api/
│   └── index.py              # FastAPI 서버리스 엔트리
├── core.py                   # 핵심 로직 (수집 + 요약)
├── public/
│   ├── index.html            # 프론트엔드 UI
│   └── design-tokens.css     # 디자인 시스템 토큰
├── scripts/
│   └── sync-tokens.sh        # 토큰 동기화 스크립트
├── test_local.py             # 로컬 테스트 CLI
├── run_local.sh              # 개발 서버 실행
├── requirements.txt          # Python 의존성
└── vercel.json               # Vercel 라우팅 설정
```

---

## 회고

### 잘된 점

- **로컬 우선 요약** — API 키 없이도 바로 사용할 수 있어 진입 장벽이 낮습니다. Gemini는 선택사항으로 제공하여 비용 부담 없이 시작할 수 있습니다.
- **경고 누적 패턴** — 뉴스 소스 하나가 실패해도 나머지 결과를 보여주는 구조가 실사용에서 안정적입니다.
- **디자인 토큰 동기화** — design-system의 CSS 변수를 스크립트로 추출하여 별도 프로젝트에서도 일관된 디자인을 유지합니다.
- **프레임워크 미사용** — 518줄의 단일 HTML 파일로 전체 UI를 완성했습니다. 빌드 과정이 없어 Vercel에서 정적 파일로 바로 서빙됩니다.

### 개선할 점

- RSS 기반이므로 실시간성에 한계 (Google News RSS 업데이트 주기에 의존)
- Gemini 요약 시 토큰 사용량 관리 미흡 (현재 80만 자 하드 리밋)
- 요약 결과 캐싱 미구현 (동일 키워드 재검색 시 매번 새로 요약)
- 모바일 환경에서 날짜 선택 UX 개선 필요
