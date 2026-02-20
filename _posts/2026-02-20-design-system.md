---
title: Design System 구축기
date: 2026-02-20
layout: post
---

# @makestar/design-system 구축기

React + TypeScript + Tailwind CSS 기반의 사내 디자인 시스템을 구축한 과정을 기록합니다.

---

## 기술 스택 선정

| 항목 | 선택 | 이유 |
|------|------|------|
| UI 라이브러리 | React 19 | 팀 내 주력 프레임워크, 최신 버전 채택 |
| 언어 | TypeScript (strict) | 컴포넌트 Props 타입 안전성 확보 |
| 빌드 도구 | Vite 7 | 빠른 HMR, 라이브러리 모드 지원 |
| 스타일링 | Tailwind CSS 4 | 유틸리티 기반 + CSS 변수 조합으로 테마 대응 |
| 출력 포맷 | ES Module + CommonJS | 다양한 소비 환경 호환 |

---

## Phase 1 — 프로젝트 셋업

Vite의 React + TypeScript 템플릿으로 프로젝트를 생성하고, **듀얼 빌드 모드**를 구성했습니다.

하나의 `vite.config.ts`에서 환경 변수로 빌드 대상을 분기합니다:

- `BUILD_LIB=true` → 라이브러리 빌드 (`dist/`에 `.mjs` + `.cjs` 출력)
- 기본 → 데모 앱 빌드 (`dist-demo/`)

TypeScript 설정은 용도별로 분리했습니다:

- `tsconfig.app.json` — 데모 앱용 (React JSX, ES2022)
- `tsconfig.lib.json` — 라이브러리용 (선언 파일 생성, 데모 코드 제외)
- `tsconfig.node.json` — Vite 등 빌드 도구용

`package.json`의 엔트리 포인트를 설정하여 소비자가 어떤 환경에서든 import할 수 있도록 했습니다:

```json
{
  "main": "./dist/index.cjs",
  "module": "./dist/index.mjs",
  "types": "./dist/index.d.ts"
}
```

---

## Phase 2 — 디자인 토큰 시스템

디자인 시스템의 근간이 되는 토큰을 **Figma → JSON → TypeScript → CSS 변수** 파이프라인으로 구축했습니다.

### Figma 토큰 추출

Figma에서 3개의 시맨틱 토큰 JSON 파일을 추출했습니다:

- `Palette.tokens.json` — 12개 색상군의 기본 팔레트 (RGB + Hex 값)
- `Light.tokens.json` — 라이트 테마 시맨틱 매핑
- `Dark.tokens.json` — 다크 테마 시맨틱 매핑

### 색상 토큰

`src/tokens/colors.ts`에 12개 색상군을 정의했습니다. 각 색상군은 10~11단계(001~099)의 스케일을 가집니다.

```
Gray · Red · Orange · Yellow · Lime · Green
Blue · Indigo · Purple · Pink + Brand1 · Brand2
```

추가로 `staticColors`(Black/White)와 `overlayColors`(알파값 포함)를 분리하고, `ColorName`, `ColorStep` 타입을 export하여 타입 안전한 색상 접근을 보장했습니다.

### 타이포그래피 토큰

`src/tokens/typography.ts`에 4개 카테고리를 정의했습니다:

| 카테고리 | 용도 | 크기 범위 | Weight |
|----------|------|-----------|--------|
| headline | 대형 표시 텍스트 | 60px ~ 20px | Bold (700) |
| title | 섹션 제목 | 18px ~ 12px | Bold (700) |
| bold | 강조 본문 | 18px ~ 12px | Semibold (600) |
| body | 일반 본문 | 16px ~ 12px | Regular (400) |

`getTypographyStyle(variant)` 헬퍼 함수로 variant 문자열 하나로 스타일 객체를 꺼낼 수 있게 했습니다.

### CSS 커스텀 프로퍼티

`src/index.css`에서 시맨틱 CSS 변수를 테마별로 정의했습니다:

```css
:root {
  --sem-fg-default: ...;
  --sem-surface-default: ...;
  --sem-edge-default: ...;
}

[data-theme="dark"] {
  --sem-fg-default: ...;
  --sem-surface-default: ...;
  --sem-edge-default: ...;
}
```

변수 네이밍 체계는 `--sem-{카테고리}-{의미}` 패턴을 따릅니다:

- `--sem-fg-*` — 전경/텍스트 (default, subtle, subtlest, selected, disabled, danger 등)
- `--sem-surface-*` — 배경/표면
- `--sem-edge-*` — 테두리/스트로크
- `--sem-interaction-*` — 인터랙션 상태 (hovered, pressed, focused, disabled)
- `--sem-*-accent-*` — 색상별 액센트

---

## Phase 3 — 테마 시스템

Light/Dark 테마를 런타임에 전환할 수 있는 Context 기반 테마 시스템을 구현했습니다.

`ThemeProvider`가 제공하는 기능:

- `useTheme()` — 현재 테마 읽기
- `setTheme(theme)` — 테마 변경
- `toggleTheme()` — Light ↔ Dark 토글
- `localStorage`(`mds-theme` 키)로 사용자 선택 영속화
- SSR-safe 처리 (`window` 존재 여부 확인)
- `<html>` 태그에 `data-theme` 속성 자동 적용

CSS 변수가 `data-theme` 셀렉터에 따라 전환되므로, 모든 컴포넌트가 별도 작업 없이 테마를 반영합니다.

---

## Phase 4 — 컴포넌트 개발

총 12개 컴포넌트를 구현했습니다. 모든 컴포넌트에 공통으로 적용한 패턴은 다음과 같습니다:

- **forwardRef** — ref 전달 지원
- **HTML 속성 확장** — 네이티브 속성을 그대로 사용 가능
- **Record 기반 Tailwind 클래스 매핑** — variant/size별 클래스를 Record로 관리
- **시맨틱 토큰 활용** — 하드코딩된 색상 대신 CSS 변수 사용
- **접근성** — ARIA 속성, focus-visible 상태, label 연결

### 컴포넌트 목록

**Button** — 6가지 타입(default, brand1, brand2, inverse, red, orange), 5가지 크기(sm~xxl), outline 변형, loading 상태, 좌/우 아이콘 지원

**Input** — 텍스트 입력 필드. 라벨, 헬퍼 텍스트(info/success/danger), 글자수 카운터, 클리어 버튼, 상태별 스타일링(success, danger, readonly)

**Select** — 드롭다운 선택기. 트리거 타입(dropdown, chip, button, badge), 옵션 배열 기반, 키보드/클릭 인터랙션

**Chips** — 태그/칩 컴포넌트. 선택 가능, 해제 가능 변형

**Badge** — 배지/라벨. 2가지 shape(square, round), 18가지 색상, 좌/우 아이콘

**Avatar** — 프로필 아바타. 이미지, 이니셜 텍스트, 기본 아이콘 3가지 상태. 4가지 크기(16/24/32/48px)

**Typography** — 시맨틱 텍스트 렌더링. 카테고리+variant 조합으로 적절한 HTML 요소(h1~h6, p, span)를 자동 선택

**Icon** — SVG 아이콘 시스템. `iconPaths.ts`에 경로 매핑, 4가지 크기(16/20/24/32), 동적 색상

**Infobox** — 정보 박스/알림 컴포넌트. 아이콘 지원, 해제 가능

**List / ListItem** — 리스트 컴포넌트. 3가지 크기, 선택 상태 지원

**DataTable** — 복합 컴포넌트 패턴(DataTable, DataTableHead, DataTableRow, DataTableCell). 셀 타입(text, number, badge, action), 고정 열(sticky) 지원

**Control** — 폼 컨트롤 3종 세트:
- Checkbox — 체크, 미체크, indeterminate 3가지 상태
- Radio — 라디오 버튼
- Switch — 토글 스위치

---

## Phase 5 — 데모 앱

컴포넌트를 시각적으로 확인하고 문서화하기 위한 데모 앱을 만들었습니다.

멀티 페이지 구조로 컴포넌트별 14개 페이지를 구성했습니다:

```
Avatar · Badge · Button · Chips · Colors · Control
DataTable · Icon · Infobox · Input · List · Select · Typography
```

각 페이지에서 Props 테이블, 코드 블록, 다양한 variant 쇼케이스를 제공합니다.

데모 전용 유틸리티 컴포넌트(`CodeBlock`, `PropsTable`, `Section`, `ShowcaseRow`, `Toast`)도 함께 구현했습니다.

---

## Phase 6 — 빌드 & 배포

### 빌드

```bash
npm run build        # 라이브러리 → dist/ (ES + CJS + d.ts)
npm run build:demo   # 데모 앱 → dist-demo/
```

라이브러리 빌드는 `react`, `react-dom`을 external로 처리하여 번들 크기를 최소화했습니다. 트리셰이킹이 가능한 ES Module 포맷을 기본으로 제공합니다.

### 배포

- **데모 앱** — Vercel에 자동 배포 (`vercel.json` 설정)
- **라이브러리** — npm 패키지로 배포 (peer dependency: React 18 또는 19)

---

## 프로젝트 구조

```
design-system/
├── semantic/                    # Figma 토큰 JSON
│   ├── Palette.tokens.json
│   ├── Light.tokens.json
│   └── Dark.tokens.json
├── src/
│   ├── index.ts                 # 메인 엔트리
│   ├── index.css                # 글로벌 스타일 + CSS 변수
│   ├── tokens/
│   │   ├── colors.ts            # 색상 토큰
│   │   └── typography.ts        # 타이포그래피 토큰
│   ├── theme/
│   │   └── ThemeProvider.tsx     # 테마 컨텍스트
│   ├── components/
│   │   ├── Avatar/
│   │   ├── Badge/
│   │   ├── Button/
│   │   ├── Chips/
│   │   ├── Control/             # Checkbox, Radio, Switch
│   │   ├── DataTable/
│   │   ├── Icon/
│   │   ├── Infobox/
│   │   ├── Input/
│   │   ├── List/
│   │   ├── Select/
│   │   └── Typography/
│   └── demo/                    # 데모 앱
│       ├── App.tsx
│       ├── components/
│       ├── data/
│       └── pages/               # 14개 컴포넌트 데모 페이지
├── dist/                        # 라이브러리 빌드
├── dist-demo/                   # 데모 앱 빌드
├── vite.config.ts
├── tsconfig.json
└── package.json
```

---

## 회고

### 잘된 점

- **Figma → 코드 파이프라인** — 디자이너가 Figma에서 토큰을 변경하면 JSON 추출 후 코드에 바로 반영할 수 있는 구조를 만들었습니다.
- **시맨틱 토큰 3단계 구조** — Palette → Semantic → CSS 변수로 관심사를 분리하여, 테마 추가 시 시맨틱 레이어만 매핑하면 됩니다.
- **듀얼 빌드** — 하나의 설정으로 라이브러리와 데모를 모두 빌드할 수 있어 관리 포인트가 줄었습니다.

### 개선할 점

- 토큰 변환 자동화 스크립트 보강 필요
- Storybook 도입 검토 (현재 자체 데모 앱으로 대체 중)
- 컴포넌트 단위 테스트 추가
- 접근성 자동 테스트(axe 등) 도입
