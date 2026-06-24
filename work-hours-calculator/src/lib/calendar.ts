/**
 * 근무일/공휴일 계산.
 *
 * - 인정근무시간 기본값: 이번 달(1일~말일) 토·일·공휴일 제외 영업일 × 8시간
 *   (flex 월 소정근로시간과 동일)
 * - 남은 근무일 기본값: 오늘(포함)부터 이번 달 말일까지 남은 평일
 *
 * 공휴일은 Nager.Date 공개 API(대한민국)에서 불러오고, 네트워크 실패 시
 * 아래 내장 목록(KR_HOLIDAYS)으로 폴백한다.
 */

const STANDARD_WORK_MINUTES = 8 * 60; // 하루 표준 인정근무 8시간

// "YYYY-MM-DD" 형식의 대한민국 공휴일 폴백 목록 (대체공휴일 포함, 베스트 에포트)
export const KR_HOLIDAYS_FALLBACK = new Set<string>([
  // 2025
  "2025-01-01", "2025-01-28", "2025-01-29", "2025-01-30",
  "2025-03-01", "2025-03-03", "2025-05-05", "2025-05-06",
  "2025-06-06", "2025-08-15", "2025-10-03", "2025-10-06",
  "2025-10-07", "2025-10-08", "2025-10-09", "2025-12-25",
  // 2026
  "2026-01-01", "2026-02-16", "2026-02-17", "2026-02-18",
  "2026-03-01", "2026-03-02", "2026-05-05", "2026-05-24",
  "2026-05-25", "2026-06-06", "2026-08-15", "2026-09-24",
  "2026-09-25", "2026-09-26", "2026-10-03", "2026-10-05",
  "2026-10-09", "2026-12-25",
  // 2027
  "2027-01-01", "2027-02-06", "2027-02-07", "2027-02-08",
  "2027-02-09", "2027-03-01", "2027-05-05", "2027-05-13",
  "2027-06-06", "2027-08-15", "2027-08-16", "2027-09-14",
  "2027-09-15", "2027-09-16", "2027-10-03", "2027-10-04",
  "2027-10-09", "2027-12-25",
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

export function isHoliday(
  date: Date,
  holidays: Set<string> = KR_HOLIDAYS_FALLBACK,
): boolean {
  return holidays.has(ymd(date));
}

/** 평일이면서 공휴일이 아닌 날 */
export function isBusinessDay(
  date: Date,
  holidays: Set<string> = KR_HOLIDAYS_FALLBACK,
): boolean {
  return !isWeekend(date) && !isHoliday(date, holidays);
}

export type MonthWork = {
  /** 이번 달(1일~말일) 영업일 수 */
  monthBusinessDays: number;
  /** monthBusinessDays × 8시간(분) — flex 월 소정근로시간 */
  monthTotalMinutes: number;
  /** 오늘(포함)부터 말일까지 남은 영업일 수 */
  remainingBusinessDays: number;
  /** remainingBusinessDays × 8시간(분) — 남은 인정근무시간 기본값 */
  remainingTotalMinutes: number;
};

/**
 * 이번 달 인정근무시간 총합과 남은 근무일을 함께 계산한다.
 * today/holidays를 주입할 수 있어 테스트가 가능하다.
 */
export function monthWorkSummary(
  today: Date = new Date(),
  holidays: Set<string> = KR_HOLIDAYS_FALLBACK,
): MonthWork {
  const year = today.getFullYear();
  const month = today.getMonth();
  const lastDay = new Date(year, month + 1, 0).getDate();
  const todayDate = today.getDate();

  let monthBusinessDays = 0;
  let remainingBusinessDays = 0;
  for (let d = 1; d <= lastDay; d++) {
    if (isBusinessDay(new Date(year, month, d), holidays)) {
      monthBusinessDays++;
      if (d >= todayDate) remainingBusinessDays++;
    }
  }

  return {
    monthBusinessDays,
    monthTotalMinutes: monthBusinessDays * STANDARD_WORK_MINUTES,
    remainingBusinessDays,
    remainingTotalMinutes: remainingBusinessDays * STANDARD_WORK_MINUTES,
  };
}

/**
 * Nager.Date 공개 API에서 대한민국 공휴일(YYYY-MM-DD)을 불러온다.
 * 실패하면 폴백 목록을 반환한다. (브라우저에서 직접 호출, CORS 허용됨)
 */
export async function fetchKoreanHolidays(
  years: number[],
): Promise<Set<string>> {
  try {
    const lists = await Promise.all(
      years.map(async (year) => {
        const res = await fetch(
          `https://date.nager.at/api/v3/PublicHolidays/${year}/KR`,
        );
        if (!res.ok) throw new Error(`holiday api ${res.status}`);
        const data: Array<{ date: string }> = await res.json();
        return data.map((h) => h.date);
      }),
    );
    const set = new Set<string>(lists.flat());
    if (set.size === 0) throw new Error("empty holiday list");
    // 폴백 항목도 합쳐 누락을 보완
    KR_HOLIDAYS_FALLBACK.forEach((d) => set.add(d));
    return set;
  } catch {
    return new Set(KR_HOLIDAYS_FALLBACK);
  }
}
