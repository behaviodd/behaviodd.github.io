---
title: Simple Event Winner 구축기
date: 2026-05-16
layout: post
---

# Simple Event Winner

> 이벤트 응모 엑셀을 업로드해 리워드별 당첨자를 선정하는 백엔드 없는 단일 페이지 도구

**URL**: 비공개 (사내 서비스)

## 서비스 개요

Simple Event Winner는 K-POP 굿즈/이벤트 응모 데이터를 받아 리워드(응모권)별로 당첨자를 선정하는 운영팀용 도구입니다. 한국 어드민과 중국 Weidian 플랫폼에서 동시에 진행되는 이벤트의 엑셀 파일을 함께 업로드해 한·중 응모자를 통합 처리합니다.

가장 중요한 설계 원칙은 **백엔드 없음**입니다. 응모자의 이름·전화번호·이메일·생년월일 같은 개인정보를 서버로 전송하지 않고, 모든 파싱·정규화·선정·마스킹·다운로드를 브라우저에서 처리합니다. 운영팀이 엑셀을 올리면 그 자리에서 결과 화면이 뜨고, 발표용·검증용 시트와 언어별 이미지 카드를 다운로드받는 것으로 워크플로가 끝납니다.

---

## 핵심 기능

### 다중 파일 업로드 & 한·중 통합

한국 어드민 엑셀과 중국 Weidian 엑셀을 함께 업로드하면 응모권 단위로 한·중 응모자를 통합합니다. Weidian 워크북은 여러 시트로 쪼개져 있는 경우가 있어, 주문번호(`订单编号`)를 키로 시트 간 join을 수행합니다.

### 응모권 매핑 & 순서 조정

한·중 채널에서 같은 리워드를 다른 이름으로 판매한 경우, 좌우 패널에서 응모권 그룹을 드래그앤드롭으로 묶을 수 있습니다. 결과 탭과 다운로드 시트의 응모권 순서도 같은 UI에서 재배치합니다.

### 2가지 선정 방식

- **응모권 수량 기준** (기본): 합산 수량이 많은 순으로 당첨
- **랜덤**: 안정적 시드 셔플 (테스트 deterministic)

두 방식 모두 동점 시 동일한 우선순위 규칙을 따릅니다.

### 동일 응모자 dedup

같은 사람이 여러 건으로 응모해도 합산되도록, 사용자가 dedup 기준을 직접 선택합니다. 전화번호·이메일·생년월일이 기본 ON이고, 응모자명·스타메이커명은 옵션입니다. 선택된 항목이 **모두 일치**해야 동일 응모자로 봅니다.

### 2차 특별 당첨자

응모권별로 일반 당첨자 수와 별도로 특별 당첨자 수를 입력할 수 있습니다. 특별 당첨자는 일반 당첨자의 부분집합이고, 응모권 수량이 많은 순으로 마킹됩니다. 결과 화면에서 한 테이블에 통합 표시되며 특별 행에 brand2 뱃지가 붙습니다.

### 합산 내역 팝오버

2건 이상으로 합산된 당첨자의 주문번호 셀에 "합산 N건" 칩이 표시되고, 클릭하면 개별 행(주문번호 / 주문일시 / 응모권 수량 + 합계)을 보여주는 팝오버가 열립니다. 결과 화면 전용으로, 다운로드 시트나 이미지 카드에는 반영되지 않습니다.

### 결과 마스킹 & 발표 정렬

발표 화면의 이름은 자릿수에 따라 가변적으로 마스킹됩니다(`홍*`, `홍*동`, `홍**희`). 발표 순서는 마스킹 전 원본 기준으로 `Intl.Collator('ko-KR')` 가나다순 정렬을 기본으로 하고, "응모권 수량 순"으로 전환할 수 있습니다.

### 형식 경고 배너

전화번호·이메일·생년월일 중 형식이 의심되는 케이스가 있으면 진행은 막지 않은 채 yellow Infobox로 미리보기 5건 + 더보기 형태로 알립니다. 도메인 검증 throw와 별개로 운영자가 미리 확인할 수 있도록 분리했습니다.

### i18n 4언어 이미지 카드

결과 테이블을 한국어/영어/중국어/일본어 라벨로 PNG 이미지로 캡처해 ZIP으로 일괄 다운로드합니다. 발표명은 원본 그대로 유지하고 헤더·라벨만 언어별로 바뀝니다.

### 컨펌용 & 발표용 다운로드 분리

- **컨펌용**: 마스킹 안 한 원본 정보로 운영팀 내부 검증용 시트
- **발표용**: 마스킹 적용 + 체크박스로 선택한 항목만 포함

두 양식 모두 헤더 배경색·굵기·정렬·병합·줄바꿈 같은 엑셀 서식이 보존됩니다.

### 가상 당첨자 (데모 모드)

응모자 수가 당첨자 수에 못 미치는 응모권은 데모 모드 ON 시 가상 당첨자로 자리를 채웁니다. 가상 당첨자는 마스킹된 이름 풀에서 가져오고 개인정보 칸은 공란으로 표시됩니다. OFF 시에는 "응모자 부족"으로 처리합니다.

---

## 기술 스택

| 항목 | 선택 | 이유 |
|------|------|------|
| 빌드 | Vite 7 | review-mvp/fan-event-admin 동일 |
| 프레임워크 | React 19 + TS 5.9 | 도메인 타입 안정성 |
| 스타일 | Tailwind CSS 3 | 디자인 시스템 dist가 v3 클래스 가정 |
| 디자인 시스템 | @makestar/design-system (file:) | npm 미배포 사내 DS, 로컬 dist 참조 |
| 엑셀 파싱/생성 | xlsx-js-style | 다운로드 시트의 서식(헤더·병합·정렬) 보존 |
| ZIP 생성 | jszip | 언어별 이미지 일괄 다운로드 |
| 이미지 캡처 | html-to-image | 결과 테이블을 PNG로 변환 |
| 테스트 | Vitest + jsdom | 순수 함수 100% + 통합 가능 |
| Lint | ESLint 9 + typescript-eslint | 타입 인지 린트 |
| 상태 | useState / useReducer | 단일 플로우라 외부 store 불필요 |

---

## 아키텍처

```
[엑셀 업로드]
  ├── 한국 어드민 파일
  └── 중국 Weidian 파일 (멀티 시트 가능)
       │
       ▼
[파싱 & 정규화] (src/lib)
  ├── parseExcelBuffer       — alias 매칭 + NFC 정규화 + 멀티탭 join
  ├── validateEventRows      — 응모권 수량 유한수 검증
  ├── normalizeRow           — 텍스트/전화/생년월일/주문일시/국적
  └── checkRowFormat         — 형식 경고 (throw 아님)
       │
       ▼
[업로드 확인]
  ├── UploadedSummary        — 응모권별 응모자/판매량 요약
  └── TicketMappingSection   — 한·중 응모권 매핑 + 순서 드래그
       │
       ▼
[당첨 옵션]
  ├── 당첨 유형 (random / ticket-count)
  ├── 응모권별 (winnerCount / specialWinnerCount)
  ├── 발표 옵션 (announcementType / sortByTickets)
  ├── dedup 옵션 (phone/email/birthDate/name/starmaker)
  └── 데모 모드 (가상 당첨자 채움 여부)
       │
       ▼
[당첨자 선정] (src/lib/selectWinners)
  ├── groupByApplicant       — dedup 키로 병합
  ├── selectByTicketCount    — 수량 desc + 동점자 4단계
  ├── markSpecial            — 일반 풀에서 N명 마킹
  ├── sortForDisplay         — 발표명 가나다순 또는 수량 desc
  └── buildEntry             — rank 재부여 + mergeBreakdown 구성
       │
       ▼
[결과 탭] (ResultTabs)
  ├── 응모권별 탭
  ├── 합산 N건 팝오버 (화면 전용)
  ├── 제외/복구 토글
  └── 특별/가상 당첨자 뱃지
       │
       ▼
[다운로드]
  ├── 컨펌용 워크북 (xlsx-js-style)
  ├── 발표용 워크북 (마스킹 + 체크 항목만)
  └── 언어별 이미지 ZIP (html-to-image + jszip)
```

---

## 데이터 모델

### 필수 컬럼 (한·중 alias 매칭)

| 필드 | 한국 | 중국 | 비고 |
|------|------|------|------|
| 응모권 이름 | `응모권 이름` | `商品型号` | 그룹화·합산·탭 단위 |
| 주문번호 | `주문번호` / `OMS/WMS 주문번호` | `订单编号` | 결과 표시 + 멀티탭 join 키 |
| 스타메이커명 | `스타메이커명` | `公布用昵称` | 발표 유형 |
| 응모자명 | `응모자명` | `应募者姓名` | 발표 유형 |
| 응모자 전화 | `응모자-전화번호` | `应募者手机号` | dedup + 국가번호 분리 |
| 응모자 이메일 | `응모자 이메일` | `应募者邮箱` | dedup |
| 응모자 생년월일 | `응모자 생년월일` | `应募者出生年月日` | dedup |
| 응모권 수량 | `응모권 수량` | `商品件数` | 합산 단위 |

### 선택 컬럼

- `결제금액` / `最终결제금액` / `商品金额合计` — 동점자 처리 2순위
- `주문일시` / `支付时间` — 동점자 처리 3순위
- `응모자 국가` / `국적` / `应募者国籍` — 국가번호 추론
- `응모여부` — 미응모자 분류
- `가상당첨자 여부` — 가상 슬롯 제외

### 도메인 타입

```typescript
interface RawEventRow {
  ticketName: string;
  orderNumber: string;
  starmakerName: string;
  applicantName: string;
  phone: string;
  email: string;
  birthDate: string;
  ticketCount: number;
  orderAmount?: number;
  orderTime?: string;
  isNonParticipant?: boolean;
  sourceRowIndex: number;
}

interface WinnerEntry {
  rank: number;
  displayName: string;
  representativeOrderNumber: string;
  totalTicketCount: number;
  isSpecial: boolean;
  isVirtual: boolean;
  mergeBreakdown?: MergeBreakdownItem[];
  rawApplicant?: RawEventRow;
}

interface DedupKeyConfig {
  phone: boolean;        // 기본 ON
  email: boolean;        // 기본 ON
  birthDate: boolean;    // 기본 ON
  applicantName: boolean;  // 기본 OFF
  starmakerName: boolean;  // 기본 OFF
}
```

### 마스킹 규칙 (자릿수별)

| 길이 | 결과 | 예 |
|------|------|------|
| 0자 | `-` | — |
| 1자 | 원본 유지 | `김` |
| 2자 | 첫 + `*` | `홍*` |
| 3자 | 첫 + `*` + 끝 | `홍*동` |
| 4자 | 첫 + `**` + 끝 | `홍**희` |
| N (≥5) | 첫 + `*×(N-2)` + 끝 | `김***아` |

스프레드 연산자(`[...name]`)로 길이를 세어 이모지·결합문자도 1글자로 처리합니다.

### 동점자 처리 우선순위 (한·중 일원화)

응모권 수량 합산이 동점일 때:

1. **결제금액 합산 desc**
2. **주문일시 asc** (그룹 내 가장 빠른 주문)
3. **안정적 랜덤** (xorshift 시드)

기존 "엑셀 원본 행 순서" fallback은 2026-05-14에 폐기했습니다.

### 행 분류 (parser)

| 분류 | 판단 | 처리 |
|------|------|------|
| 빈 행 | 모든 셀 공란 | 제외 |
| Ghost 행 | 주문번호·스타메이커명 모두 공란 | 제외 |
| 가상당첨자 슬롯 | `가상당첨자 여부 = Y` | 제외 |
| 미응모자 | `응모여부 ≠ 응모` 또는 식별정보 공란 | 판매량 포함 / 당첨 풀 제외 |
| 정상 응모자 | 위 어디도 아님 | 정상 처리 |

---

## 작업 과정

### Phase 1 — 기초 도메인 함수 & 컨벤션

스캐폴딩(Vite + React 19 + TS)을 마치고 `@makestar/design-system`을 `file:./design-system-dist`로 통합했습니다. CLAUDE.md 컨벤션 문서를 먼저 작성해 한국어 사용자 향 메시지·자릿수 마스킹·1-indexed 행 번호 같은 규칙을 못 박았습니다.

핵심 순수 함수를 `src/lib/`에 만들고 Vitest로 즉시 테스트했습니다: `parseExcel`, `normalize`, `applicantKey`, `selectWinners`, `maskName`, `random`. macOS 파일명/엑셀 셀의 NFD 문제를 해결하기 위해 파싱 단계에서 NFC 정규화를 일괄 적용했습니다.

### Phase 2 — 정규화 전면 강화 (14개 Fix)

운영팀이 실제 어드민 엑셀을 올렸을 때 발생한 14건의 이슈를 정리했습니다:

- **전화 dedup 키**: 알려진 국가번호(82/86/81 등) strip + 선행 0 제거
- **생년월일 정규화**: 7자리 `YYYYMDD`를 8자리 `YYYY-MM-DD`로 자동 보정
- **국적 ISO 통일**: 27개 국가명 → 코드 매핑 (`대한민국`/`Korea`/`KR` → `KR`)
- **국가별 전화 포맷**: KR/JP/CN/US/CA/AU 등 국가별 표시 포맷 분리
- **Weidian 언어 기본값**: CN fallback 적용
- **업로드 시 일괄 정규화**: 컬럼 단위로 한 번에 처리

테스트가 130 → 261개로 확장되며 정규화 규칙이 안정됐습니다.

### Phase 3 — 한·중 통합 파이프라인 & UI (4개 PR)

여기서부터 본격적인 통합 작업이 시작됐습니다:

- **한·중 alias 확장**: 결제금액·주문일시 같은 선택 컬럼이 양쪽에서 매칭되도록
- **동점자 처리 일원화**: 한국·중국 동일 규칙 (수량 desc → 금액 desc → 시간 asc → 랜덤). 기존 "엑셀 원본 행 순서" fallback을 폐기
- **중국 멀티탭 join**: `tryJoinSheets`로 `订单编号` 키 기반 시트 병합. 빈 셀에만 채우고 base 시트 우선
- **응모권 매핑·순서 UI**: `TicketMappingSection.tsx`로 좌우 패널 드래그앤드롭. `computeMergedTickets` / `syncTicketOrder` 순수 함수로 분리해 테스트
- **미응모자/가상당첨자 처리**: `isNonParticipant` 플래그 추가, parser가 행을 5종으로 분류
- **design.md 엄격 적용**: 선택/포커스를 pink → blue로 통일, card-floating 패턴
- **버전 표시**: Vite define으로 `__APP_VERSION__` / `__BUILD_DATE__` 주입, 푸터 노출

테스트는 316개까지 늘었고, 한·중을 같은 함수 경로로 처리하면서 분기 복잡도가 오히려 줄었습니다.

### Phase 4 — 합산 내역 팝오버 (화면 전용)

운영팀에서 "한 사람이 어떤 주문으로 합산됐는지 결과 화면에서 바로 보고 싶다"는 요청이 들어왔습니다. 다운로드 시트는 정산용이라 그대로 두되 화면에만 추가했습니다.

- `WinnerEntry.mergeBreakdown` 필드 신설 — 2건 이상 합산된 실제 당첨자에만 생성, 단일 행·가상 당첨자는 `undefined`
- `MergeTrigger` — 주문번호 셀의 "합산 N건" 칩 (2건 이상일 때만)
- `MergeBreakdownPopover` — `createPortal`로 body 렌더(표 overflow 클리핑 회피), 트리거 좌표 기준 `fixed` 배치, 뷰포트 경계 클램프·세로 플립
- 팝오버 내부 스크롤 시 닫힘 버그 수정 — 캡처 단계 scroll 리스너가 내부 스크롤까지 잡던 문제를 `e.target` 확인으로 우회

`exportWinners.ts`와 `WinnerImageCard.tsx`가 특정 필드만 읽도록 분리되어 있어 `mergeBreakdown`은 자연스럽게 다운로드에서 빠집니다. 테스트는 320개에 도달했습니다.

### Phase 5 — i18n 4언어 + 전체 ZIP 다운로드 (v0.3.x)

가장 최근 작업입니다. 일본·중화권 발표 요구가 추가되면서 결과 이미지를 4언어로 만드는 기능을 넣었습니다:

- **언어별 라벨**: 헤더와 뱃지(특별/순번/응모권수량)를 KR/EN/ZH/JP로 분리
- **언어별 이미지 카드**: `WinnerImageCard.tsx`가 lang prop을 받아 같은 데이터를 다른 라벨로 렌더
- **컨펌 시트 폴백**: 중문화된 헤더에서 일부 컬럼이 빠질 때 일반 라벨로 폴백
- **전체 ZIP 다운로드**: jszip으로 모든 응모권 × 모든 언어 이미지를 한 번에 묶기
- **Windows Pretendard 로드**: 한국어 폰트 깨짐 수정, 결과 셀 뱃지 한 줄 유지

현재 v0.3.7, 테스트 342개입니다.

---

## 설계 결정

### 백엔드 없음 → 클라이언트 전부 처리

응모자의 이름·전화번호·이메일·생년월일은 처리 중 어디에서도 서버를 거치지 않습니다. 운영팀이 엑셀을 올리면 브라우저 메모리 안에서만 파싱·선정·다운로드가 일어나고, 새로고침하면 데이터가 사라집니다.

- 민감 정보 송신 0건으로 규정 부담 제거
- 부하 예측이 크지 않아(주당 1~2회 수동 업로드) 서버 비용 불필요
- iframe 내장과 정적 호스팅이 자유로움

번들 크기 증가(`xlsx-js-style` 1.3MB+)는 이 이점에 대한 비용으로 받아들였습니다.

### xlsx-js-style 선택

다운로드 시트가 업로드 어드민 파일과 **비주얼 일관성**을 유지해야 합니다. 헤더의 light blue 배경색, 굵기, 가운데 정렬, 셀 병합, 줄바꿈을 보존해야 운영팀이 다운로드 후 그대로 사용할 수 있습니다.

`xlsx`는 서식 지원이 약하고 `excel.js`는 무거워서, `xlsx-js-style`이 사실상 유일한 선택이었습니다. 번들 비용은 D1 이점과 맞바꿨습니다.

### 한·중 동점자 처리 일원화

한국·중국이 다른 규칙(한국=수량 / 중국=금액)을 쓰던 것을 2026-05-14에 한 줄로 통합했습니다: 수량 desc → 금액 desc → 시간 asc → 랜덤.

- 한·중 cross-file dedup으로 같은 응모자가 양쪽에서 응모한 경우 합산되는데, 분기 규칙으로는 합산이 어색해짐
- 시간 우선순위(asc)는 공정성 — 더 빨리 응모한 사람이 가산점

분기 복잡도가 줄어 코드가 짧아졌고, 한·중 모두 한 가지 정책으로 설명할 수 있게 됐습니다.

### 화면 전용 합산 내역 (export 분리)

운영팀의 "합산 내역을 보고 싶다" 요청을 결과 화면에만 반영하고 다운로드 시트와 이미지 카드에는 빼놓았습니다.

- 다운로드 시트는 정산용·외부 공유용이라 "누가 누구와 합산됐는지"는 노이즈
- 화면은 운영자가 검증할 때만 보는 영역이라 합산 내역이 가치 있음
- `exportWinners.ts`가 `mergeBreakdown`을 읽지 않게 두는 것만으로 자연스럽게 분리됨

### File: 디자인 시스템 의존성

`@makestar/design-system`을 npm 배포 없이 `file:./design-system-dist`로 참조합니다.

- 내부 도구 여러 개(review-mvp, fan-event-admin)가 같은 DS를 공유
- 버전 충돌 없음, 수정 후 즉시 테스트
- DS dist 업데이트 시 간단한 sync 작업만 필요

### Result 패턴 대신 사용자 향 throw

도메인 검증 실패는 `throw new Error('12행의 응모권 수량 값이 숫자가 아닙니다.')`처럼 사용자가 읽을 한국어 메시지로 던지고, `ErrorBanner`에서 `.message`를 그대로 표시합니다.

- 어드민 사용자라 오류 시 즉시 엑셀을 수정해야 함
- 행 번호는 항상 1-indexed (엑셀에서 보는 그 행 번호 그대로)
- Result 타입의 추상화가 단일 페이지 플로우에서는 과함

### 자릿수별 가변 마스킹

이름 길이에 따라 마스킹 패턴이 다릅니다. 2~3자 한국어 이름이 대부분이라, 너무 많은 별표(`홍***`)는 시각 노이즈가 되고 앞뒤만 노출하는 게 가독성이 좋습니다.

- 0자: `-`
- 1자: 원본 (1자 마스킹은 식별 불가)
- 2자~: 첫과 끝만 남기고 가운데를 자릿수대로 별표

### 선정과 표시의 분리

선정 단계는 옵션(random / ticket-count)과 동점자 규칙대로 진행하고, 표시 순서는 별개로 정렬합니다. 발표명(스타메이커명 또는 응모자명)의 **마스킹 전 원본**을 기준으로 `Intl.Collator('ko-KR')` 가나다순으로 보여줍니다.

- 선정은 공정성, 표시는 발표 편의성이라는 별개 관심사
- 표시 정렬 변경이 선정 결과에 영향을 주지 않게 함수가 분리됨

---

## 프로젝트 구조

```
simple-event-winner/
├── src/
│   ├── lib/                        # 순수 함수 (Vitest 100%)
│   │   ├── parseExcel.ts           # 엑셀 파싱 + alias + 멀티탭 join
│   │   ├── normalize.ts            # 텍스트/전화/생년월일/주문일시/국적
│   │   ├── validateEventRows.ts    # 응모권 수량 검증
│   │   ├── checkRowFormat.ts       # 형식 경고 (throw 아님)
│   │   ├── applicantKey.ts         # dedup 키 + groupByApplicant
│   │   ├── selectWinners.ts        # 선정 + 동점자 + 특별 + 표시 정렬
│   │   ├── representativeOrder.ts  # 대표 주문번호
│   │   ├── maskName.ts             # 자릿수별 마스킹
│   │   ├── random.ts               # xorshift 시드 셔플
│   │   ├── specialLabel.ts         # 특별 라벨 (4언어)
│   │   ├── exportWinners.ts        # xlsx-js-style 워크북 생성
│   │   ├── ticketLabel.ts          # 응모권명 정제
│   │   ├── downloadImage.ts        # html-to-image + jszip
│   │   ├── errors.ts               # EventDataException
│   │   └── *.test.ts               # 13 파일 / 342 tests
│   │
│   ├── components/                 # DS 기반 재사용 UI
│   │   ├── FileUpload.tsx          # 다중 파일 + 드래그
│   │   ├── UploadedSummary.tsx     # 응모권별 응모자/판매량
│   │   ├── TicketMappingSection.tsx  # 한·중 매핑 + 순서 drag
│   │   ├── OptionsForm.tsx         # 유형·수·발표·dedup·데모
│   │   ├── FormatWarningBanner.tsx # 형식 경고 (yellow Infobox)
│   │   ├── ResultTabs.tsx          # 결과 탭 + 합산 팝오버 (portal)
│   │   ├── ExportOptions.tsx       # 개인정보 체크 + 3가지 다운로드
│   │   ├── WinnerImageCard.tsx     # html-to-image 캡처 (4언어)
│   │   ├── ErrorBanner.tsx         # 에러 메시지 (red Infobox)
│   │   └── ticketMappingUtils.ts   # 매핑·순서 순수 함수
│   │
│   ├── pages/
│   │   └── WinnerPicker.tsx        # 단일 페이지 — phase 상태 관리
│   │
│   ├── types/
│   │   └── event.ts                # 도메인 타입
│   │
│   ├── App.tsx                     # SPA 단일 라우트
│   ├── main.tsx
│   └── index.css
│
├── design-system-dist/             # file: 의존성 (로컬 DS)
├── docs/
│   ├── 당첨자 선정 기준.md         # 선정 로직 전체
│   ├── 응모 데이터 정규화 규칙.md  # 파싱/정규화 전체
│   ├── handoff-2026-05-06.md       # P1 기초 + NFC
│   ├── handoff-2026-05-13.md       # P2 정규화 강화 (14 Fix)
│   ├── handoff-2026-05-14.md       # P3 한·중 일원화
│   └── handoff-2026-05-15.md       # P4 합산 팝오버
├── CLAUDE.md                       # 개발 컨벤션 (매 세션 자동 로드)
├── design.md                       # UI/디자인 시스템 규칙
├── README.md
├── package.json                    # v0.3.7
├── vite.config.ts                  # base './' + __APP_VERSION__ define
├── vitest.config.ts                # jsdom
├── tsconfig.json
├── eslint.config.js
├── tailwind.config.js
└── postcss.config.js
```

---

## 회고

### 잘된 점

- **백엔드 없음** — 개인정보 송신 0건으로 규정 부담을 제거하고 인프라 비용을 0으로 만들었습니다. 운영팀이 새로고침하면 데이터가 사라지는 단순한 모델이 오히려 안심을 줬습니다.
- **순수 함수 중심 설계** — 파싱·정규화·선정·마스킹을 모두 `src/lib`의 순수 함수로 분리해 342개 Vitest로 95% 이상 커버했습니다. 동점자 규칙·dedup 옵션처럼 변경이 잦은 도메인 로직이 자신 있게 수정됐습니다.
- **한·중 동점자 일원화** — 분기되어 있던 한국·중국 정책을 한 가지로 통일하면서 코드 복잡도가 줄고 cross-file dedup이 자연스러워졌습니다.
- **화면 전용 합산 내역** — 다운로드 시트와 화면을 다른 정보 밀도로 둠으로써, 정산용 문서를 깔끔하게 유지하면서도 운영자 검증 편의를 살렸습니다.
- **사용자 향 throw 메시지** — 모든 도메인 에러를 한국어 문장으로 즉시 표시해, 운영팀이 엑셀을 어디서 어떻게 고쳐야 하는지 한눈에 알 수 있습니다.
- **핸드오프 문서 시리즈** — 매 세션 종료 시 변경·결정·검증 기준선을 기록해, 다음 세션 진입 비용을 크게 줄였습니다.

### 개선할 점

- `xlsx-js-style` 1.3MB+ 번들 비용 — 정적 호스팅이지만 모바일에서 첫 로드가 느림. 동적 import로 분리 가능
- `getRepresentativeOrderNumber`는 단일 행의 최대 수량만 보고 — 한 주문번호가 여러 행으로 쪼개진 경우 주문번호 단위 합산 후 최대를 고르는 변형 필요할 수 있음
- "사이트 745" 같은 출처 불명 판매량 표기 — 파일 종류 매칭 자동화 미구현
- 응모권명 cross-file 자동 매칭 미구현 — 사용자가 UI로 매번 묶어야 함
- UI 컴포넌트 통합 테스트 부재 — 현재 순수 함수만 커버, ResultTabs·OptionsForm 등은 수동 검증
- 가상 당첨자 이름 풀이 한정적 — 같은 이벤트 내에서 중복 가능성 존재
