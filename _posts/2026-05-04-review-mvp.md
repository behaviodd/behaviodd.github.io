---
title: Review MVP 구축기
date: 2026-05-04
layout: post
---

# Review MVP

> 조직의 인사평가를 체계적으로 관리하는 성과 리뷰 시스템

**URL**: 비공개 (사내 서비스)

## 서비스 개요

Review MVP는 조직 내 인사평가 프로세스를 디지털화한 성과 리뷰 관리 시스템입니다. 평가 주기(Cycle) 생성부터 셀프 리뷰, 팀 리뷰, 피어 리뷰 작성, 승인 플로우까지 전체 평가 과정을 하나의 플랫폼에서 처리합니다.

Google Workspace 환경에 최적화되어, Google OAuth SSO로 인증하고 Google Sheets를 데이터베이스로 활용합니다. 별도 서버 인프라 없이 Google Apps Script를 백엔드로 사용하여 운영 비용을 최소화했습니다.

---

## 핵심 기능

### 평가 주기(Cycle) 관리

관리자가 평가 주기를 생성하고 템플릿 기반의 리뷰 폼을 구성합니다. 주기별로 시작/마감일을 설정하고, 발행(Publish)/마감(Close) 상태를 관리합니다.

### 리뷰 작성 (Self / Team / Peer)

- **셀프 리뷰**: 본인이 직접 작성하는 자기 평가
- **팀 리뷰**: 리더가 팀원에 대해 작성하는 평가
- **피어 리뷰**: 동료 간 상호 평가 (승인 플로우 포함)

### 팀 관리

조직 계층 구조를 반영한 팀 관리 기능입니다. 멤버 프로필, 평가권자 지정, 역할(admin/leader/member) 기반 접근 제어를 지원합니다. 대량 멤버 일괄 작업도 가능합니다.

### 대시보드 & 리포트

관리자 대시보드에서 전체 평가 진행 현황을 확인하고, 직원 대시보드에서 개인 리뷰 상태를 추적합니다. Recharts 기반 시각화로 통계를 제공합니다.

### 목표(Goals) & 피드백

목표 설정 및 추적, 피드백 관리 기능을 제공합니다. 폴더 구조로 피드백을 정리할 수 있습니다.

### 승인 & 감사 로그

승인 대기 큐, 변경 이력 추적(Audit Log), 권한 관리 등 관리자를 위한 운영 도구를 제공합니다.

### 자동 승인 모드 (R8)

초기 롤아웃 기간에 최초 로그인 사용자를 자동 승인하는 기능입니다. 도메인 검증, 거부 이메일 차단, 감사 로그 기록 등 안전장치를 포함합니다.

### 인앱 가이드

사용자를 위한 멀티 페이지 가이드 시스템입니다. 스크린샷과 단계별 설명으로 주요 기능 사용법을 안내합니다.

---

## 기술 스택

| 항목 | 선택 | 이유 |
|------|------|------|
| 프레임워크 | React 19 + Vite 8 | 빠른 HMR, 경량 빌드 |
| 언어 | TypeScript (strict) | 타입 안전성, API 응답 검증 |
| 스타일링 | Tailwind CSS 3 | 유틸리티 기반 빠른 UI 구성 |
| UI 컴포넌트 | Radix UI | 접근성 기본 제공, 헤드리스 컴포넌트 |
| 상태관리 | Zustand | 12개 스토어로 도메인별 상태 분리 |
| 폼 | React Hook Form + Zod | 복잡한 리뷰 폼 검증 |
| 차트 | Recharts | 대시보드 통계 시각화 |
| 라우팅 | React Router DOM 7 | 34개 페이지 라우팅 |
| 인증 | Google OAuth (SSO) | 사내 도메인 제한 로그인 |
| DB | Google Sheets | 별도 DB 서버 불필요, 관리자 직접 확인 가능 |
| 백엔드 | Google Apps Script | 서버리스, Google Workspace 네이티브 연동 |
| 테스트 | Vitest + Playwright | 단위 테스트 36개 + E2E |
| 배포 | Vercel | 자동 빌드, 프리뷰 배포 |

---

## 아키텍처

```
[Login Page]
  └── Google OAuth (도메인 제한: makestar.com)
       └── Role 분기
            │
            ▼
[Admin Dashboard]                    [Employee Dashboard]
  ├── 평가 현황 요약                    ├── 내 리뷰 현황
  ├── 승인 대기 목록                    ├── 셀프 리뷰 작성
  └── 팀별 진행률                      └── 받은 리뷰 확인
            │
            ▼
[Review Cycles]
  ├── 주기 생성 → Template 선택
  │     └── 폼 항목 구성
  ├── 발행 → 팀원에게 알림
  └── 마감 → 리포트 생성

[Team Management]
  ├── 멤버 목록 / 프로필
  ├── 평가권자 지정
  ├── 역할 관리 (admin / leader / member)
  └── 조직도 동기화

[Review Writing]
  ├── /reviews/me → 셀프 리뷰 작성
  ├── /reviews/team → 팀 리뷰 작성
  └── /reviews/received → 받은 리뷰 확인

[Settings & Admin]
  ├── 자동 승인 토글
  ├── 프로필 필드 커스텀
  ├── 권한 매트릭스
  └── 감사 로그
```

---

## 데이터 모델 (Google Sheets)

Google Sheets를 데이터베이스로 활용하며, 각 시트가 테이블 역할을 합니다.

```
[Members 시트]
├── id, email, name, team
├── role (admin / leader / member)
├── reviewer_id (평가권자)
└── status (active / inactive)

[Cycles 시트]
├── id, name, template_id
├── start_date, end_date
├── status (draft / published / closed)
└── created_by

[Reviews 시트]
├── id, cycle_id, writer_id, target_id
├── type (self / team / peer)
├── status (draft / submitted / approved)
├── content (JSON)
└── submitted_at, approved_at

[Templates 시트]
├── id, name, sections (JSON)
└── created_by, created_at
```

### 권한 매트릭스

| 역할 | 팀 관리 | 주기 생성 | 리뷰 작성 | 승인 | 설정 |
|------|---------|-----------|-----------|------|------|
| Admin | ✓ | ✓ | ✓ | ✓ | ✓ |
| Leader | 본인 팀 | ✗ | 팀원 대상 | ✗ | ✗ |
| Member | ✗ | ✗ | 본인만 | ✗ | ✗ |

---

## 작업 과정

### Phase 1 — 인증 & 기본 구조

Google OAuth SSO를 구현하고, 사내 도메인(makestar.com)으로 접근을 제한했습니다. Zustand 기반 authStore에서 사용자 정보와 역할을 관리하며, 역할에 따라 대시보드와 접근 가능한 메뉴가 분기됩니다.

React Router로 34개 페이지의 라우팅을 구성하고, 역할 기반 가드를 적용했습니다. Radix UI 컴포넌트를 `Ms` 접두사로 래핑하여 프로젝트 디자인 시스템에 맞게 커스터마이징했습니다.

### Phase 2 — 팀 관리 & 조직 구조

팀 멤버 CRUD, 평가권자 지정, 역할 관리를 구현했습니다. Google Sheets의 Members 시트와 양방향 동기화하여, 시트에서 직접 수정한 내용도 앱에 반영됩니다.

프로필 필드를 커스터마이징할 수 있는 설정 페이지를 추가하여, 조직마다 필요한 정보 항목을 자유롭게 구성할 수 있습니다.

### Phase 3 — 평가 주기 & 템플릿

평가 주기(Cycle) 생성/발행/마감 플로우를 구현했습니다. 템플릿 기반으로 리뷰 폼을 구성하며, 섹션과 항목을 자유롭게 추가/수정할 수 있습니다.

주기 발행 시 대상 멤버에게 알림이 전송되고, 마감 시 자동으로 리포트가 생성됩니다.

### Phase 4 — 리뷰 작성 & 승인

셀프 리뷰, 팀 리뷰, 피어 리뷰 작성 화면을 구현했습니다. React Hook Form + Zod로 복잡한 폼 검증을 처리하고, 임시 저장(draft) 기능으로 작성 중인 내용이 유실되지 않도록 했습니다.

승인 플로우에서는 평가권자가 제출된 리뷰를 검토하고 승인/반려할 수 있습니다. 승인 대기 목록은 관리자 대시보드에서 한눈에 확인 가능합니다.

### Phase 5 — 대시보드 & 리포트

관리자/직원 대시보드를 분리 구현하고, Recharts로 평가 진행률, 팀별 완료율 등을 시각화했습니다. 리포트 내보내기 기능으로 평가 결과를 외부에서도 활용할 수 있습니다.

### Phase 6 — UI 정합성 & 안정화 (D-3 Phase)

배포 준비 단계에서 전체 UI 정합성을 맞추는 작업을 진행했습니다:

- 헤더와 섹션 간 일관된 24px 간격 적용
- 권한 목록을 TemplateList/CycleList 패턴으로 리팩터링
- 한국어 IME 입력 처리 버그 수정 (textarea에서 조합 중 Enter 시 중복 입력)
- 리뷰 작성 영역 배경색 제거로 가독성 개선
- Admin의 `/reviews/me` 접근 시 가이드 페이지로 자동 리다이렉트

### Phase 7 — 보안 & 롤아웃 (R8)

자동 승인 모드를 구현하여 초기 롤아웃 시 사용자 온보딩을 간소화했습니다:

- Settings API를 통한 토글 관리
- 도메인 검증 + 거부 이메일 차단 리스트
- 임시 사용자 ID 생성 (`auto_YYYYMMDD_<rand>`)
- 모든 자동 승인 이벤트를 감사 로그에 기록
- 1~2주 운영 후 토글 OFF 전환 계획

---

## 설계 결정

### Google Sheets를 DB로 선택한 이유

- **운영 비용 제로**: 별도 DB 서버 비용 없음
- **관리자 친화적**: 스프레드시트에서 직접 데이터 확인/수정 가능
- **Google Workspace 통합**: 조직에서 이미 사용 중인 인프라 활용
- **트레이드오프**: 동시 쓰기 제한, 복잡한 쿼리 불가 → MVP 규모에서는 문제없음

### Radix UI + Ms 접두사 래핑

Radix UI의 접근성과 동작을 그대로 활용하면서, `MsButton`, `MsDialog`, `MsTextarea` 등으로 래핑하여 프로젝트 디자인 토큰을 적용했습니다. 헤드리스 컴포넌트 특성상 디자인 변경이 자유롭습니다.

### Zustand 12개 스토어 분리

도메인별로 스토어를 분리하여 관심사를 명확히 했습니다:

```
authStore        — 인증 상태, 사용자 정보
reviewStore      — 리뷰 데이터, CRUD
teamStore        — 팀 멤버, 조직 구조
notificationStore — 알림
goalStore        — 목표 추적
feedbackStore    — 피드백 관리
profileFieldStore — 프로필 필드 설정
auditLogStore    — 감사 로그
pendingApprovalsStore — 승인 대기
sheetsSyncStore  — Sheets 동기화 상태
folderStore      — 폴더 관리
```

---

## 프로젝트 구조

```
review-mvp/
├── src/
│   ├── pages/                    # 34개 라우트 페이지
│   │   ├── Dashboard.tsx         # 관리자 대시보드
│   │   ├── Login.tsx             # Google OAuth 로그인
│   │   ├── Settings.tsx          # 설정 (자동 승인 등)
│   │   ├── Permissions.tsx       # 권한 관리
│   │   ├── Goals.tsx             # 목표 관리
│   │   ├── Feedback.tsx          # 피드백
│   │   ├── Reports.tsx           # 리포트
│   │   ├── AuditLog.tsx          # 감사 로그
│   │   ├── Notifications.tsx     # 알림
│   │   ├── reviews/              # 리뷰 관련 페이지
│   │   │   ├── MyReviewWrite.tsx
│   │   │   ├── TeamReviewWrite.tsx
│   │   │   └── ...
│   │   ├── team/                 # 팀 관리
│   │   └── guide/                # 인앱 가이드
│   ├── components/
│   │   ├── ui/                   # Ms* 래핑 컴포넌트
│   │   ├── common/               # 공통 컴포넌트
│   │   ├── review/               # 리뷰 컴포넌트
│   │   ├── team/                 # 팀 컴포넌트
│   │   ├── dashboard/            # 대시보드 위젯
│   │   ├── permission/           # 권한 컴포넌트
│   │   ├── template/             # 템플릿 컴포넌트
│   │   └── layout/               # 레이아웃
│   ├── stores/                   # Zustand 12개 스토어
│   ├── utils/                    # 유틸리티 (30+)
│   │   ├── authApi.ts            # 인증 API
│   │   ├── settingsApi.ts        # 설정 API
│   │   ├── sheetsSync.ts         # Sheets 동기화
│   │   └── permissions.ts        # 권한 체크
│   ├── contexts/                 # React Contexts
│   └── types/                    # 타입 정의
├── api/                          # 서버 핸들러
│   ├── org-sync.ts               # 조직 동기화
│   └── review-sync.ts            # 리뷰 동기화
├── docs/                         # 문서 (13개)
└── e2e/                          # Playwright E2E 테스트
```

---

## 회고

### 잘된 점

- **Google Sheets as DB** — 별도 인프라 없이 관리자가 직접 데이터를 확인할 수 있어, 초기 MVP에서의 운영 부담을 크게 줄였습니다.
- **역할 기반 접근 제어** — admin/leader/member 3단계 역할로 화면과 기능을 깔끔하게 분리하여, 권한 관련 혼란을 방지했습니다.
- **점진적 롤아웃 설계** — 자동 승인 토글로 초기 온보딩을 간소화하면서도, 도메인 검증과 감사 로그로 보안을 유지합니다.
- **UI 컴포넌트 체계** — Radix UI를 Ms* 패턴으로 래핑하여 접근성을 기본으로 확보하면서 디자인 일관성을 유지했습니다.
- **한국어 IME 대응** — textarea에서 조합 중 Enter 처리 등 한국어 환경에서 발생하는 엣지 케이스를 꼼꼼히 수정했습니다.
- **문서화** — 13개의 handoff 문서로 프로젝트 맥락과 결정 사항을 기록하여, 인수인계와 유지보수에 대비했습니다.

### 개선할 점

- Google Sheets의 동시 쓰기 제한으로 대규모 조직에서는 충돌 가능성 존재
- 오프라인 지원 미구현 — 네트워크 끊김 시 작성 중인 리뷰가 유실될 수 있음
- 리뷰 히스토리 비교 기능 미구현 — 이전 주기와의 성장 추이를 한눈에 볼 수 없음
- E2E 테스트 커버리지 확대 필요 — 현재 핵심 플로우만 커버
