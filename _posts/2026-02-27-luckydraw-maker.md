---
title: LuckyDraw Maker 구축기
date: 2026-02-27
layout: post
---

# LuckyDraw Maker

> 아이돌 이벤트 카페를 위한 감성 럭키드로우 메이커 — 만들고, 공유하고, 뽑기까지.

Next.js + Supabase + Tailwind CSS 기반의 럭키드로우 생성/운영 플랫폼입니다. 이벤트 카페 운영자가 커스텀 럭키드로우를 만들고, URL 하나로 참가자와 공유하고, 실시간 확률 기반 뽑기를 실행할 수 있습니다.

---

## 서비스 개요

이벤트 카페에서 럭키드로우를 운영하려면 물리적 상자를 준비하거나 복잡한 엑셀 시트를 관리해야 합니다. LuckyDraw Maker는 이 과정을 웹으로 옮겨, **5분 안에 커스텀 럭키드로우를 만들고 참가자에게 공유**할 수 있게 합니다.

### 핵심 기능

| 기능 | 설명 |
|------|------|
| 럭키드로우 생성 | 아이템, 수량, 이미지, 확률 모드 설정 |
| URL 공유 | `/play/[id]` 링크로 비로그인 참가 가능 |
| 실시간 뽑기 | 애니메이션 + 결과 표시 + 수량 자동 차감 |
| 보관함 | 내가 만든 드로우 목록 관리 |
| 수정/조정 | 잔여 수량 조정, 확률 표시, 새창 뽑기 |
| 3가지 테마 | 네오브루탈, PC통신, 코튼캔디 소녀 |
| 관리자 대시보드 | 회원/드로우/공지/피드백 관리 |
| 공지사항 시스템 | 마크다운 에디터, 읽음 추적, 고정 기능 |
| 피드백 수집 | 카테고리별 의견 수집 + 이메일 알림 |

---

## 기술 스택

| 항목 | 선택 | 이유 |
|------|------|------|
| 프레임워크 | Next.js 16 (App Router) | SSR/SSG + API Routes + 미들웨어 |
| 언어 | TypeScript (strict) | Props/DB 타입 안전성 확보 |
| 인증 | Supabase Auth + Google OAuth | 소셜 로그인 원클릭 도입 |
| 데이터베이스 | Supabase (PostgreSQL) | RLS 기본 내장, Realtime 지원 |
| 스타일링 | Tailwind CSS 4 | 테마 시스템 + 유틸리티 조합 |
| 상태관리 | Zustand 5 | 경량 + persist 미들웨어 |
| 폼 | React Hook Form + Zod 4 | 스키마 기반 유효성 검증 |
| 애니메이션 | Framer Motion 12 | 뽑기 인터랙션 연출 |
| UI 기반 | Radix UI | Dialog, Select, Switch 등 접근성 보장 |
| 이메일 | Resend | 피드백 알림 발송 |
| 에디터 | @uiw/react-md-editor | 공지사항 마크다운 작성 |

---

## 아키텍처

```
[사용자]
  │
  ├─ Landing ─── Google OAuth ──→ Supabase Auth
  │                                    │
  │                                    ▼
  ├─ /create ──→ LuckyDrawEditor ──→ lucky_draws + draw_items
  │                                    │
  ├─ /vault ───→ LuckyDrawCard[] ←──── SELECT (user_id = me)
  │                                    │
  ├─ /draw/[id] → DrawItemCard[] ←──── SELECT (draw_id)
  │                                    │
  ├─ /play/[id] → DrawScreen ───────→ API /draw/[id]/pick
  │                                    │
  │                                    ▼
  │                              decrement_item_quantity()
  │                              (PostgreSQL Atomic RPC)
  │                                    │
  │                                    ▼
  │                              { item, remaining }
  │
  ├─ /admin ───→ 회원 관리 ──────→ profiles + admins
  │           ├→ 드로우 관리 ────→ lucky_draws (전체)
  │           ├→ 공지사항 ───────→ announcements + reads
  │           └→ 피드백 ─────────→ feedbacks
  │
  └─ Middleware ── JWT 검증 ── 경로 보호 ── 관리자 권한 확인
```

---

## 데이터 모델

### 핵심 테이블

```
profiles ──────────── lucky_draws ──────── draw_items
  id (UUID, PK)        id (UUID, PK)        id (UUID, PK)
  display_name          user_id → profiles   draw_id → lucky_draws
  avatar_url            name                 name
  created_at            draw_button_label    quantity (> 0)
                        probability_mode     remaining (≥ 0)
                        is_active            image_url
                        created_at           sort_order
                        updated_at
```

### 관리 테이블

| 테이블 | 용도 | 주요 컬럼 |
|--------|------|-----------|
| `admins` | 관리자 지정 | user_id, granted_at |
| `announcements` | 공지사항 | title, content(MD), is_pinned, is_published |
| `announcement_reads` | 읽음 추적 | user_id + announcement_id (복합 PK) |
| `feedbacks` | 피드백 수집 | sender_email, subject, message, category, is_read |

### Row-Level Security

모든 테이블에 RLS를 적용하여, 데이터 접근을 서버 단에서 강제합니다.

| 정책 | 규칙 |
|------|------|
| `profiles_self` | 자신의 프로필만 조회/수정 |
| `draws_owner` | 자신의 드로우만 CRUD |
| `items_owner` | 드로우 소유자만 아이템 접근 |
| `draws_authenticated_read` | 인증된 사용자는 드로우 읽기 가능 |
| `announcements_public_read` | 게시된 공지는 누구나 읽기 |
| `announcements_admin_all` | 관리자는 전체 접근 |
| `feedbacks_insert_own` | 자신의 피드백만 작성 |
| `feedbacks_admin_read` | 관리자만 전체 피드백 조회 |

---

## 뽑기 알고리즘

`src/lib/lottery.ts`에 구현된 확률 엔진은 2가지 모드를 지원합니다.

### Equal 모드

잔여 수량이 있는 아이템 중 균등 확률로 선택합니다.

```
아이템 A (남은 5개) → 33.3%
아이템 B (남은 3개) → 33.3%
아이템 C (남은 1개) → 33.3%
```

### Weighted 모드

잔여 수량을 가중치로 사용하여, 많이 남은 아이템이 더 높은 확률로 선택됩니다.

```
아이템 A (남은 5개) → 5/9 = 55.6%
아이템 B (남은 3개) → 3/9 = 33.3%
아이템 C (남은 1개) → 1/9 = 11.1%
```

누적 확률 감산 방식으로 구현됩니다. `Math.random() * totalRemaining`으로 난수를 생성하고, 아이템 순서대로 `remaining`을 빼면서 0 이하가 되는 시점의 아이템을 반환합니다.

### Atomic 수량 차감

뽑기 결과 확정 시 PostgreSQL RPC 함수 `decrement_item_quantity()`로 원자적 수량 차감을 실행합니다. 동시 접속 환경에서도 재고가 음수로 내려가지 않습니다.

```sql
-- remaining > 0 인 경우에만 차감
UPDATE draw_items
SET remaining = remaining - 1
WHERE id = p_item_id AND remaining > 0
RETURNING remaining;
```

---

## 테마 시스템

3가지 테마를 CSS 변수 + `data-theme` 셀렉터로 구현했습니다. Zustand `persist` 미들웨어로 선택이 `localStorage`에 저장됩니다.

### 기본: 네오브루탈 (dark-glass)

```
배경: #0D1B3E (다크 네이비)
스타일: 글래스모피즘 카드, 3px 보더, 브루탈 섀도우
폰트: Bagel Fat One (디스플레이) + Gothic A1 (본문)
효과: StarField 배경 애니메이션
```

### PC통신 (retro-pc)

```
배경: #000080 (윈도우 블루)
스타일: ASCII 윈도우 프레임, 모노스페이스, 스캔라인 오버레이
폰트: DungGeunMo (커스텀 픽셀 폰트)
효과: CRT 모니터 시뮬레이션, 깜빡이는 커서
```

### 코튼캔디 소녀 (cotton-candy)

```
배경: 민트/파스텔 그라디언트
스타일: 50px 라운드 버튼, 부드러운 섀도우, 방울 애니메이션
폰트: Bagel Fat One + 파스텔 색상 체계
효과: CandyParticles, bubble-float, heart-pop, candy-shimmer
```

### 관리자 전용 스타일

관리자 페이지는 `[data-admin]` 셀렉터로 **사용자 테마와 완전 격리**됩니다. Pretendard 폰트, 1px 보더, 최소한의 섀도우로 깔끔한 업무용 UI를 유지합니다.

---

## 뽑기 화면 연출

`DrawScreen.tsx`는 테마별로 완전히 다른 뽑기 경험을 제공합니다.

| 테마 | 뽑기 연출 |
|------|-----------|
| dark-glass | 글래스 카드 플립 + ConfettiPieces |
| retro-pc | RetroProgressBar + TypewriterText + 깜빡이는 ASCII |
| cotton-candy | ShuffleAnimation(이모지 슬롯) + CandyBurst + CandyConfetti |

뽑기 흐름:

```
버튼 클릭 → 셔플 애니메이션 (1~2초)
         → POST /api/draw/[id]/pick
         → 서버: 확률 계산 → 수량 차감 → 결과 반환
         → 결과 카드 등장 + 축하 이펙트
         → 잔여 수량 UI 갱신
```

---

## 인증 & 보안

### 인증 흐름

```
Landing → Google OAuth → Supabase Auth
       → /auth/callback → Session Cookie 설정
       → /vault (리다이렉트)
```

### 미들웨어 보호

`src/middleware.ts`에서 경로별 접근을 제어합니다.

| 경로 | 접근 조건 |
|------|-----------|
| `/vault`, `/draw`, `/create`, `/edit` | 인증된 사용자 |
| `/play/[id]` | 인증 불필요 (공개) |
| `/admin/*` | 인증 + `is_admin()` RPC 검증 |
| `/api/draw/[id]/pick` | 인증 + Rate Limit (10회/60초) |

### Rate Limiting

뽑기 API와 피드백 API에 속도 제한을 적용하여 남용을 방지합니다.

---

## 관리자 시스템

### 대시보드 구조

```
/admin
  ├── 회원 관리 (/users)      — 목록, 관리자 지정/해제, 삭제
  ├── 드로우 관리 (/draws)     — 전체 드로우 목록, 활성/비활성, 삭제, 상세
  ├── 공지사항 (/announcements) — CRUD, 마크다운 에디터, 고정/게시
  └── 피드백 (/feedbacks)      — 수신함, 읽음 표시, 카테고리 필터
```

### 최근 업데이트: 테이블 UI 전환

초기에는 카드 레이아웃으로 관리 데이터를 표시했으나, 데이터 밀도가 높아지면서 **테이블 레이아웃으로 전환**했습니다. Framer Motion의 카드 스태거 애니메이션을 제거하고, 행 단위 호버/액션으로 전환하여 정보 탐색 효율을 높였습니다.

### 관리자 디자인 시스템 독립화

관리자 페이지에 사용자 테마(네오브루탈, PC통신, 코튼캔디)가 적용되면 업무 효율이 떨어집니다. `AdminContext`를 도입하여 관리자 영역의 스타일을 완전히 격리했습니다. `[data-admin]` CSS 셀렉터로 Pretendard 폰트, 미니멀 보더, 소프트 섀도우를 강제 적용합니다.

---

## API 설계

### POST `/api/draw/[id]/pick`

```
요청: { } (인증 쿠키만 필요)
응답: { success: true, item: { id, name, imageUrl }, remaining: 4 }
에러: 401 (미인증) | 429 (Rate Limit) | 404 (드로우 없음) | 410 (소진)
```

서버 사이드에서 확률 계산 → 수량 차감 → 결과 반환의 전체 과정이 실행됩니다. 클라이언트에 재고 데이터를 노출하지 않아 조작을 방지합니다.

### POST `/api/feedback`

```
요청: { email, subject, message, category }
검증: Zod 스키마 (subject 1~100자, message 10~2000자)
처리: DB 저장 → Resend로 관리자 이메일 알림
```

---

## 프로젝트 구조

```
luckydraw-maker/
├── src/
│   ├── app/                         # Next.js App Router
│   │   ├── page.tsx                 # 랜딩 (Google 로그인)
│   │   ├── layout.tsx               # 루트 레이아웃 + Providers
│   │   ├── globals.css              # 3가지 테마 CSS 변수
│   │   ├── auth/callback/           # OAuth 콜백
│   │   ├── create/                  # 드로우 생성
│   │   ├── vault/                   # 보관함 (내 드로우 목록)
│   │   ├── draw/[id]/               # 드로우 상세
│   │   ├── edit/[id]/               # 드로우 수정
│   │   ├── play/[id]/               # 공개 뽑기 화면
│   │   ├── admin/                   # 관리자 대시보드
│   │   │   ├── users/               # 회원 관리
│   │   │   ├── draws/               # 드로우 관리
│   │   │   ├── announcements/[id]/  # 공지 에디터
│   │   │   └── feedbacks/           # 피드백 수신함
│   │   └── api/
│   │       ├── draw/[id]/pick/      # 뽑기 API
│   │       └── feedback/            # 피드백 API
│   ├── components/
│   │   ├── domain/                  # 도메인 컴포넌트
│   │   │   ├── DrawScreen.tsx       # 뽑기 화면 (테마별 3종)
│   │   │   ├── LuckyDrawEditor.tsx  # 드로우 생성/수정 폼
│   │   │   ├── LuckyDrawCard.tsx    # 드로우 카드
│   │   │   ├── DrawItemCard.tsx     # 아이템 카드
│   │   │   ├── AnnouncementPanel.tsx
│   │   │   ├── AnnouncementDetail.tsx
│   │   │   └── FeedbackModal.tsx
│   │   ├── ui/                      # 범용 UI 컴포넌트
│   │   │   ├── Button.tsx
│   │   │   ├── Badge.tsx
│   │   │   ├── GlassCard.tsx        # 글래스모피즘 카드
│   │   │   ├── ImageUpload.tsx      # 이미지 업로드 + 압축
│   │   │   ├── Toast.tsx
│   │   │   ├── LoadingSpinner.tsx
│   │   │   ├── BackgroundEffect.tsx # 테마별 배경 효과
│   │   │   ├── StarField.tsx        # 별 애니메이션
│   │   │   └── CandyParticles.tsx   # 파티클 효과
│   │   ├── layout/                  # 레이아웃
│   │   │   ├── Header.tsx
│   │   │   ├── AdminNav.tsx         # 관리자 네비게이션
│   │   │   ├── HamburgerMenu.tsx
│   │   │   └── ThemeSelector.tsx    # 테마 전환기
│   │   └── providers/               # Context Providers
│   ├── lib/
│   │   ├── supabase/                # Supabase 클라이언트 (서버/클라이언트)
│   │   ├── lottery.ts               # 뽑기 확률 알고리즘
│   │   ├── announcements.ts
│   │   ├── imageUtils.ts            # 이미지 압축 유틸
│   │   ├── rateLimit.ts             # Rate Limiter
│   │   └── utils.ts
│   ├── stores/                      # Zustand 스토어
│   │   ├── drawStore.ts             # 뽑기 상태
│   │   ├── themeStore.ts            # 테마 상태 (persist)
│   │   ├── uiStore.ts               # UI/Toast 상태
│   │   └── adminFeedbackStore.ts    # 관리자 피드백 상태
│   ├── contexts/
│   │   └── AdminContext.tsx          # 관리자 컨텍스트 (테마 격리)
│   ├── hooks/                       # 커스텀 훅
│   │   ├── useAuth.ts               # 인증
│   │   ├── useIsAdmin.ts            # 관리자 확인
│   │   ├── useLuckyDraws.ts         # 드로우 CRUD
│   │   ├── useAnnouncements.ts      # 공지사항
│   │   ├── useAdminUsers.ts         # 관리자: 회원 관리
│   │   ├── useAdminDraws.ts         # 관리자: 드로우 관리
│   │   ├── useAdminDrawDetail.ts    # 관리자: 드로우 상세
│   │   └── useAdminFeedbacks.ts     # 관리자: 피드백
│   ├── types/index.ts               # 전체 타입 정의
│   └── middleware.ts                # 인증/권한 미들웨어
├── supabase/
│   ├── schema.sql                   # DB 스키마 + RLS + RPC
│   └── migrations/                  # 마이그레이션
├── public/                          # 정적 파일
├── package.json
├── next.config.ts
├── tsconfig.json
└── postcss.config.mjs
```

---

## 개발 타임라인

| 날짜 | 내용 |
|------|------|
| 2/27 | 프로젝트 생성, 전체 CRUD + 뽑기 + OAuth + URL 공유 구현 |
| 2/27 | 보관함 사용자 필터링, 뽑기 화면 UX 정리 |
| 2/28 | 수량 차감(Atomic RPC), 잔여 수량 표시/조정, 새창 뽑기 |
| 2/28 | 확률 표시 remaining 기준 변경, 보관함 개요 페이지 |
| 3/1 | 공지사항/피드백/관리자 시스템 구현, Resend 이메일 연동 |
| 3/1 | 코튼캔디 소녀 테마 추가, 관리자 디자인 시스템 독립화 |
| 3/1 | 관리자 공지 에디터 텍스트 버그 수정 |
| 3/1 | 회원 관리/드로우 관리 CRUD, 카드→테이블 UI 전환 |

---

## 회고

### 잘된 점

- **Supabase RLS 기반 보안** — 테이블 레벨에서 접근 제어가 강제되므로, API 코드에서 권한 체크를 누락해도 데이터가 보호됩니다.
- **Atomic RPC로 동시성 처리** — 이벤트 카페에서 여러 참가자가 동시에 뽑기를 실행해도 재고가 음수로 떨어지지 않습니다.
- **테마 시스템** — CSS 변수 기반 3가지 테마로 이벤트 분위기에 맞는 커스터마이징이 가능합니다. 관리자 영역은 `[data-admin]`으로 격리하여 업무 효율을 유지합니다.
- **공개 뽑기 URL** — `/play/[id]`는 인증 없이 접근 가능하여, 참가자에게 URL만 공유하면 됩니다.
- **빠른 프로토타이핑** — Next.js App Router + Supabase 조합으로 4일 만에 CRUD부터 관리자 대시보드까지 완성했습니다.

### 개선할 점

- 뽑기 결과 히스토리/로그 기능 추가
- 드로우 통계 대시보드 (참여율, 소진율 차트)
- 이미지 CDN 최적화 (현재 Supabase Storage 직접 서빙)
- E2E 테스트 도입 (Playwright)
- 모바일 앱 PWA 지원
