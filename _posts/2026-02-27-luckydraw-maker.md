---
title: 럭드메이커 구축기
date: 2026-02-27
layout: post
---

# 럭드메이커

> 아이돌 이벤트 카페를 위한 감성 럭키드로우 메이커

**URL**: [https://luckydraw-maker.vercel.app](https://luckydraw-maker.vercel.app)

<div style="display:flex;gap:8px;overflow-x:auto;padding:8px 0;">
  <img src="/assets/images/luckydraw-maker/landing.png" alt="랜딩 페이지" style="height:360px;border:2px solid #333;">
  <img src="/assets/images/luckydraw-maker/play.png" alt="뽑기 대기 화면" style="height:360px;border:2px solid #333;">
  <img src="/assets/images/luckydraw-maker/drawing.png" alt="셔플 애니메이션" style="height:360px;border:2px solid #333;">
  <img src="/assets/images/luckydraw-maker/result.png" alt="당첨 결과" style="height:360px;border:2px solid #333;">
</div>

## 서비스 개요

럭드메이커는 아이돌 이벤트 카페에서 사용하는 럭키드로우를 웹으로 만들고, URL 하나로 공유해서 누구나 뽑기를 할 수 있게 해주는 서비스입니다.

오프라인 카페 이벤트에서 흔히 볼 수 있는 럭키드로우 — 포카, 굿즈, 특전 등을 넣고 랜덤으로 뽑는 방식을 디지털로 옮겼습니다. 물리적인 뽑기 박스 없이도 카페 현장에서 QR코드 하나로 뽑기를 진행할 수 있습니다.

---

## 핵심 기능

### 럭키드로우 CRUD

Google 로그인 후 럭키드로우를 생성/편집/삭제할 수 있습니다. 각 드로우에는 이름, 뽑기 버튼 텍스트, 확률 모드, 아이템 목록을 설정합니다.

아이템에는 이름, 수량, 이미지를 등록합니다. 이미지는 2MB 초과 시 WebP로 자동 압축하여 Supabase Storage에 업로드합니다.

### 2가지 확률 모드

| 모드 | 동작 | 사용 예시 |
|------|------|-----------|
| 균등확률 | 모든 아이템 동일 확률 (1/N) | 어떤 것이든 공평하게 뽑기 |
| 차등확률 | 수량 비례 확률 (quantity/total) | 희귀 아이템에 낮은 확률 부여 |

차등확률 모드에서는 에디터에 실시간 확률 프리뷰가 표시되어, 아이템별 당첨 확률을 바로 확인할 수 있습니다.

### 뽑기 화면

슬롯머신 스타일 셔플 애니메이션(2.5초) 후 결과가 공개됩니다. 당첨 시 컨페티 파티클이 터지고, 결과 카드가 스프링 애니메이션으로 등장합니다. "다시 뽑기" 버튼으로 반복 가능합니다.

### URL 공유

생성한 럭키드로우를 `/play/{id}` URL로 공유하면, 로그인 없이 누구나 해당 드로우 페이지에 접속해 뽑기를 할 수 있습니다. 공유 버튼 클릭 시 클립보드에 URL이 복사됩니다.

---

## 기술 스택

| 항목 | 선택 | 이유 |
|------|------|------|
| 프레임워크 | Next.js 16 (App Router) | 파일 기반 라우팅, SSR/CSR 유연한 전환 |
| 언어 | TypeScript (strict) | 타입 안전한 Supabase 쿼리, Props 검증 |
| 스타일링 | Tailwind CSS 4 | 유틸리티 기반 + CSS 변수로 커스텀 테마 |
| 상태관리 | Zustand | 드로우 상태(isDrawing, lastResult), 토스트 관리 |
| 폼 | React Hook Form + Zod | 아이템 배열 동적 관리(useFieldArray), 스키마 검증 |
| 애니메이션 | Framer Motion | 셔플, 컨페티, 결과 스프링 등 복합 애니메이션 |
| 인증 | Supabase Auth (Google OAuth) | 소셜 로그인, RLS 연동 |
| DB | Supabase (PostgreSQL) | RLS 정책으로 접근 제어, 실시간 쿼리 |
| 스토리지 | Supabase Storage | 아이템 이미지 업로드, Public 버킷 |
| 이미지 압축 | browser-image-compression | 클라이언트 사이드 WebP 압축 |
| 아이콘 | Lucide React | 트리셰이킹 가능한 SVG 아이콘 |
| 배포 | Vercel | Next.js 네이티브 지원, 자동 빌드 |

---

## 디자인 — Neobrutalism

네오브루탈리즘 스타일을 채택했습니다. 두꺼운 보더, 솔리드 그림자, 선명한 컬러 팔레트가 특징입니다.

### 컬러 팔레트

```
Primary   #eb6b34  ████  (오렌지 — 포인트 컬러)
Yellow    #FFC900  ████
Green     #23D18C  ████
Blue      #90B8F8  ████
Purple    #C9B1FF  ████
Coral     #FF6B6B  ████
Orange    #FFAB76  ████
```

### Brutal Shadow 시스템

```css
--shadow-brutal:    4px 4px 0px #1C1C1C;   /* 기본 */
--shadow-brutal-lg: 6px 6px 0px #1C1C1C;   /* 카드 호버 */
--shadow-brutal-sm: 2px 2px 0px #1C1C1C;   /* 인풋, 뱃지 */
--shadow-brutal-pink:   4px 4px 0px #eb6b34;  /* 포커스, 선택 */
--shadow-brutal-yellow: 4px 4px 0px #FFC900;  /* 균등확률 선택 */
```

인풋 포커스 시 그림자가 블랙에서 핑크로 전환되며 `-1px, -1px` 이동하는 것으로 눌림 효과를 만들었습니다.

### 타이포그래피

| 용도 | 폰트 | 특징 |
|------|------|------|
| 디스플레이 | Bagel Fat One | 둥글고 볼드한 한글 디스플레이 |
| 본문 | Chiron GoRound TC | 부드러운 라운드 고딕 |
| 숫자/코드 | DM Mono | 날짜, 뱃지 텍스트 |

---

## 아키텍처

```
[Landing Page]
  └── Google OAuth → Supabase Auth
       └── /auth/callback → /vault
            │
            ▼
[Vault — 럭드 목록]
  ├── 새 럭드 만들기 → /create
  │     └── LuckyDrawEditor
  │           ├── React Hook Form + Zod 검증
  │           ├── useFieldArray (아이템 동적 관리)
  │           └── compressAndUpload (이미지 처리)
  │                 └── Supabase Storage
  │
  ├── 수정 → /edit/[id]
  │     └── LuckyDrawEditor (existingDraw)
  │
  ├── 시작 → /draw/[id]
  │     └── DrawScreen
  │           ├── drawItem() — 확률 엔진
  │           ├── ShuffleAnimation (2.5초)
  │           └── ConfettiPieces + Result Card
  │
  └── 공유 → /play/[id] (공개)
        └── DrawScreen (인증 불필요)
             └── Supabase RLS public read
```

---

## 데이터 모델

### 테이블 구조

```
profiles
├── id           UUID (PK, FK → auth.users)
├── display_name TEXT
├── avatar_url   TEXT
└── created_at   TIMESTAMPTZ

lucky_draws
├── id                UUID (PK, auto)
├── user_id           UUID (FK → profiles)
├── name              TEXT
├── draw_button_label TEXT (default: '두근두근 뽑기!')
├── probability_mode  TEXT ('equal' | 'weighted')
├── is_active         BOOLEAN
├── created_at        TIMESTAMPTZ
└── updated_at        TIMESTAMPTZ

draw_items
├── id         UUID (PK, auto)
├── draw_id    UUID (FK → lucky_draws, CASCADE)
├── name       TEXT
├── quantity   INTEGER (≥ 1)
├── image_url  TEXT (nullable)
├── sort_order INTEGER
└── created_at TIMESTAMPTZ
```

### RLS 정책

| 테이블 | 정책 | 규칙 |
|--------|------|------|
| profiles | `profiles_self` | 본인만 ALL |
| lucky_draws | `draws_owner` | 본인만 ALL |
| lucky_draws | `draws_public_read` | 누구나 SELECT |
| draw_items | `items_owner` | 소유자만 ALL |
| draw_items | `items_public_read` | 누구나 SELECT |

소유자 CRUD 정책과 공개 읽기 정책이 공존합니다. PostgreSQL RLS에서 동일 작업(SELECT)에 여러 정책이 있으면 OR로 합쳐지므로, 소유자는 전체 CRUD를, 비인증 사용자는 읽기만 할 수 있습니다.

---

## 작업 과정

### Step 1 — 데이터 모델 + Supabase 셋업

Supabase 프로젝트를 생성하고 스키마를 설계했습니다. `lucky_draws`와 `draw_items`를 1:N 관계로 연결하고, `ON DELETE CASCADE`로 드로우 삭제 시 아이템이 함께 정리되도록 했습니다.

RLS를 먼저 설정하고, `profiles` 테이블을 `auth.users`와 연결하여 Google 로그인 시 프로필이 자동으로 생성되도록 했습니다. 에디터에서 저장 시 `profiles.upsert()`를 먼저 호출하여 FK 제약 위반을 방지합니다.

### Step 2 — 인증 + 미들웨어

Next.js 미들웨어에서 `/vault`, `/draw`, `/create`, `/edit` 경로를 보호합니다. Supabase SSR 클라이언트로 쿠키 기반 세션을 확인하고, 미인증 시 랜딩 페이지로 리다이렉트합니다.

```
protectedPaths = ['/vault', '/draw', '/create', '/edit']

matcher = ['/vault/:path*', '/draw/:path*', '/create/:path*', '/edit/:path*']
```

`/play` 경로는 의도적으로 보호 대상에서 제외하여 공유 URL로 사용합니다.

### Step 3 — 럭드 에디터

React Hook Form의 `useFieldArray`로 아이템 목록을 동적으로 관리합니다. Zod 스키마로 이름 1~30자, 수량 1~9999, 아이템 최소 2개 등의 검증을 수행합니다.

차등확률 모드에서는 각 아이템의 `quantity / totalQuantity * 100`을 실시간으로 계산하여 확률 바와 퍼센트 뱃지로 표시합니다.

이미지 업로드는 `browser-image-compression`으로 클라이언트에서 처리합니다. 2MB 초과 시 800px 리사이즈 + WebP 변환 후 Supabase Storage에 업로드합니다. 개별 이미지 실패는 무시하고 나머지를 저장하며, 버킷 미존재 시에만 전체를 중단하고 안내 메시지를 표시합니다.

### Step 4 — 뽑기 엔진

확률 계산은 `lib/lottery.ts`에서 처리합니다.

**균등확률**: `Math.random() * items.length`로 인덱스를 선택합니다.

**차등확률**: 누적 분포 함수(CDF) 방식입니다. 총 수량 합계에 대한 랜덤 값을 생성하고, 아이템을 순회하며 수량을 차감합니다. 0 이하가 되는 시점의 아이템이 당첨입니다.

```
items:  [A:3, B:1, C:1]  → total: 5
random: 2.7
  A: 2.7 - 3 = -0.3 ≤ 0 → A 당첨 (60% 확률)
```

### Step 5 — 애니메이션

Framer Motion으로 뽑기 경험을 구현했습니다.

- **셔플**: 3열 슬롯머신 — 이모지 배열을 무한 루프로 스크롤, 열마다 0.12초 딜레이
- **컨페티**: 30개 파티클 — 랜덤 위치/크기/색상, `window.innerHeight`까지 낙하 + 회전
- **결과 카드**: `spring` 타입(stiffness: 200, damping: 14) — scale 0 → 1 + rotate -10° → 0°
- **AnimatePresence**: idle → drawing → result 3상태를 `mode="wait"`로 전환

### Step 6 — URL 공유

공유 기능의 핵심은 인증 없이 드로우 데이터에 접근할 수 있게 하는 것입니다. 두 가지를 동시에 해결해야 했습니다:

**1. 라우팅**: `/play/[id]` 공개 경로를 생성하고 미들웨어 보호 대상에서 제외했습니다. 기존 `/draw/[id]`와 동일한 `DrawScreen` 컴포넌트를 렌더링합니다.

**2. RLS 정책**: 기존 `draws_owner`(본인만 ALL) 정책에 `draws_public_read`(누구나 SELECT)를 추가했습니다. UUID가 URL의 유일한 접근 키이므로, 드로우 ID를 모르면 접근할 수 없습니다.

공유 버튼은 3곳에 배치했습니다 — 럭드 카드(목록), 드로우 화면(상단 바), 드로우 정보 페이지. `navigator.clipboard.writeText()`로 URL을 복사하고 토스트로 피드백합니다.

---

## 프로젝트 구조

```
luckydraw-maker/
├── src/
│   ├── app/
│   │   ├── page.tsx              # 랜딩 (Google 로그인)
│   │   ├── layout.tsx            # 루트 레이아웃 (폰트, 토스트)
│   │   ├── globals.css           # Tailwind + Neobrutalism 테마
│   │   ├── auth/callback/        # OAuth 콜백
│   │   ├── vault/                # 럭드 목록 (보호)
│   │   ├── create/               # 새 럭드 만들기 (보호)
│   │   ├── edit/[id]/            # 럭드 수정 (보호)
│   │   ├── draw/[id]/            # 드로우 실행 (보호)
│   │   │   └── info/             # 드로우 정보
│   │   └── play/[id]/            # 드로우 실행 (공개, 공유용)
│   ├── components/
│   │   ├── domain/
│   │   │   ├── DrawScreen.tsx    # 뽑기 화면 (셔플 + 컨페티 + 결과)
│   │   │   ├── LuckyDrawCard.tsx # 럭드 카드 (목록 아이템)
│   │   │   ├── LuckyDrawEditor.tsx  # 럭드 에디터 (생성/수정)
│   │   │   └── DrawItemCard.tsx  # 아이템 카드 (에디터 내부)
│   │   ├── layout/
│   │   │   └── Header.tsx        # 헤더 (로그아웃)
│   │   └── ui/                   # 공통 UI 컴포넌트
│   │       ├── Button.tsx
│   │       ├── GlassCard.tsx
│   │       ├── Badge.tsx
│   │       ├── Toast.tsx
│   │       ├── ImageUpload.tsx
│   │       ├── LoadingSpinner.tsx
│   │       └── StarField.tsx
│   ├── hooks/
│   │   ├── useAuth.ts            # 인증 상태 + Google 로그인
│   │   └── useLuckyDraws.ts     # 드로우 CRUD 훅
│   ├── lib/
│   │   ├── supabase/client.ts    # 브라우저 Supabase 클라이언트
│   │   ├── supabase/server.ts    # 서버 Supabase 클라이언트
│   │   ├── lottery.ts            # 확률 엔진
│   │   ├── imageUtils.ts         # 이미지 압축 + 업로드
│   │   └── utils.ts              # cn() 유틸리티
│   ├── stores/
│   │   ├── drawStore.ts          # 뽑기 상태 (isDrawing, lastResult)
│   │   └── uiStore.ts            # 토스트 상태
│   ├── types/index.ts            # 타입 정의
│   └── middleware.ts             # 인증 미들웨어
└── supabase/schema.sql           # DB 스키마 + RLS
```

---

## 회고

### 잘된 점

- **RLS 이중 정책** — 소유자 CRUD + 공개 읽기를 분리하여, 기존 보안을 유지하면서 공유 기능을 추가했습니다. UUID 기반 접근이므로 열거 공격이 사실상 불가능합니다.
- **공유 경로 분리** — `/draw`(보호)와 `/play`(공개)를 분리하여 미들웨어 수정 없이 공유를 구현했습니다. 같은 `DrawScreen` 컴포넌트를 재사용하므로 코드 중복도 없습니다.
- **이미지 에러 격리** — 개별 이미지 업로드 실패를 전체 저장 실패로 전파하지 않고, null로 대체 후 계속 진행합니다. 버킷 미존재처럼 복구 불가능한 에러만 전체를 중단합니다.
- **Neobrutalism 테마** — CSS 변수 기반으로 그림자 시스템을 구축하여, 컴포넌트마다 일관된 시각적 언어를 유지합니다.

### 개선할 점

- 드로우 결과 기록 (히스토리) 미구현 — 누가 무엇을 뽑았는지 추적할 수 없음
- 아이템 소진 로직 미구현 — 현재는 같은 아이템이 무한으로 당첨 가능
- 뽑기 화면에서 아이템 이미지 미리보기가 작아서 모바일에서 식별이 어려움
- OG 메타태그 미설정 — 공유 URL의 미리보기가 기본값으로 표시됨
