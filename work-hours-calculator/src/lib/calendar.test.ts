import { describe, expect, it } from "vitest";
import {
  monthWorkSummary,
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

describe("calendar: 월 인정근무시간 총합 + 남은 근무일", () => {
  it("2026년 6월 = 평일 22일 × 8시간 = 176시간 (월 총합)", () => {
    const r = monthWorkSummary(new Date(2026, 5, 24));
    expect(r.monthBusinessDays).toBe(22);
    expect(r.monthTotalMinutes).toBe(22 * 8 * 60); // 176시간
  });

  it("2026-06-24 기준 남은 평일 = 5일 (24,25,26,29,30, 오늘 포함)", () => {
    const r = monthWorkSummary(new Date(2026, 5, 24));
    expect(r.remainingBusinessDays).toBe(5);
  });

  it("월초엔 남은 평일 = 월 전체 평일", () => {
    const r = monthWorkSummary(new Date(2026, 5, 1));
    expect(r.remainingBusinessDays).toBe(r.monthBusinessDays);
  });
});
