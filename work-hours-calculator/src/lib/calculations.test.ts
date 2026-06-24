/**
 * 요구사항 11장의 실제 테스트 케이스를 그대로 검증한다.
 * 실행: npm test
 */

import { describe, expect, it } from "vitest";
import {
  formatClockTime,
  formatDuration,
  formatDurationDetailed,
  toMinutes,
} from "./time";
import {
  applyCoreTime,
  calculateAfterTodayLeave,
  calculateAfterTodayStay,
  calculateDailyPlan,
  calculateLastDaysPlan,
  calculateLeaveTime,
  calculateSplitStay,
  withBuffer,
} from "./calculations";

describe("케이스 1: 기본 하루 목표", () => {
  it("41시간 54분 ÷ 5일, 휴게 1시간", () => {
    const plan = calculateDailyPlan(toMinutes(41, 54), 5, toMinutes(1, 0));
    expect(formatDurationDetailed(plan.averageWorkMinutesRaw)).toBe(
      "8시간 22분 48초",
    );
    expect(formatDuration(plan.requiredWorkMinutes)).toBe("8시간 23분");
    expect(formatDuration(plan.requiredStayMinutes)).toBe("9시간 23분");
  });
});

describe("케이스 2: 출근 기준 퇴근 시간", () => {
  it("출근 08:27, 목표 8시간 23분, 휴게 1시간", () => {
    const plan = calculateDailyPlan(toMinutes(41, 54), 5, toMinutes(1, 0));
    const leave = calculateLeaveTime(
      toMinutes(8, 27),
      plan.requiredWorkMinutes,
      toMinutes(1, 0),
    );
    expect(formatClockTime(leave)).toBe("17:50");
    expect(formatClockTime(withBuffer(leave))).toBe("17:51");
  });
});

describe("케이스 3: 오늘 18:00 퇴근 시 나머지 날", () => {
  it("출근 08:27, 퇴근 18:00", () => {
    const r = calculateAfterTodayLeave(
      toMinutes(41, 54),
      5,
      toMinutes(8, 27),
      toMinutes(18, 0),
      toMinutes(1, 0),
    );
    expect(formatDuration(r.todayStayMinutes)).toBe("9시간 33분");
    expect(formatDuration(r.todayWorkMinutes)).toBe("8시간 33분");
    expect(formatDuration(r.nextRemainingMinutes)).toBe("33시간 21분");
    expect(r.nextRemainingDays).toBe(4);
    expect(formatDurationDetailed(r.nextAverageWorkMinutesRaw)).toBe(
      "8시간 20분 15초",
    );
    expect(formatDuration(r.nextRequiredWorkMinutes)).toBe("8시간 21분");
    expect(formatDuration(r.nextRequiredStayMinutes)).toBe("9시간 21분");
  });
});

describe("케이스 4: 2일만 9시간 체류(분산 플랜)", () => {
  it("남은 33시간, 4일, 2일 9시간 체류", () => {
    const r = calculateSplitStay(
      toMinutes(33, 0),
      4,
      2,
      toMinutes(9, 0),
      toMinutes(1, 0),
    );
    expect(formatDuration(r.shortStayMinutes)).toBe("9시간");
    expect(r.restDays).toBe(2);
    expect(formatDuration(r.restRequiredStayMinutes)).toBe("9시간 30분");
  });
});

describe("케이스 5: 오늘만 9시간 체류 시 나머지 날", () => {
  it("남은 58시간 43분, 7일, 오늘 9시간 체류", () => {
    const r = calculateAfterTodayStay(
      toMinutes(58, 43),
      7,
      toMinutes(9, 0),
      toMinutes(1, 0),
    );
    expect(formatDuration(r.todayWorkMinutes)).toBe("8시간");
    expect(formatDuration(r.nextRemainingMinutes)).toBe("50시간 43분");
    expect(r.nextRemainingDays).toBe(6);
    expect(formatDurationDetailed(r.nextAverageWorkMinutesRaw)).toBe(
      "8시간 27분 10초",
    );
    expect(formatDuration(r.nextRequiredWorkMinutes)).toBe("8시간 28분");
    expect(formatDuration(r.nextRequiredStayMinutes)).toBe("9시간 28분");
  });
});

describe("코어타임: 12:00~17:00 의무 근무", () => {
  it("계산상 퇴근이 17:00보다 이르면 17:00으로 보정", () => {
    const early = applyCoreTime(toMinutes(16, 30));
    expect(early.floored).toBe(true);
    expect(formatClockTime(early.leave)).toBe("17:00");
  });
  it("17:00 이후면 그대로 둔다", () => {
    const late = applyCoreTime(toMinutes(17, 50));
    expect(late.floored).toBe(false);
    expect(formatClockTime(late.leave)).toBe("17:50");
  });
});

describe("케이스 F: 마지막 3일 9시간 체류 고정", () => {
  it("남은 41시간 54분, 5일, 마지막 3일 9시간 체류", () => {
    const r = calculateLastDaysPlan(
      toMinutes(41, 54),
      5,
      3,
      toMinutes(9, 0),
      toMinutes(1, 0),
    );
    expect(formatDuration(r.lastWorkMinutes)).toBe("8시간");
    expect(r.frontDays).toBe(2);
    expect(formatDuration(r.frontRequiredWorkMinutes)).toBe("8시간 57분");
    expect(formatDuration(r.frontRequiredStayMinutes)).toBe("9시간 57분");
  });
});
