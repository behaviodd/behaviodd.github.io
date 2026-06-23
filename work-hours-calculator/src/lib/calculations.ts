/**
 * 근무시간 계산 로직.
 *
 * 용어
 * - 인정근무시간: 근태 시스템에 실제로 쌓이는 시간(보통 휴게 제외).
 * - 체류시간: 출근부터 퇴근까지 회사에 머문 전체 시간.
 * - 휴게시간: 기본 1시간. 체류 = 인정근무 + 휴게.
 *
 * 모든 입력/출력은 분 단위. 표시는 화면(컴포넌트)에서 담당한다.
 */

import { divideMinutesCeil, roundUpToMinute } from "./time";

/** 결과 카드의 강조 색/톤을 결정하는 위험도 */
export type PlanLevel = "easy" | "normal" | "warn" | "danger";

export type LevelInfo = {
  level: PlanLevel;
  /** 사용자에게 보여줄 짧은 안내/위로 문구 */
  message: string;
};

export const HOUR = 60;
export const WORK_WARN_MINUTES = 10 * HOUR; // 하루 인정근무 10시간 이상 -> 경고
export const STAY_DANGER_MINUTES = 11 * HOUR; // 하루 체류 11시간 이상 -> 강한 경고
export const WORK_RELAXED_MINUTES = 8 * HOUR; // 8시간 이하 -> 여유

/**
 * 하루 목표(인정근무/체류)를 기준으로 위험도와 안내 문구를 만든다.
 * 색만으로 정보를 주지 않도록 항상 텍스트를 함께 돌려준다.
 */
export function evaluateLevel(
  requiredWorkMinutes: number,
  requiredStayMinutes: number,
): LevelInfo {
  if (requiredStayMinutes >= STAY_DANGER_MINUTES) {
    return {
      level: "danger",
      message:
        "하루 체류시간이 11시간을 넘어요. 가능하면 일정을 다시 나누는 게 좋아요.",
    };
  }
  if (requiredWorkMinutes >= WORK_WARN_MINUTES) {
    return {
      level: "warn",
      message: "하루 인정근무가 10시간 이상이라 빡센 플랜이에요. 무리하지 마세요.",
    };
  }
  if (requiredWorkMinutes <= WORK_RELAXED_MINUTES) {
    return {
      level: "easy",
      message: "여유 있는 편이에요. 페이스 지키면 충분히 가능해요.",
    };
  }
  return {
    level: "normal",
    message: "아직 빡세지만, 계산상 가능한 플랜이에요.",
  };
}

export type DailyPlan = {
  /** 나눗셈 원본 값(소수점 포함). 표시용 "8시간 22분 48초" */
  averageWorkMinutesRaw: number;
  /** 1분 단위 올림한 안전 인정근무 */
  requiredWorkMinutes: number;
  /** 휴게 포함 체류시간 */
  requiredStayMinutes: number;
};

/**
 * A. 기본 남은 시간 계산.
 * 남은 인정근무시간 / 남은 일수 -> 하루 목표.
 */
export function calculateDailyPlan(
  remainingMinutes: number,
  remainingDays: number,
  breakMinutes: number,
): DailyPlan {
  if (remainingDays <= 0) {
    return {
      averageWorkMinutesRaw: 0,
      requiredWorkMinutes: 0,
      requiredStayMinutes: 0,
    };
  }
  const averageWorkMinutesRaw = remainingMinutes / remainingDays;
  const requiredWorkMinutes = divideMinutesCeil(remainingMinutes, remainingDays);
  const requiredStayMinutes = requiredWorkMinutes + breakMinutes;
  return { averageWorkMinutesRaw, requiredWorkMinutes, requiredStayMinutes };
}

/**
 * B. 출근 시간 기준 퇴근 시간 계산.
 * 퇴근시간 = 출근시간 + 목표 인정근무 + 휴게.
 * 반환값은 자정 기준 분.
 */
export function calculateLeaveTime(
  clockInMinutes: number,
  requiredWorkMinutes: number,
  breakMinutes: number,
): number {
  return clockInMinutes + requiredWorkMinutes + breakMinutes;
}

export type AfterTodayLeave = {
  todayStayMinutes: number;
  todayWorkMinutes: number;
  nextRemainingMinutes: number;
  nextRemainingDays: number;
  nextAverageWorkMinutesRaw: number;
  nextRequiredWorkMinutes: number;
  nextRequiredStayMinutes: number;
};

/**
 * C. 오늘 특정 시간에 퇴근하면 남은 날은?
 * 출근/퇴근으로 오늘 체류 -> 오늘 인정근무를 구하고,
 * 남은 시간/일수에서 차감해 나머지 날의 하루 목표를 다시 계산한다.
 */
export function calculateAfterTodayLeave(
  remainingMinutes: number,
  remainingDays: number,
  clockInMinutes: number,
  leaveMinutes: number,
  breakMinutes: number,
): AfterTodayLeave {
  const todayStayMinutes = leaveMinutes - clockInMinutes;
  const todayWorkMinutes = Math.max(0, todayStayMinutes - breakMinutes);
  const nextRemainingMinutes = remainingMinutes - todayWorkMinutes;
  const nextRemainingDays = remainingDays - 1;

  const plan = calculateDailyPlan(
    nextRemainingMinutes,
    nextRemainingDays,
    breakMinutes,
  );

  return {
    todayStayMinutes,
    todayWorkMinutes,
    nextRemainingMinutes,
    nextRemainingDays,
    nextAverageWorkMinutesRaw: plan.averageWorkMinutesRaw,
    nextRequiredWorkMinutes: plan.requiredWorkMinutes,
    nextRequiredStayMinutes: plan.requiredStayMinutes,
  };
}

export type AfterTodayStay = {
  todayStayMinutes: number;
  todayWorkMinutes: number;
  nextRemainingMinutes: number;
  nextRemainingDays: number;
  nextAverageWorkMinutesRaw: number;
  nextRequiredWorkMinutes: number;
  nextRequiredStayMinutes: number;
};

/**
 * D. 오늘 하루만 N시간 "체류"하면 나머지 날은?
 * 출근 시각 없이 오늘 체류시간만 정하는 시나리오.
 */
export function calculateAfterTodayStay(
  remainingMinutes: number,
  remainingDays: number,
  todayStayMinutes: number,
  breakMinutes: number,
): AfterTodayStay {
  const todayWorkMinutes = Math.max(0, todayStayMinutes - breakMinutes);
  const nextRemainingMinutes = remainingMinutes - todayWorkMinutes;
  const nextRemainingDays = remainingDays - 1;

  const plan = calculateDailyPlan(
    nextRemainingMinutes,
    nextRemainingDays,
    breakMinutes,
  );

  return {
    todayStayMinutes,
    todayWorkMinutes,
    nextRemainingMinutes,
    nextRemainingDays,
    nextAverageWorkMinutesRaw: plan.averageWorkMinutesRaw,
    nextRequiredWorkMinutes: plan.requiredWorkMinutes,
    nextRequiredStayMinutes: plan.requiredStayMinutes,
  };
}

export type SplitStayPlan = {
  /** 짧게 체류하는 날들 */
  shortDays: number;
  shortStayMinutes: number;
  shortWorkMinutes: number;
  /** 나머지 날들 */
  restDays: number;
  restRemainingMinutes: number;
  restAverageWorkMinutesRaw: number;
  restRequiredWorkMinutes: number;
  restRequiredStayMinutes: number;
};

/**
 * E. 특정 "일수"만 짧게 체류하는 분산 플랜.
 * 예: 2일만 9시간 체류하고 나머지는?
 */
export function calculateSplitStay(
  remainingMinutes: number,
  remainingDays: number,
  shortDays: number,
  shortStayMinutes: number,
  breakMinutes: number,
): SplitStayPlan {
  const shortWorkMinutes = Math.max(0, shortStayMinutes - breakMinutes);
  const restDays = remainingDays - shortDays;
  const restRemainingMinutes = remainingMinutes - shortWorkMinutes * shortDays;

  const restAverageWorkMinutesRaw =
    restDays > 0 ? restRemainingMinutes / restDays : 0;
  const restRequiredWorkMinutes =
    restDays > 0 ? divideMinutesCeil(restRemainingMinutes, restDays) : 0;
  const restRequiredStayMinutes =
    restDays > 0 ? restRequiredWorkMinutes + breakMinutes : 0;

  return {
    shortDays,
    shortStayMinutes,
    shortWorkMinutes,
    restDays,
    restRemainingMinutes,
    restAverageWorkMinutesRaw,
    restRequiredWorkMinutes,
    restRequiredStayMinutes,
  };
}

export type LastDaysPlan = {
  /** 마지막에 짧게 체류하는 날들 */
  lastDays: number;
  lastStayMinutes: number;
  lastWorkMinutes: number;
  /** 앞쪽 날들 */
  frontDays: number;
  frontRemainingMinutes: number;
  frontAverageWorkMinutesRaw: number;
  frontRequiredWorkMinutes: number;
  frontRequiredStayMinutes: number;
};

/**
 * F. 마지막 N일을 짧게 체류로 고정하면 앞날은?
 * 예: 마지막 3일을 9시간 체류로 줄이면 앞 이틀은?
 * (계산상 E와 동일 구조지만, 화면 문구가 "마지막/앞"으로 다르다.)
 */
export function calculateLastDaysPlan(
  remainingMinutes: number,
  remainingDays: number,
  lastDays: number,
  lastStayMinutes: number,
  breakMinutes: number,
): LastDaysPlan {
  const lastWorkMinutes = Math.max(0, lastStayMinutes - breakMinutes);
  const frontDays = remainingDays - lastDays;
  const frontRemainingMinutes = remainingMinutes - lastWorkMinutes * lastDays;

  const frontAverageWorkMinutesRaw =
    frontDays > 0 ? frontRemainingMinutes / frontDays : 0;
  const frontRequiredWorkMinutes =
    frontDays > 0 ? divideMinutesCeil(frontRemainingMinutes, frontDays) : 0;
  const frontRequiredStayMinutes =
    frontDays > 0 ? frontRequiredWorkMinutes + breakMinutes : 0;

  return {
    lastDays,
    lastStayMinutes,
    lastWorkMinutes,
    frontDays,
    frontRemainingMinutes,
    frontAverageWorkMinutesRaw,
    frontRequiredWorkMinutes,
    frontRequiredStayMinutes,
  };
}

/** 1분 버퍼를 적용한 안전 퇴근 시각 */
export function withBuffer(leaveMinutes: number, bufferMinutes = 1): number {
  return roundUpToMinute(leaveMinutes) + bufferMinutes;
}
