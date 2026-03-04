---
title: Design System 구축기
date: 2026-02-20
layout: post
---

# @makestar/design-system 구축기

> Figma 토큰에서 React 컴포넌트까지 — 사내 디자인 시스템을 처음부터 설계하고 구축한 과정을 기록합니다.

React + TypeScript + Tailwind CSS 기반의 사내 디자인 시스템을 구축했습니다. 디자이너와 개발자가 동일한 토큰을 공유하고, Light/Dark 테마 전환이 가능한 14개 컴포넌트(10개 폴더) 라이브러리입니다.

**데모**: [design-system-nine-lovat.vercel.app](https://design-system-nine-lovat.vercel.app)

---

## 기술 스택 선정

| 항목 | 선택 | 이유 |
|------|------|------|
| UI 라이브러리 | React 19 | 팀 내 주력 프레임워크, 최신 버전 채택 |
| 언어 | TypeScript 5.9 (strict) | 컴포넌트 Props 타입 안전성 + Discriminated Union |
| 빌드 도구 | Vite 7 | 빠른 HMR, 라이브러리 모드 지원, `@tailwindcss/vite` 통합 |
| 스타일링 | Tailwind CSS 4 | 유틸리티 기반 + `@theme` CSS 변수 조합으로 테마 대응 |
| 테스트 | Vitest + React Testing Library | 141개 테스트, 컴포넌트 단위 검증 |
| 출력 포맷 | ES Module + CommonJS | 다양한 소비 환경 호환 |

---

## 아키텍처

디자인 토큰이 Figma에서 최종 컴포넌트까지 흐르는 전체 파이프라인입니다.

```
[Figma]
  │
  ▼
[Token 추출] ── 3개 JSON 파일
  ├── Palette.tokens.json     (10색상군 × 10단계 + Overlay)
  ├── Light.tokens.json       (라이트 시맨틱 매핑)
  └── Dark.tokens.json        (다크 시맨틱 매핑)
  │
  ▼
[자동 생성] ── tools/generators/
  ├── generate-tokens.mjs  → globals.css (CSS 변수)
  ├── generate-tokens.mjs  → colors.ts + typography.ts
  └── generate-icon-paths.mjs → iconPaths.ts (SVG → TS)
  │
  ▼
[CSS 변수] ── src/styles/globals.css
  ├── @theme { --color-fg-default: ... }
  └── [data-theme="dark"] { --color-fg-default: ... }
  │
  ▼
[ThemeProvider] ── React Context
  ├── useTheme() / setTheme() / toggleTheme()
  └── data-theme 속성 자동 적용
  │
  ▼
[컴포넌트 라이브러리] ── 14개 export (10개 폴더)
  ├── Button, Input, Selector, Dropdown
  ├── Chip, ChipGroup, Badge, Avatar
  ├── Typography, Infobox, ListItem
  └── FormControl (Checkbox, Radio, Switch)
  │
  ▼
[소비] ── npm 패키지 + 데모 앱
  ├── ES Module (.mjs) ── 트리셰이킹 가능
  ├── CommonJS (.cjs) ── 레거시 호환
  └── 데모 앱 (Vercel) ── 12개 인터랙티브 쇼케이스 페이지
```

---

## Phase 1 — 프로젝트 셋업

Vite의 React + TypeScript 템플릿으로 프로젝트를 생성하고, **듀얼 빌드 모드**를 구성했습니다.

하나의 `vite.config.ts`에서 환경 변수로 빌드 대상을 분기합니다:

- `BUILD_LIB=true` → 라이브러리 빌드 (`dist/`에 `.mjs` + `.cjs` 출력)
- 기본 → 데모 앱 빌드 (`dist-demo/`)

```typescript
// vite.config.ts 핵심 구조
const isLib = process.env.BUILD_LIB === 'true'

export default defineConfig({
  root: 'docs',
  plugins: [react(), tailwindcss()],
  build: isLib
    ? {
        lib: {
          entry: resolve(__dirname, 'src/index.ts'),
          name: 'MakestarDS',
          formats: ['es', 'cjs'],
          fileName: (fmt) => `index.${fmt === 'es' ? 'mjs' : 'cjs'}`,
        },
        outDir: resolve(__dirname, 'dist'),
        rollupOptions: {
          external: ['react', 'react-dom', 'react/jsx-runtime'],
        },
      }
    : { outDir: resolve(__dirname, 'dist-demo') },
})
```

TypeScript 설정은 용도별로 분리했습니다:

| 설정 파일 | 용도 | 주요 옵션 |
|-----------|------|-----------|
| `tsconfig.app.json` | 데모 앱 | React JSX, ES2022 |
| `tsconfig.lib.json` | 라이브러리 | 선언 파일 생성, 데모 코드 제외 |
| `tsconfig.node.json` | 빌드 도구 | Vite 등 Node.js 환경 |

`package.json`의 엔트리 포인트를 설정하여 소비자가 어떤 환경에서든 import할 수 있도록 했습니다:

```json
{
  "main": "./dist/index.cjs",
  "module": "./dist/index.mjs",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": { "types": "./dist/index.d.ts", "import": "./dist/index.mjs", "require": "./dist/index.cjs" },
    "./styles": "./src/styles/globals.css"
  }
}
```

---

## Phase 2 — 디자인 토큰 시스템

디자인 시스템의 근간이 되는 토큰을 **Figma → JSON → 자동 생성 스크립트 → CSS 변수** 파이프라인으로 구축했습니다.

### Figma 토큰 추출

Figma에서 3개의 시맨틱 토큰 JSON 파일을 추출합니다:

| 파일 | 내용 | 역할 |
|------|------|------|
| `Palette.tokens.json` (60.8KB) | 10개 색상군의 기본 팔레트 | RGB + Hex 원시 값 |
| `Light.tokens.json` (193.7KB) | 라이트 테마 시맨틱 매핑 | 팔레트 → 의미 연결 |
| `Dark.tokens.json` (193.3KB) | 다크 테마 시맨틱 매핑 | 팔레트 → 의미 연결 |

### 토큰 자동 생성 스크립트

`tools/generators/generate-tokens.mjs` 스크립트가 3개 JSON 파일을 파싱하여 다음 산출물을 자동 생성합니다:

```
tokens/*.json
     │
     ▼ npm run generate:tokens
     │
     ├── src/styles/globals.css     (CSS 커스텀 프로퍼티)
     ├── src/foundations/colors/colors.ts    (타입 안전한 색상 객체)
     └── src/foundations/typography/typography.ts  (타이포그래피 스타일)
```

스크립트의 핵심 로직:

- **`toColor(val)`** — hex+alpha 값을 CSS 색상으로 변환 (완전 불투명 시 hex, 투명도 포함 시 rgba)
- **`extractTokens(obj)`** — 중첩 JSON에서 색상 토큰을 재귀적으로 추출, Figma alias 참조 보존
- **`normalizeParts(parts)`** — Figma 네이밍 컨벤션을 CSS 친화적 형식으로 변환 (예: `Text` → `fg`)
- **`getCategory(path)`** — 토큰을 시맨틱 카테고리로 분류 (Fg Core, Bg Accent, Border Interactive 등)
- **Light-mode-first 전략** — Light 값을 `@theme` 블록에 기본값으로, Dark 값을 `[data-theme="dark"]`에 오버라이드

### 색상 토큰

10개 색상군을 정의했습니다. 각 색상군은 10단계(001~099)의 스케일을 가집니다.

```
Blue · Gray · Green · Indigo · Lime
Orange · Red · Yellow + Brand1 · Brand2
```

추가로 Overlay 색상(008~080, 알파값 포함)을 분리합니다.

### 타이포그래피 토큰

4개 카테고리 × 다양한 variant를 정의했습니다:

| 카테고리 | 용도 | Variants | Weight |
|----------|------|----------|--------|
| headline | 대형 표시 텍스트 | x-large(60px), large(32px), medium(28px), small(24px), x-small(20px) | Bold (700) |
| title | 섹션 제목 | large(18px), medium(16px), small(14px), x-small(12px) | Bold (700) |
| bold | 강조 본문 | large(18px), medium(16px), small(14px), x-small(12px) | Semibold (600) |
| body | 일반 본문 | large(16px), medium(14px), small(12px) | Regular (400) |

기본 폰트 스택: **Pretendard JP Variable** + 시스템 폴백

### CSS 커스텀 프로퍼티

초기에는 `--sem-{카테고리}-{의미}` 3레이어 구조를 사용했으나, 리팩터링을 거쳐 **`--color-{카테고리}-{의미}` 2레이어 구조로 단순화**했습니다. 불필요한 간접 참조를 제거하여 CSS 변수 체인이 짧아지고, DevTools에서의 디버깅이 쉬워졌습니다.

`src/styles/globals.css`에서 시맨틱 CSS 변수를 테마별로 정의합니다:

```css
@theme {
  --color-fg-default: ...;
  --color-bg-default: ...;
  --color-border-default: ...;
}

[data-theme="dark"] {
  --color-fg-default: ...;
  --color-bg-default: ...;
  --color-border-default: ...;
}
```

변수 네이밍 체계:

| 접두사 | 역할 | 예시 |
|--------|------|------|
| `--color-fg-*` | 전경/텍스트 | default, subtle, subtlest, inverse, danger, success, warning, info |
| `--color-bg-*` | 배경 | default, subtle, disabled, selected + accent별 6상태 |
| `--color-border-*` | 테두리 | default, subtle, focused, selected + accent별 상태 |
| `--color-interaction-*` | 인터랙션 | hovered, pressed |
| `--color-elevated-*` | 입체 표면 | surface-default, surface-raised, shadow-overlay |
| `--color-fg-accent-{color}-*` | 색상별 액센트 | brand1, brand2, blue, red, green 등 × 6상태 |

**편의 별칭**도 제공합니다: `--color-fg-primary`, `--color-fg-brand1`, `--color-bg-inverse` 등

---

## Phase 3 — 테마 시스템

Light/Dark 테마를 런타임에 전환할 수 있는 Context 기반 테마 시스템을 구현했습니다.

`ThemeProvider`가 제공하는 기능:

| API | 설명 |
|-----|------|
| `useTheme()` | 현재 테마 읽기 |
| `setTheme(theme)` | 테마 변경 |
| `toggleTheme()` | Light ↔ Dark 토글 |
| localStorage(`mds-theme`) | 사용자 선택 영속화 |
| SSR-safe | `window` 존재 여부 확인 |
| `data-theme` 속성 | `<html>` 태그에 자동 적용 |

CSS 변수가 `data-theme` 셀렉터에 따라 전환되므로, 모든 컴포넌트가 별도 작업 없이 테마를 반영합니다. 컴포넌트에서 색상을 하드코딩하지 않고 시맨틱 변수만 참조하기 때문에, 테마 전환 시 전체 UI가 자동으로 업데이트됩니다.

---

## Phase 4 — 컴포넌트 개발

총 14개 컴포넌트를 10개 폴더에 구현했습니다. 모든 컴포넌트에 공통으로 적용한 패턴:

- **forwardRef** — ref 전달 지원
- **HTML 속성 확장** — 네이티브 속성을 그대로 사용 가능
- **Record 기반 Tailwind 클래스 매핑** — variant/size별 클래스를 Record로 관리
- **시맨틱 토큰 활용** — 하드코딩된 색상 대신 `--color-*` CSS 변수 사용
- **접근성** — ARIA 속성, focus-visible 상태, 키보드 내비게이션, label 연결
- **Figma 스펙 동기화** — 사이즈, 보더, 간격을 Figma 노드와 1:1 매칭

### 컴포넌트 목록

| 컴포넌트 | 설명 | 주요 Props |
|----------|------|-----------|
| **Button** | 범용 버튼 | 6 색상, 2 변형, 5 크기, selected, loading, 아이콘 |
| **Input** | 텍스트 입력 | 3 크기, 4 상태, 라벨, 헬퍼, 카운터, 클리어, 아이콘 |
| **Selector** | 고급 선택기 | 4 트리거(input/chip/button/badge), 단일/다중 선택, 키보드 내비게이션 |
| **Dropdown** | 드롭다운 | Radio/Checkbox 컨트롤, 유연한 포지셔닝 |
| **Chip** | 태그/칩 | 3 행동 타입(input/filter/action), 2 변형, 3 크기 |
| **ChipGroup** | 칩 그룹 | 다중 칩 관리 |
| **Badge** | 배지/라벨 | 2 shape(sq/round), 3 크기, 12 색상, 아이콘 |
| **Avatar** | 프로필 아바타 | 이미지/이니셜/아이콘, 4 크기(16~48px), 폴백 처리 |
| **Typography** | 시맨틱 텍스트 | 4 카테고리 × variant → 자동 HTML 요소 매핑 |
| **Infobox** | 정보 박스 | 10 타입(색상), 아이콘, 타이틀, 설명, 액션 버튼 |
| **ListItem** | 리스트 아이템 | 3 크기, 아바타/뱃지/아이콘 슬롯, 선택 상태 |
| **Checkbox** | 체크박스 | 3 크기, 3 색상, indeterminate, 체크 애니메이션 |
| **Radio** | 라디오 버튼 | 3 크기, 3 색상, 도트 인 애니메이션 |
| **Switch** | 스위치 토글 | 스트레치 ON/OFF 애니메이션 |

### Button 컴포넌트

가장 다양한 변형을 가진 Button을 예시로 설명합니다.

```
색상:    default │ brand1 │ brand2 │ inverse │ red │ orange
변형:    solid(기본) │ outline
크기:    sm(24px) │ md(32px) │ lg(40px) │ xl(48px) │ xxl(56px)
상태:    default │ hover │ pressed │ disabled │ loading │ selected
아이콘:  leftIcon │ rightIcon
```

각 색상 × 크기 × 변형 조합의 Tailwind 클래스를 Record 객체로 관리합니다. outline 변형은 크기별 보더 두께가 다릅니다 (sm/md: 1px, lg/xl/xxl: 1.5px). `isSelected` 시 4px 링이 표시됩니다.

### Selector 컴포넌트

가장 복잡한 컴포넌트로, **4가지 트리거 타입**과 **단일/다중 선택**을 지원합니다.

```
트리거:  input │ chip │ button │ badge
모드:    단일 선택 │ 다중 선택
크기:    sm │ md │ lg
상태:    default │ error │ success │ warning (input 트리거만)
```

TypeScript Discriminated Union으로 단일/다중 모드의 타입을 구분합니다:

```typescript
type SelectorProps = SelectorSingleProps | SelectorMultiProps

// 단일: value?: string, onChange?: (value: string) => void
// 다중: multiple: true, value?: string[], onChange?: (value: string[]) => void
```

주요 기능:
- 키보드 내비게이션 (화살표, Home/End, Tab, 타이핑 검색)
- 외부 클릭 감지
- 커스텀 옵션 렌더링 (`renderOption`)
- 드롭다운 폭 모드: `trigger`(트리거 매칭) / `auto`
- 폼 제출용 `<input type="hidden">` 자동 삽입
- 다중 선택 시 Chip 배열로 표시 + 개별 제거
- ARIA-compliant (combobox, listbox 역할)

### Chip 컴포넌트

3가지 **행동 타입**으로 같은 컴포넌트가 다른 역할을 수행합니다:

| 타입 | 역할 | 렌더링 | 특징 |
|------|------|--------|------|
| `input` | 입력된 값 표시 | `<div>` (중첩 버튼 방지) | 닫기 버튼 포함 |
| `filter` | 필터 선택/해제 | `<button>` | `isSelected` 토글 |
| `action` | 액션 실행 | `<button>` | 클릭 핸들러 |

### FormControl (Checkbox, Radio, Switch)

Figma 스펙에 맞춘 **마이크로 모션 애니메이션**을 CSS `@keyframes`로 구현했습니다:

| 컴포넌트 | 애니메이션 | 효과 |
|----------|-----------|------|
| Checkbox | `checkIn` + `checkboxBounce` | 체크 시 opacity+scale 후 바운스 |
| Radio | `radioDotIn` | 선택 시 도트 등장 애니메이션 |
| Switch | `switchStretchOn/Off` | 토글 시 핸들 스트레치 |

### Avatar 컴포넌트

우선순위 기반 폴백 렌더링:

```
이미지 (src) → 이니셜 (initial) → 기본 아이콘 (profile-mono)
```

이미지 로딩 실패 시 `onError`로 자동 폴백. 크기별 텍스트 스타일과 아이콘 크기가 Figma 토큰에 맞춰 매핑됩니다.

### ListItem 컴포넌트

다양한 **슬롯 기반** 구조:

```
[Control] [LeftIcon/Avatar] [Title + Description] [Badge] [RightIcon]
```

크기별로 간격, 설명 폰트, 아바타 크기가 스케일됩니다. 키보드(Enter/Space) 지원 및 호버 효과를 포함합니다.

---

## Phase 5 — 아이콘 시스템

Figma에서 추출한 SVG 파일을 자동으로 TypeScript 코드로 변환하는 파이프라인을 구축했습니다.

```
Figma SVG Export
     │
     ▼ tools/fix-icon-fills.mjs (fill 속성 정규화)
     │
     ▼ src/foundations/icons/svg/*.svg
     │
     ▼ npm run generate:icons (tools/generators/generate-icon-paths.mjs)
     │
     ▼ src/foundations/icons/iconPaths.ts
     │
     ▼ <Icon name="arrow-right" size={24} />
```

`generate-icon-paths.mjs`는 SVG 파일에서 내부 마크업을 추출하여 `iconPaths` Record 객체를 생성합니다. `IconName` 타입이 자동으로 export되어 타입 안전한 아이콘 참조가 가능합니다.

`fix-icon-fills.mjs`는 Figma SVG export 시 발생하는 fill 속성 불일치를 `currentColor`로 정규화하여, 부모 요소의 `color` 속성으로 아이콘 색상을 제어할 수 있게 합니다.

---

## Phase 6 — 데모 앱 & 인터랙티브 플레이그라운드

컴포넌트를 시각적으로 확인하고 문서화하기 위한 데모 앱을 별도 `docs/` 디렉토리에 구성했습니다.

### 페이지 구성

12개의 쇼케이스 페이지:

```
Avatar · Badge · Button · Chip · Colors · Control
Icon · Infobox · Input · List · Selector · Typography
```

### 인터랙티브 플레이그라운드

각 컴포넌트 페이지에 **실시간 컨트롤 + 라이브 프리뷰 + 코드 생성기**를 탑재했습니다. React Spectrum 스타일의 문서 구조를 참고했습니다.

```
┌─────────────────────────────────────────┐
│  Live Preview                           │
│  ┌─────────────────────────────────┐    │
│  │    [컴포넌트 렌더링]              │    │
│  └─────────────────────────────────┘    │
│                                         │
│  Controls                               │
│  ┌─────┐ ┌──────┐ ┌────────┐           │
│  │ Size│ │Color │ │Variant │ ...       │
│  └─────┘ └──────┘ └────────┘           │
│                                         │
│  Generated Code            [📋 Copy]   │
│  ┌─────────────────────────────────┐    │
│  │ <Button color="brand1" ...>     │    │
│  └─────────────────────────────────┘    │
└─────────────────────────────────────────┘
```

- 컨트롤을 조작하면 프리뷰와 코드가 실시간 갱신
- 생성된 JSX를 클립보드에 복사 가능
- `prism-react-renderer`로 구문 강조 적용

### 데모 전용 유틸리티 컴포넌트

| 컴포넌트 | 역할 |
|----------|------|
| `CodeBlock` | 코드 예시 + 구문 강조 |
| `PropsTable` | Props 문서화 테이블 |
| `Section` | 데모 섹션 래퍼 |
| `ShowcaseRow` | variant 가로 나열 |
| `*Playground` | 인터랙티브 컨트롤 패널 |

Storybook 대신 자체 데모 앱을 선택한 이유: Storybook의 의존성/설정 오버헤드를 피하면서도, 데모 앱 자체가 디자인 시스템의 실사용 사례가 되어 **사용자 관점에서 컴포넌트를 검증**할 수 있습니다.

---

## Phase 7 — 툴링 & 품질

### 토큰 린트

`tools/lint-palette-classes.mjs`로 시맨틱 색상 정의의 정합성을 검증합니다. `npm run lint` 시 ESLint와 함께 토큰 린트가 실행됩니다.

### 테스트

Vitest + React Testing Library로 141개 컴포넌트 테스트를 구축했습니다. Brand 색상 토큰 불일치 등 시각적으로 발견하기 어려운 버그를 테스트로 포착합니다.

### NPM 스크립트

| 명령 | 설명 |
|------|------|
| `npm run dev` | 데모 개발 서버 (auto-open) |
| `npm run build` | 라이브러리 빌드 + 타입 생성 |
| `npm run build:demo` | 데모 앱 빌드 |
| `npm run build:watch` | 라이브러리 워치 모드 |
| `npm run generate:tokens` | Figma JSON → CSS/TS 토큰 재생성 |
| `npm run generate:icons` | SVG → iconPaths.ts 재생성 |
| `npm run lint` | ESLint + 토큰 린트 |

---

## Phase 8 — 빌드 & 배포

### 빌드

```bash
npm run build        # 라이브러리 → dist/ (ES + CJS + d.ts)
npm run build:demo   # 데모 앱 → dist-demo/
```

라이브러리 빌드는 `react`, `react-dom`, `react/jsx-runtime`을 external로 처리하여 번들 크기를 최소화했습니다. 트리셰이킹이 가능한 ES Module 포맷을 기본으로 제공합니다.

### 배포

| 대상 | 플랫폼 | 방식 |
|------|--------|------|
| 데모 앱 | Vercel | 자동 배포 (`vercel.json`) |
| 라이브러리 | npm | 패키지 배포 (peer dep: React 18/19) |

### 크로스 프로젝트 토큰 동기화

디자인 시스템의 CSS 변수를 다른 프로젝트에서도 활용할 수 있도록 토큰 동기화 스크립트를 제공합니다. 예를 들어 [Matome Keyword](/blog/2026/02/14/matome-keyword/) 프로젝트에서는 `sync-tokens.sh` 스크립트로 `globals.css`에서 `@theme`과 `[data-theme="dark"]` 블록을 파싱해 `design-tokens.css`로 추출하여 사용합니다.

```
@makestar/design-system
  └── src/styles/globals.css
       │
       ▼ sync-tokens.sh
       │
matome-keyword/
  └── public/design-tokens.css
```

React를 사용하지 않는 프로젝트에서도 CSS 변수만으로 일관된 디자인 언어를 유지할 수 있는 구조입니다.

---

## 프로젝트 구조

```
makestar-design-system/
├── tokens/                          # Figma 토큰 JSON
│   ├── Palette.tokens.json          (60.8KB, 10색상군 × 10단계)
│   ├── Light.tokens.json            (193.7KB, 라이트 시맨틱)
│   └── Dark.tokens.json             (193.3KB, 다크 시맨틱)
├── tools/
│   ├── generators/
│   │   ├── generate-tokens.mjs      # JSON → CSS/TS 토큰 변환
│   │   └── generate-icon-paths.mjs  # SVG → iconPaths.ts 변환
│   ├── fix-icon-fills.mjs           # SVG fill 속성 정규화
│   └── lint-palette-classes.mjs     # 토큰 린트
├── src/
│   ├── index.ts                     # 메인 엔트리 (14개 export)
│   ├── styles/
│   │   └── globals.css              # 글로벌 스타일 + CSS 변수 (~710줄)
│   ├── foundations/
│   │   ├── colors/colors.ts         # 색상 토큰 (자동 생성)
│   │   ├── typography/typography.ts # 타이포그래피 토큰 (자동 생성)
│   │   └── icons/
│   │       ├── Icon.tsx             # Icon 컴포넌트
│   │       ├── iconPaths.ts         # SVG 경로 매핑 (자동 생성)
│   │       └── svg/                 # 원본 SVG 파일
│   ├── theme/
│   │   └── ThemeProvider.tsx        # 테마 컨텍스트 + useTheme
│   └── components/common/           # 10개 컴포넌트 폴더
│       ├── Avatar/                  # 프로필 아바타
│       ├── Badge/                   # 배지/라벨
│       ├── Button/                  # 범용 버튼
│       ├── Chip/                    # Chip + ChipGroup
│       ├── FormControl/             # Checkbox, Radio, Switch
│       ├── Infobox/                 # 정보 박스
│       ├── Input/                   # 텍스트 입력
│       ├── List/                    # ListItem
│       ├── Selector/                # Selector + Dropdown
│       └── Typography/              # 시맨틱 텍스트
├── docs/                            # 데모 앱 (Vite root)
│   ├── App.tsx                      # 라우팅 + 사이드바
│   ├── index.html
│   ├── main.tsx
│   ├── components/                  # CodeBlock, PropsTable 등
│   ├── data/                        # 데모 데이터
│   └── pages/                       # 12개 쇼케이스 페이지
│       ├── AvatarPage.tsx
│       ├── BadgePage.tsx
│       ├── ButtonPage.tsx
│       ├── ChipPage.tsx
│       ├── ColorsPage.tsx
│       ├── ControlPage.tsx
│       ├── IconPage.tsx
│       ├── InfoboxPage.tsx
│       ├── InputPage.tsx
│       ├── ListPage.tsx
│       ├── SelectorPage.tsx
│       └── TypographyPage.tsx
├── dist/                            # 라이브러리 빌드 (.mjs + .cjs + .d.ts)
├── dist-demo/                       # 데모 앱 빌드
├── vite.config.ts                   # 듀얼 빌드 설정
├── eslint.config.js                 # ESLint 9 설정
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.lib.json
├── vercel.json                      # Vercel 배포 설정
└── package.json
```

---

## 개발 타임라인

| 날짜 | 내용 |
|------|------|
| 2/10 | 프로젝트 생성, 멀티 페이지 데모 앱 구조, Button 페이지, Vercel 배포 |
| 2/11 | Icon 컴포넌트 (150+ SVG), Input 컴포넌트, Typography 컴포넌트 |
| 2/20 | Storybook 10 도입 (이후 자체 데모로 대체) |
| 2/22 | 토큰 파이프라인 리팩터링, 통합 생성 스크립트, Icon/Select ARIA 강화 |
| 2/23 | `text-*` → `fg-*` 토큰 네이밍 변경, 전체 컴포넌트/데모 마이그레이션 |
| 2/25 | Vitest 테스트 스위트 (141개), brand 토큰 불일치 수정 |
| 2/26 | `--sem-` → `--color-` 2레이어 토큰 단순화 |
| 2/26 | Button 리라이트 (시맨틱 토큰 + focus ring + React Spectrum 스타일 문서) |
| 2/26 | Input 컴포넌트 Figma 스펙 동기화, 아이콘 생성기 스크립트 |
| 2/26 | Chip + ChipGroup 컴포넌트, FormControl (Checkbox, Radio, Switch) |
| 3/4 | Avatar, Badge, Infobox, ListItem 컴포넌트 + 인터랙티브 플레이그라운드 |
| 3/4 | Selector + Dropdown 컴포넌트 (4 트리거, 단일/다중 선택, 키보드 내비게이션) |

---

## 회고

### 잘된 점

- **Figma → 코드 자동화 파이프라인** — `generate-tokens.mjs`와 `generate-icon-paths.mjs`로 Figma 토큰/아이콘을 코드로 자동 변환합니다. 디자이너-개발자 간 "이 색상 코드가 뭐였지?" 같은 커뮤니케이션 비용이 사라졌습니다.
- **2레이어 토큰 시스템** — 초기 3레이어(`sem-text-*` → `sem-fg-*` → `color-fg-*`)에서 2레이어(`color-*`)로 단순화하며, CSS 변수 체인을 줄이고 DevTools 디버깅을 개선했습니다.
- **듀얼 빌드** — 하나의 `vite.config.ts`로 라이브러리와 데모를 모두 빌드할 수 있어 관리 포인트가 줄었습니다.
- **인터랙티브 플레이그라운드** — 각 컴포넌트 페이지에 실시간 컨트롤 + 코드 생성기를 탑재하여, Props 조합을 시각적으로 확인하고 바로 코드를 복사할 수 있습니다.
- **141개 테스트** — Vitest + React Testing Library로 컴포넌트 동작을 검증합니다. 토큰 불일치 같은 시각적으로 놓치기 쉬운 버그를 자동으로 포착합니다.
- **접근성 기본 내장** — 모든 컴포넌트에 ARIA 속성, focus-visible, 키보드 내비게이션, label 연결을 기본으로 적용했습니다.
- **크로스 프로젝트 활용** — CSS 변수 기반이므로 React 외의 프로젝트에서도 토큰을 동기화해 사용 가능합니다. Matome Keyword에서 실제로 이 방식을 적용했습니다.

### 개선할 점

- Figma Plugin을 통한 토큰 추출 완전 자동화 (현재 수동 JSON export)
- 접근성 자동 테스트(axe 등) CI 파이프라인 통합
- 컴포넌트 번들 사이즈 분석 및 최적화
- DataTable 컴포넌트 재설계 (초기 버전에서 제거됨, 새 아키텍처로 재구현 예정)
- 다크 모드 외 추가 테마(High Contrast 등) 지원
