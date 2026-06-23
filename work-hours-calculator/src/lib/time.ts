/**
 * 시간 계산 유틸.
 *
 * 원칙: 모든 계산은 "분" 단위로 한다. 화면에 보여줄 때만 시간/분/초 또는
 * HH:MM 형태로 변환한다. 평균값처럼 소수점이 남는 값은 일부러 반올림하지
 * 않고 그대로 들고 다니다가, 표시 직전에만 가공한다.
 */

export type TimeParts = {
  hours: number;
  minutes: number;
};

/** 시간 + 분 -> 총 분 */
export function toMinutes(hours: number, minutes: number): number {
  return hours * 60 + minutes;
}

/** 총 분 -> { 시간, 분 } (정수 기준, 내림) */
export function fromMinutes(totalMinutes: number): TimeParts {
  const safe = Math.max(0, Math.floor(totalMinutes));
  return {
    hours: Math.floor(safe / 60),
    minutes: safe % 60,
  };
}

/**
 * 지속시간 표시. 예: 503 -> "8시간 23분"
 * - 분이 0이고 시간이 있으면 "8시간"
 * - 시간이 0이면 "23분"
 * - 둘 다 0이면 "0분"
 */
export function formatDuration(totalMinutes: number): string {
  const { hours, minutes } = fromMinutes(totalMinutes);
  if (hours > 0 && minutes > 0) return `${hours}시간 ${minutes}분`;
  if (hours > 0) return `${hours}시간`;
  return `${minutes}분`;
}

/**
 * 소수점이 있는 분 값을 "시간/분/초"로 표시한다.
 * 예: 502.8 -> "8시간 22분 48초", 500.25 -> "8시간 20분 15초"
 * 평균값(나눗셈 결과)을 사람이 읽을 수 있게 보여줄 때 쓴다.
 */
export function formatDurationDetailed(rawMinutes: number): string {
  const safe = Math.max(0, rawMinutes);
  const hours = Math.floor(safe / 60);
  const remMinutes = safe - hours * 60;
  const minutes = Math.floor(remMinutes);
  let seconds = Math.round((remMinutes - minutes) * 60);

  let h = hours;
  let m = minutes;
  // 반올림으로 60초가 되면 올림 처리
  if (seconds === 60) {
    seconds = 0;
    m += 1;
    if (m === 60) {
      m = 0;
      h += 1;
    }
  }

  const parts: string[] = [];
  if (h > 0) parts.push(`${h}시간`);
  if (m > 0) parts.push(`${m}분`);
  if (seconds > 0) parts.push(`${seconds}초`);
  if (parts.length === 0) return "0분";
  return parts.join(" ");
}

/**
 * 자정 기준 분 -> "HH:MM". 예: 1070 -> "17:50"
 * 24시간을 넘어가면 다음날로 wrap 한다.
 */
export function formatClockTime(totalMinutesFromMidnight: number): string {
  const wrapped = ((Math.round(totalMinutesFromMidnight) % 1440) + 1440) % 1440;
  const hours = Math.floor(wrapped / 60);
  const minutes = wrapped % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(hours)}:${pad(minutes)}`;
}

/** "HH:MM" -> 자정 기준 분. 잘못된 값이면 null */
export function parseClockTime(value: string): number | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value.trim());
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;
  return toMinutes(hours, minutes);
}

/** 안전하게 1분 단위로 올림. 예: 502.8 -> 503 */
export function roundUpToMinute(minutes: number): number {
  return Math.ceil(minutes - 1e-9);
}

/**
 * 남은 시간을 일수로 나누고 안전하게 분 단위로 올림.
 * 0으로 나누는 경우는 0을 반환(호출부에서 일수 검증을 먼저 한다).
 */
export function divideMinutesCeil(totalMinutes: number, days: number): number {
  if (days <= 0) return 0;
  return roundUpToMinute(totalMinutes / days);
}
