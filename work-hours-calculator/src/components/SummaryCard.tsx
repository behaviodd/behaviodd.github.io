/** 메인 결과 카드. 가장 중요한 문장을 가장 크게 보여준다. */

import type { LevelInfo } from "../lib/calculations";
import { formatClockTime, formatDuration } from "../lib/time";

const LEVEL_TEXT: Record<LevelInfo["level"], string> = {
  easy: "여유",
  normal: "보통",
  warn: "빡셈",
  danger: "위험",
};

type Props = {
  requiredWorkMinutes: number;
  requiredStayMinutes: number;
  level: LevelInfo;
  /** 출근 시간이 입력된 경우의 퇴근 시각(자정 기준 분) */
  leaveMinutes?: number;
  bufferLeaveMinutes?: number;
};

export function SummaryCard({
  requiredWorkMinutes,
  requiredStayMinutes,
  level,
  leaveMinutes,
  bufferLeaveMinutes,
}: Props) {
  const hasLeave = typeof leaveMinutes === "number";

  return (
    <section className={`card summary level-${level.level}`}>
      {hasLeave ? (
        <>
          <p className="summary-label">오늘은</p>
          <p className="summary-leave">{formatClockTime(leaveMinutes!)}에 집 갈 수 있어요</p>
          {typeof bufferLeaveMinutes === "number" && (
            <p className="summary-sub">
              1분 버퍼를 두면 {formatClockTime(bufferLeaveMinutes)} 퇴근이 안전합니다.
            </p>
          )}
        </>
      ) : (
        <>
          <p className="summary-label">오늘의 목표</p>
          <p className="summary-big">{formatDuration(requiredWorkMinutes)} 인정근무</p>
        </>
      )}

      <div className="summary-rows">
        <div className="summary-stat">
          <div className="k">인정근무</div>
          <div className="v">{formatDuration(requiredWorkMinutes)}</div>
        </div>
        <div className="summary-stat">
          <div className="k">체류</div>
          <div className="v">{formatDuration(requiredStayMinutes)}</div>
        </div>
      </div>

      <span className="level-badge">{LEVEL_TEXT[level.level]} · {level.message}</span>
    </section>
  );
}
