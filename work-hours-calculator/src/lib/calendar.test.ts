import { describe, expect, it } from "vitest";
import {
  businessDaysRemainingThisMonth,
  isBusinessDay,
  isHoliday,
  isWeekend,
} from "./calendar";

describe("calendar: 주말/공휴일 판별", () => {
  it("토·일은 주말", () => {
    expect(isWeekend(new Date(2026, 5, 27))).toBe(true); // 토
    expect(isWeekend(new Date(2026, 5, 28))).toBe(true); // 일
    expect(isWeekend(new Date(2026, 5, 24))).toBe(false); // 수
  });

  it("공휴일은 영업일이 아님", () => {
    expect(isHoliday(new Date(2026, 11, 25))).toBe(true); // 성탄절
    expect(isBusinessDay(new Date(2026, 11, 25))).toBe(false);
    expect(isBusinessDay(new Date(2026, 5, 24))).toBe(true); // 평일
  });
});

describe("calendar: 이번 달 남은 인정근무시간 기본값", () => {
  it("2026-06-24 기준 남은 평일 5일 × 8시간", () => {
    const r = businessDaysRemainingThisMonth(new Date(2026, 5, 24));
    expect(r.businessDays).toBe(5); // 24,25,26,29,30
    expect(r.remainingMinutes).toBe(5 * 8 * 60);
  });

  it("remainingMinutes = businessDays × 480 불변식", () => {
    const r = businessDaysRemainingThisMonth(new Date(2026, 1, 10));
    expect(r.remainingMinutes).toBe(r.businessDays * 480);
  });
});
