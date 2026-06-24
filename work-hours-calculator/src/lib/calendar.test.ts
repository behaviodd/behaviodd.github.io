import { describe, expect, it } from "vitest";
import {
  businessDaysInMonth,
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

describe("calendar: 이번 달 인정근무시간 기본값(한 달 전체)", () => {
  it("2026년 6월 = 평일 22일 × 8시간 = 176시간", () => {
    const r = businessDaysInMonth(new Date(2026, 5, 24));
    expect(r.businessDays).toBe(22);
    expect(r.totalMinutes).toBe(22 * 8 * 60); // 10560분 = 176시간
  });

  it("달 중간 어느 날을 넣어도 그 달 전체 기준(날짜 무관)", () => {
    const a = businessDaysInMonth(new Date(2026, 5, 1));
    const b = businessDaysInMonth(new Date(2026, 5, 30));
    expect(a.businessDays).toBe(b.businessDays);
    expect(a.totalMinutes).toBe(a.businessDays * 480);
  });
});
