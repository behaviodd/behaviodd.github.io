---
title: Design System 구축기
date: 2026-02-20
layout: post
---

# @makestar/design-system 구축기

> Figma 토큰에서 React 컴포넌트까지 — 사내 디자인 시스템을 처음부터 설계하고 구축한 과정을 기록합니다.

React + TypeScript + Tailwind CSS 기반의 사내 디자인 시스템을 구축했습니다. 디자이너와 개발자가 동일한 토큰을 공유하고, Light/Dark 테마 전환이 가능한 12개 컴포넌트 라이브러리입니다.

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

## 아키텍처

디자인 토큰이 Figma에서 최종 컴포넌트까지 흐르는 전체 파이프라인입니다.

```
[Figma]
  │
  ▼
[Token 추출] ── 3개 JSON 파일
  ├── Palette.tokens.json     (12색상군 × 10~11단계)
  ├── Light.tokens.json       (라이트 시맨틱 매핑)
  └── Dark.tokens.json        (다크 시맨틱 매핑)
  │
  ▼
[TypeScript 토큰] ── 타입 안전한 코드 토큰
  ├── tokens/colors.ts        ColorName, ColorStep 타입
  └── tokens/typography.ts    4 카테고리 × variant
  │
  ▼
[CSS 변수] ── index.css
  ├── :root { --sem-fg-default: ... }
  └── [data-theme="dark"] { --sem-fg-default: ... }
  │
  ▼
[ThemeProvider] ── React Context
  ├── useTheme() / setTheme() / toggleTheme()
  └── data-theme 속성 자동 적용
  │
  ▼
[컴포넌트 라이브러리] ── 12개 컴포넌트
  ├── Button, Input, Select, Chips, Badge, Avatar
  ├── Typography, Icon, Infobox, List, DataTable
  └── Control (Checkbox, Radio, Switch)
  │
  ▼
[소비] ── npm 패키지 + 데모 앱
  ├── ES Module (.mjs) ── 트리셰이킹 가능
  ├── CommonJS (.cjs) ── 레거시 호환
  └── 데모 앱 (Vercel) ── 14개 쇼케이스 페이지
```

---

## Phase 1 — 프로젝트 셋업

Vite의 React + TypeScript 템플릿으로 프로젝트를 생성하고, **듀얼 빌드 모드**를 구성했습니다.

하나의 `vite.config.ts`에서 환경 변수로 빌드 대상을 분기합니다:

- `BUILD_LIB=true` → 라이브러리 빌드 (`dist/`에 `.mjs` + `.cjs` 출력)
- 기본 → 데모 앱 빌드 (`dist-demo/`)

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
  "types": "./dist/index.d.ts"
}
```

듀얼 빌드의 핵심은 **하나의 설정 파일로 두 가지 산출물**을 만드는 것입니다. `vite.config.ts`에서 `BUILD_LIB` 환경 변수를 확인해 라이브러리 모드(`lib` 엔트리)와 데모 모드(일반 SPA)를 분기합니다. 이렇게 하면 설정 파일이 하나뿐이므로 관리 포인트가 줄고, CI에서도 빌드 명령어 하나로 전환됩니다.

---

## Phase 2 — 디자인 토큰 시스템

디자인 시스템의 근간이 되는 토큰을 **Figma → JSON → TypeScript → CSS 변수** 파이프라인으로 구축했습니다.

### Figma 토큰 추출

Figma에서 3개의 시맨틱 토큰 JSON 파일을 추출했습니다:

| 파일 | 내용 | 역할 |
|------|------|------|
| `Palette.tokens.json` | 12개 색상군의 기본 팔레트 | RGB + Hex 원시 값 |
| `Light.tokens.json` | 라이트 테마 시맨틱 매핑 | 팔레트 → 의미 연결 |
| `Dark.tokens.json` | 다크 테마 시맨틱 매핑 | 팔레트 → 의미 연결 |

이 3단계 구조(Palette → Semantic → CSS)의 장점은 **새 테마 추가 시 시맨틱 레이어만 매핑하면 된다**는 것입니다. 예를 들어 `High Contrast` 테마를 추가하려면 새 시맨틱 JSON 파일 하나만 만들면 됩니다.

### 색상 토큰

`src/tokens/colors.ts`에 12개 색상군을 정의했습니다. 각 색상군은 10~11단계(001~099)의 스케일을 가집니다.

```
Gray · Red · Orange · Yellow · Lime · Green
Blue · Indigo · Purple · Pink + Brand1 · Brand2
```

추가로 `staticColors`(Black/White)와 `overlayColors`(알파값 포함)를 분리하고, `ColorName`, `ColorStep` 타입을 export하여 타입 안전한 색상 접근을 보장했습니다.

```typescript
// 사용 예시
import { colors, type ColorName, type ColorStep } from '@makestar/design-system';
const primary = colors.Brand1['050'];  // 타입 안전
```

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

| 접두사 | 역할 | 예시 |
|--------|------|------|
| `--sem-fg-*` | 전경/텍스트 | default, subtle, subtlest, selected, disabled, danger |
| `--sem-surface-*` | 배경/표면 | default, raised, sunken, overlay |
| `--sem-edge-*` | 테두리/스트로크 | default, subtle, bold |
| `--sem-interaction-*` | 인터랙션 상태 | hovered, pressed, focused, disabled |
| `--sem-*-accent-*` | 색상별 액센트 | brand1, brand2, red, blue |

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

총 12개 컴포넌트를 구현했습니다. 모든 컴포넌트에 공통으로 적용한 패턴은 다음과 같습니다:

- **forwardRef** — ref 전달 지원
- **HTML 속성 확장** — 네이티브 속성을 그대로 사용 가능
- **Record 기반 Tailwind 클래스 매핑** — variant/size별 클래스를 Record로 관리
- **시맨틱 토큰 활용** — 하드코딩된 색상 대신 CSS 변수 사용
- **접근성** — ARIA 속성, focus-visible 상태, label 연결

### 컴포넌트 목록

| 컴포넌트 | 설명 | 주요 Props |
|----------|------|-----------|
| **Button** | 범용 버튼 | 6 타입, 5 크기, outline, loading, 아이콘 |
| **Input** | 텍스트 입력 | 라벨, 헬퍼, 카운터, 클리어, 상태별 스타일 |
| **Select** | 드롭다운 선택기 | 4 트리거 타입(dropdown, chip, button, badge) |
| **Chips** | 태그/칩 | 선택 가능, 해제 가능 변형 |
| **Badge** | 배지/라벨 | 2 shape(square, round), 18 색상, 아이콘 |
| **Avatar** | 프로필 아바타 | 이미지/이니셜/아이콘, 4 크기(16~48px) |
| **Typography** | 시맨틱 텍스트 | 카테고리+variant → 자동 HTML 요소 선택 |
| **Icon** | SVG 아이콘 | iconPaths 매핑, 4 크기(16~32), 동적 색상 |
| **Infobox** | 정보 박스 | 아이콘, 해제 가능 |
| **List / ListItem** | 리스트 | 3 크기, 선택 상태 |
| **DataTable** | 데이터 테이블 | 복합 패턴, 셀 타입, 고정 열(sticky) |
| **Control** | 폼 컨트롤 3종 | Checkbox, Radio, Switch |

### Button 컴포넌트 상세

가장 다양한 변형을 가진 Button을 예시로 설명합니다.

```
타입:    default │ brand1 │ brand2 │ inverse │ red │ orange
크기:    sm │ md │ lg │ xl │ xxl
변형:    solid(기본) │ outline
상태:    default │ hover │ pressed │ disabled │ loading
아이콘:  leftIcon │ rightIcon
```

각 타입 × 크기 × 변형 조합의 Tailwind 클래스를 Record 객체로 관리합니다. 이 패턴은 조건부 클래스 로직보다 직관적이고, 새 variant 추가 시 Record에 항목만 추가하면 됩니다.

### DataTable 컴포넌트 상세

가장 복잡한 컴포넌트로, **복합 컴포넌트 패턴**을 적용했습니다.

```
<DataTable>
  <DataTableHead>
    <DataTableCell type="text">이름</DataTableCell>
    <DataTableCell type="number">금액</DataTableCell>
  </DataTableHead>
  <DataTableRow>
    <DataTableCell type="text">항목 A</DataTableCell>
    <DataTableCell type="number">10,000</DataTableCell>
  </DataTableRow>
</DataTable>
```

셀 타입별로 정렬, 포매팅, 스타일이 자동 적용됩니다:

| 셀 타입 | 정렬 | 용도 |
|---------|------|------|
| text | 좌측 | 일반 텍스트 |
| number | 우측 | 숫자, 금액 |
| badge | 중앙 | 상태 배지 |
| action | 우측 | 버튼, 링크 |

---

## Phase 5 — 데모 앱

컴포넌트를 시각적으로 확인하고 문서화하기 위한 데모 앱을 만들었습니다.

멀티 페이지 구조로 컴포넌트별 14개 페이지를 구성했습니다:

```
Avatar · Badge · Button · Chips · Colors · Control
DataTable · Icon · Infobox · Input · List · Select · Typography
```

각 페이지에서 Props 테이블, 코드 블록, 다양한 variant 쇼케이스를 제공합니다.

데모 전용 유틸리티 컴포넌트도 함께 구현했습니다:

| 컴포넌트 | 역할 |
|----------|------|
| `CodeBlock` | 코드 예시 표시 |
| `PropsTable` | Props 문서화 테이블 |
| `Section` | 데모 섹션 래퍼 |
| `ShowcaseRow` | variant 가로 나열 |
| `Toast` | 인터랙션 피드백 표시 |

Storybook 대신 자체 데모 앱을 선택한 이유는 두 가지입니다. 첫째, Storybook의 의존성과 설정 오버헤드를 피하고 싶었습니다. 둘째, 데모 앱 자체가 디자인 시스템의 실사용 사례 역할을 하므로 **사용자 관점에서 컴포넌트를 검증**할 수 있습니다.

---

## Phase 6 — 빌드 & 배포

### 빌드

```bash
npm run build        # 라이브러리 → dist/ (ES + CJS + d.ts)
npm run build:demo   # 데모 앱 → dist-demo/
```

라이브러리 빌드는 `react`, `react-dom`을 external로 처리하여 번들 크기를 최소화했습니다. 트리셰이킹이 가능한 ES Module 포맷을 기본으로 제공합니다.

### 배포

| 대상 | 플랫폼 | 방식 |
|------|--------|------|
| 데모 앱 | Vercel | 자동 배포 (`vercel.json`) |
| 라이브러리 | npm | 패키지 배포 (peer dep: React 18/19) |

### 크로스 프로젝트 토큰 동기화

디자인 시스템의 CSS 변수를 다른 프로젝트에서도 활용할 수 있도록 토큰 동기화 스크립트를 제공합니다. 예를 들어 [Matome Keyword](/blog/2026/02/14/matome-keyword/) 프로젝트에서는 `sync-tokens.sh` 스크립트로 `index.css`에서 `:root`와 `[data-theme="dark"]` 블록을 파싱해 `design-tokens.css`로 추출하여 사용합니다.

```
@makestar/design-system
  └── src/index.css
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
design-system/
├── semantic/                    # Figma 토큰 JSON
│   ├── Palette.tokens.json
│   ├── Light.tokens.json
│   └── Dark.tokens.json
├── src/
│   ├── index.ts                 # 메인 엔트리
│   ├── index.css                # 글로벌 스타일 + CSS 변수
│   ├── tokens/
│   │   ├── colors.ts            # 색상 토큰 (12군 × 10~11단계)
│   │   └── typography.ts        # 타이포그래피 토큰 (4 카테고리)
│   ├── theme/
│   │   └── ThemeProvider.tsx     # 테마 컨텍스트 + useTheme
│   ├── components/              # 12개 컴포넌트
│   │   ├── Avatar/
│   │   ├── Badge/
│   │   ├── Button/
│   │   ├── Chips/
│   │   ├── Control/             # Checkbox, Radio, Switch
│   │   ├── DataTable/           # Head, Row, Cell 복합 패턴
│   │   ├── Icon/                # SVG 아이콘 + iconPaths
│   │   ├── Infobox/
│   │   ├── Input/
│   │   ├── List/                # List + ListItem
│   │   ├── Select/
│   │   └── Typography/
│   └── demo/                    # 데모 앱
│       ├── App.tsx
│       ├── components/          # CodeBlock, PropsTable 등
│       ├── data/
│       └── pages/               # 14개 컴포넌트 데모 페이지
├── dist/                        # 라이브러리 빌드 (.mjs + .cjs + .d.ts)
├── dist-demo/                   # 데모 앱 빌드
├── vite.config.ts               # 듀얼 빌드 설정
├── tsconfig.json                # 기본 TS 설정
├── tsconfig.app.json            # 데모 앱용
├── tsconfig.lib.json            # 라이브러리용
└── package.json
```

---

## 회고

### 잘된 점

- **Figma → 코드 파이프라인** — 디자이너가 Figma에서 토큰을 변경하면 JSON 추출 후 코드에 바로 반영할 수 있는 구조를 만들었습니다. 디자이너-개발자 간 "이 색상 코드가 뭐였지?" 같은 커뮤니케이션 비용이 사라집니다.
- **시맨틱 토큰 3단계 구조** — Palette → Semantic → CSS 변수로 관심사를 분리하여, 테마 추가 시 시맨틱 레이어만 매핑하면 됩니다.
- **듀얼 빌드** — 하나의 설정으로 라이브러리와 데모를 모두 빌드할 수 있어 관리 포인트가 줄었습니다.
- **크로스 프로젝트 활용** — CSS 변수 기반이므로 React 외의 프로젝트에서도 토큰을 동기화해 사용 가능합니다. Matome Keyword에서 실제로 이 방식을 적용했습니다.
- **접근성 기본 내장** — 모든 컴포넌트에 ARIA 속성, focus-visible, label 연결을 기본으로 적용하여, 소비자가 접근성을 별도로 신경 쓸 필요를 줄였습니다.

### 개선할 점

- 토큰 변환 자동화 스크립트 보강 필요 (현재 수동 JSON 추출)
- Storybook 도입 검토 (현재 자체 데모 앱으로 대체 중)
- 컴포넌트 단위 테스트 추가
- 접근성 자동 테스트(axe 등) 도입
- Figma Plugin을 통한 토큰 추출 자동화 (현재 수동 export)
