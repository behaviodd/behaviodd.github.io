/**
 * 근무일/공휴일 계산.
 *
 * 기본값으로 "이번 달(1일~말일)에서 토·일·공휴일을 제외한 남은 인정근무시간"을
 * 보여주기 위해, 오늘부터 이번 달 말일까지 남은 평일(영업일) 수를 센다.
 *
 * 공휴일은 대한민국 기준이며, 정확도를 위해 연 1회 정도 갱신이 필요하다.
 * (음력 기반 설날·추석·부처님오신날과 대체공휴일 포함, 베스트 에포트)
 */

const STANDARD_WORK_MINUTES = 8 * 60; // 하루 표준 인정근무 8시간

// "YYYY-MM-DD" 형식의 대한민국 공휴일 (대체공휴일 포함, 2025~2027 일부)
const KR_HOLIDAYS = new Set<string>([
  // 2025
  "2025-01-01",
  "2025-01-28",
  "2025-01-29",
  "2025-01-30",
  "2025-03-01",
  "2025-03-03", // 삼일절 대체
  "2025-05-05", // 어린이날·부처님오신날 겹침
  "2025-05-06", // 대체
  "2025-06-06",
  "2025-08-15",
  "2025-10-03",
  "2025-10-06",
  "2025-10-07",
  "2025-10-08",
  "2025-10-09",
  "2025-12-25",
  // 2026
  "2026-01-01",
  "2026-02-16",
  "2026-02-17",
  "2026-02-18",
  "2026-03-01",
  "2026-03-02", // 삼일절(일) 대체
  "2026-05-05",
  "2026-05-24",
  "2026-05-25", // 부처님오신날(일) 대체
  "2026-06-06",
  "2026-08-15",
  "2026-09-24",
  "2026-09-25",
  "2026-09-26",
  "2026-10-03",
  "2026-10-05", // 개천절(토) 대체
  "2026-10-09",
  "2026-12-25",
  // 2027
  "2027-01-01",
  "2027-02-06",
  "2027-02-07",
  "2027-02-08",
  "2027-02-09", // 설날(일 포함) 대체
  "2027-03-01",
  "2027-05-05",
  "2027-05-13",
  "2027-06-06",
  "2027-08-15",
  "2027-08-16", // 광복절(일) 대체
  "2027-09-14",
  "2027-09-15",
  "2027-09-16",
  "2027-10-03",
  "2027-10-04", // 개천절(일) 대체
  "2027-10-09",
  "2027-12-25",
]);

/** Date -> "YYYY-MM-DD" (로컬 기준) */
export function ymd(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6; // 일(0), 토(6)
}

export function isHoliday(date: Date): boolean {
  return KR_HOLIDAYS.has(ymd(date));
}

/** 평일이면서 공휴일이 아닌 날 */
export function isBusinessDay(date: Date): boolean {
  return !isWeekend(date) && !isHoliday(date);
}

export type MonthWork = {
  /** 이번 달(1일~말일) 토·일·공휴일을 제외한 영업일 수 */
  businessDays: number;
  /** businessDays × 8시간(분) — flex 월 소정근로시간과 동일 */
  totalMinutes: number;
};

/**
 * 이번 달(1일~말일)에서 토·일·공휴일을 제외한 영업일 수와,
 * 1일 8시간 근무 기준 총 인정근무시간을 계산한다.
 * today를 주입할 수 있어 테스트가 가능하다.
 */
export function businessDaysInMonth(today: Date = new Date()): MonthWork {
  const year = today.getFullYear();
  const month = today.getMonth();
  const lastDay = new Date(year, month + 1, 0).getDate();

  let businessDays = 0;
  for (let d = 1; d <= lastDay; d++) {
    const date = new Date(year, month, d);
    if (isBusinessDay(date)) businessDays++;
  }

  return {
    businessDays,
    totalMinutes: businessDays * STANDARD_WORK_MINUTES,
  };
}
