import { useEffect, useMemo, useState } from "react";
import "./styles/globals.css";

import { TimeInput } from "./components/TimeInput";
import { DaysInput } from "./components/DaysInput";
import {
  BreakTimeSelector,
  BREAK_TIME_MINUTES,
} from "./components/BreakTimeSelector";
import {
  ClockInInput,
  CLOCK_IN_MIN,
  CLOCK_IN_MAX,
} from "./components/ClockInInput";
import { LeaveSteppers, type LeaveCounts } from "./components/LeaveSteppers";
import { SummaryCard } from "./components/SummaryCard";
import { CalculationDetailAccordion } from "./components/CalculationDetailAccordion";
import {
  QuickScenarioButtons,
  type ScenarioKey,
} from "./components/QuickScenarioButtons";
import {
  ScenarioCard,
  type Note,
  type Row,
} from "./components/ScenarioCard";

import {
  formatClockTime,
  formatDuration,
  formatDurationDetailed,
  fromMinutes,
  parseClockTime,
  toMinutes,
} from "./lib/time";
import {
  monthWorkSummary,
  fetchKoreanHolidays,
  KR_HOLIDAYS_FALLBACK,
} from "./lib/calendar";
import {
  applyCoreTime,
  calculateAfterTodayLeave,
  calculateAfterTodayStay,
  calculateDailyPlan,
  calculateLastDaysPlan,
  calculateLeaveTime,
  calculateSplitStay,
  evaluateLevel,
  withBuffer,
  type PlanLevel,
} from "./lib/calculations";

// 연차/반차/반반차 1개당 차감되는 인정근무시간(분)
const ANNUAL_MINUTES = 8 * 60;
const HALF_MINUTES = 4 * 60;
const QUARTER_MINUTES = 2 * 60;

const CLOCK_IN_MIN_MINUTES = parseClockTime(CLOCK_IN_MIN)!;
const CLOCK_IN_MAX_MINUTES = parseClockTime(CLOCK_IN_MAX)!;

type ScenarioCardData = {
  title: string;
  headline: string;
  level: PlanLevel;
  rows: Row[];
  note?: Note;
};

export default function App() {
  // 대한민국 공휴일 (API 로드 전엔 내장 폴백). 로드되면 기본값을 재계산한다.
  const [holidays, setHolidays] = useState(() => new Set(KR_HOLIDAYS_FALLBACK));
  const monthDefault = useMemo(
    () => monthWorkSummary(new Date(), holidays),
    [holidays],
  );

  // 남은 근무일 기본값 = 오늘 포함 남은 평일.
  // 남은 인정근무시간 기본값 = 남은 근무일 × 8시간.
  const [days, setDays] = useState(monthDefault.remainingBusinessDays);
  const [remaining, setRemaining] = useState(() =>
    fromMinutes(monthDefault.remainingTotalMinutes),
  );
  const [remainingTouched, setRemainingTouched] = useState(false);
  const [daysTouched, setDaysTouched] = useState(false);

  // 공휴일 API 로드 (올해 + 내년)
  useEffect(() => {
    const y = new Date().getFullYear();
    fetchKoreanHolidays([y, y + 1]).then(setHolidays);
  }, []);

  // 공휴일이 갱신되면, 사용자가 직접 만지지 않은 기본값만 다시 채운다.
  useEffect(() => {
    if (!daysTouched) setDays(monthDefault.remainingBusinessDays);
    if (!remainingTouched) {
      setRemaining(fromMinutes(monthDefault.remainingTotalMinutes));
    }
  }, [monthDefault, remainingTouched, daysTouched]);

  const [includeBreak, setIncludeBreak] = useState(true);
  const [clockIn, setClockIn] = useState(""); // "HH:MM"
  const [leave, setLeave] = useState<LeaveCounts>({
    annual: 0,
    half: 0,
    quarter: 0,
  });
  const [scenario, setScenario] = useState<ScenarioKey | null>(null);

  const breakMinutes = includeBreak ? BREAK_TIME_MINUTES : 0;

  // 연차/반차/반반차는 인정근무시간(시간)에서만 차감한다. 근무일 수는 건드리지 않는다.
  // (연차 = −8시간, 반차 = −4시간, 반반차 = −2시간)
  const leaveDeductMinutes =
    leave.annual * ANNUAL_MINUTES +
    leave.half * HALF_MINUTES +
    leave.quarter * QUARTER_MINUTES;

  const baseRemainingMinutes = toMinutes(remaining.hours, remaining.minutes);
  const remainingMinutes = Math.max(0, baseRemainingMinutes - leaveDeductMinutes);
  const effectiveDays = days;

  // ===== 출근 시간 검증 (오전 8시 ~ 정오) =====
  const clockInRaw = parseClockTime(clockIn);
  const clockInOutOfRange =
    clockInRaw !== null &&
    (clockInRaw < CLOCK_IN_MIN_MINUTES || clockInRaw > CLOCK_IN_MAX_MINUTES);
  const clockInMinutes = clockInOutOfRange ? null : clockInRaw;

  // ===== 입력 검증 =====
  const minutesInvalid = remaining.minutes < 0 || remaining.minutes > 59;
  const daysInvalid = effectiveDays <= 0;
  const alreadyDone = remainingMinutes <= 0;
  const baseValid = !daysInvalid && !alreadyDone && !minutesInvalid;

  // ===== 기본 하루 목표 =====
  const basePlan = useMemo(
    () => calculateDailyPlan(remainingMinutes, effectiveDays, breakMinutes),
    [remainingMinutes, effectiveDays, breakMinutes],
  );
  const baseLevel = evaluateLevel(
    basePlan.requiredWorkMinutes,
    basePlan.requiredStayMinutes,
  );

  // ===== 출근 기준 퇴근 시간(B) + 코어타임(12~17시) 보정 =====
  const rawLeaveMinutes =
    clockInMinutes !== null
      ? calculateLeaveTime(
          clockInMinutes,
          basePlan.requiredWorkMinutes,
          breakMinutes,
        )
      : undefined;
  const core =
    rawLeaveMinutes !== undefined ? applyCoreTime(rawLeaveMinutes) : undefined;
  const leaveTimeMinutes = core?.leave;
  const coreFloored = core?.floored ?? false;
  const bufferLeaveMinutes =
    leaveTimeMinutes !== undefined ? withBuffer(leaveTimeMinutes) : undefined;

  // ===== 상세 계산 문구 =====
  const baseDetail = baseValid
    ? [
        leaveDeductMinutes > 0
          ? `원래 남은 시간 ${formatDuration(baseRemainingMinutes)} − 연차 등 ${formatDuration(leaveDeductMinutes)} = ${formatDuration(remainingMinutes)}`
          : null,
        `남은 시간 ${formatDuration(remainingMinutes)} ÷ ${effectiveDays}일`,
        `= 하루 평균 ${formatDurationDetailed(basePlan.averageWorkMinutesRaw)}`,
        `안전하게 1분 올림`,
        `= 하루 ${formatDuration(basePlan.requiredWorkMinutes)} 인정근무`,
        includeBreak ? `휴게 1시간 포함` : `휴게 없음`,
        `= 하루 체류 ${formatDuration(basePlan.requiredStayMinutes)}`,
      ]
        .filter(Boolean)
        .join("\n")
    : "";

  // ===== 시나리오 카드 데이터 =====
  const scenarioData: ScenarioCardData | null = useMemo(() => {
    if (!scenario || !baseValid) return null;
    return buildScenario(
      scenario,
      remainingMinutes,
      effectiveDays,
      breakMinutes,
      clockInMinutes,
    );
  }, [scenario, baseValid, remainingMinutes, effectiveDays, breakMinutes, clockInMinutes]);

  return (
    <div className="app">
      <header className="app-header">
        <h1 className="app-title">퇴근 계산기</h1>
        <p className="app-subtitle">
          남은 근무시간을 나눠서 오늘 몇 시에 집 갈 수 있는지 계산해요.
        </p>
        <p className="app-note">
          코어타임 12:00~17:00 의무 근무 (연차·반차·반반차 제외)
        </p>
      </header>

      {/* 입력 카드 */}
      <section className="card">
        <p className="card-title">기본 입력</p>
        <DaysInput
          label="남은 근무일"
          days={days}
          onChange={(d) => {
            setDays(d);
            setDaysTouched(true);
            // 인정근무시간을 따로 만지지 않았다면 남은 근무일 × 8시간으로 같이 갱신
            if (!remainingTouched) setRemaining(fromMinutes(d * 8 * 60));
          }}
        />
        <p className="input-hint">
          기본값은 오늘 포함 이번 달 남은 평일 {monthDefault.remainingBusinessDays}일이에요.
        </p>
        <TimeInput
          label="남은 인정근무시간"
          hours={remaining.hours}
          minutes={remaining.minutes}
          onChange={(v) => {
            setRemaining(v);
            setRemainingTouched(true);
          }}
        />
        <p className="input-hint">
          기본값은 남은 근무일 {days}일 × 8시간 ={" "}
          <strong>{formatDuration(days * 8 * 60)}</strong>. flex의 남은 시간을 알면 직접
          입력하세요.
        </p>
        <BreakTimeSelector included={includeBreak} onChange={setIncludeBreak} />
        <ClockInInput
          label="출근 시간 (선택)"
          value={clockIn}
          onChange={setClockIn}
          hint="오전 8시~정오 사이. 입력하면 오늘 퇴근 시각까지 계산해요."
        />
        <LeaveSteppers value={leave} onChange={setLeave} />
        {leaveDeductMinutes > 0 && (
          <p className="input-hint">
            연차 등 {formatDuration(leaveDeductMinutes)} 차감 → 적용된 인정근무시간{" "}
            <strong>{formatDuration(remainingMinutes)}</strong>
          </p>
        )}
      </section>

      {/* 안내/오류 배너 */}
      {daysInvalid && (
        <div className="banner error">
          남은 근무일을 1일 이상으로 맞춰 주세요. (연차로 모두 소진됐을 수
          있어요)
        </div>
      )}
      {!daysInvalid && alreadyDone && (
        <div className="banner done">
          이미 채웠어요. 남은 인정근무시간이 없습니다. 🎉
        </div>
      )}

      {/* 메인 결과 */}
      {baseValid && (
        <SummaryCard
          requiredWorkMinutes={basePlan.requiredWorkMinutes}
          requiredStayMinutes={basePlan.requiredStayMinutes}
          level={baseLevel}
          leaveMinutes={leaveTimeMinutes}
          bufferLeaveMinutes={bufferLeaveMinutes}
          coreFloored={coreFloored}
        />
      )}

      {/* 상세 계산 */}
      {baseValid && <CalculationDetailAccordion detail={baseDetail} />}

      {/* 빠른 시나리오 */}
      {baseValid && (
        <QuickScenarioButtons active={scenario} onSelect={setScenario} />
      )}

      {/* 시나리오 결과 */}
      {scenarioData && (
        <ScenarioCard
          title={scenarioData.title}
          headline={scenarioData.headline}
          level={scenarioData.level}
          rows={scenarioData.rows}
          note={scenarioData.note}
        />
      )}

      <p className="footer-note">
        인정근무 = 체류 − 휴게 · 모든 계산은 분 단위로 처리해요.
      </p>
    </div>
  );
}

/** 위험도 -> 결과 카드에 붙일 안내 노트 */
function levelNote(level: ReturnType<typeof evaluateLevel>): Note {
  if (level.level === "danger") return { text: level.message, tone: "danger" };
  if (level.level === "warn") return { text: level.message, tone: "warn" };
  return { text: level.message };
}

/** 시나리오별 결과 카드 데이터 생성 */
function buildScenario(
  key: ScenarioKey,
  remainingMinutes: number,
  days: number,
  breakMinutes: number,
  clockInMinutes: number | null,
): ScenarioCardData {
  switch (key) {
    case "stay8":
    case "stay9":
    case "stay9h30": {
      const stay =
        key === "stay8"
          ? toMinutes(8, 0)
          : key === "stay9"
            ? toMinutes(9, 0)
            : toMinutes(9, 30);
      return stayScenario(remainingMinutes, days, stay, breakMinutes);
    }
    case "leave18":
      return leaveScenario(
        remainingMinutes,
        days,
        clockInMinutes,
        toMinutes(18, 0),
        breakMinutes,
      );
    case "split2x9":
      return splitScenario(
        remainingMinutes,
        days,
        2,
        toMinutes(9, 0),
        breakMinutes,
      );
    case "last3x9":
      return lastDaysScenario(
        remainingMinutes,
        days,
        3,
        toMinutes(9, 0),
        breakMinutes,
      );
  }
}

function stayScenario(
  remainingMinutes: number,
  days: number,
  stay: number,
  breakMinutes: number,
): ScenarioCardData {
  const title = `오늘 ${formatDuration(stay)} 체류하면`;
  if (stay < breakMinutes) {
    return {
      title,
      headline: "체류시간이 휴게시간보다 짧아요.",
      level: "danger",
      rows: [],
      note: { text: "체류시간을 휴게시간보다 길게 잡아 주세요.", tone: "danger" },
    };
  }
  const r = calculateAfterTodayStay(remainingMinutes, days, stay, breakMinutes);
  const rows: Row[] = [
    { k: "오늘 인정근무", v: formatDuration(r.todayWorkMinutes) },
    { k: "남은 시간", v: formatDuration(Math.max(0, r.nextRemainingMinutes)) },
    { k: "남은 일수", v: `${Math.max(0, r.nextRemainingDays)}일` },
  ];

  if (r.nextRemainingDays <= 0) {
    return lastDayEnding(title, r.nextRemainingMinutes, rows);
  }

  const level = evaluateLevel(
    r.nextRequiredWorkMinutes,
    r.nextRequiredStayMinutes,
  );
  rows.push(
    { k: "하루 인정근무", v: formatDuration(r.nextRequiredWorkMinutes) },
    { k: "휴게 포함 체류", v: formatDuration(r.nextRequiredStayMinutes) },
  );
  return {
    title,
    headline: `나머지 ${r.nextRemainingDays}일은 하루 ${formatDuration(
      r.nextRequiredStayMinutes,
    )} 체류하면 돼요.`,
    level: level.level,
    rows,
    note: levelNote(level),
  };
}

function leaveScenario(
  remainingMinutes: number,
  days: number,
  clockInMinutes: number | null,
  leave: number,
  breakMinutes: number,
): ScenarioCardData {
  const title = `오늘 ${formatClockTime(leave)}에 퇴근하면`;
  if (clockInMinutes === null) {
    return {
      title,
      headline: "출근 시간을 먼저 입력해 주세요.",
      level: "normal",
      rows: [],
      note: {
        text: "위 입력 카드에서 오전 8시~정오 사이로 출근 시간을 넣어 주세요.",
      },
    };
  }
  if (leave <= clockInMinutes) {
    return {
      title,
      headline: "퇴근 시간이 출근 시간보다 빨라요.",
      level: "danger",
      rows: [],
      note: {
        text: "다음날로 넘어가는 계산은 지원하지 않아요. 시간을 확인해 주세요.",
        tone: "danger",
      },
    };
  }
  const r = calculateAfterTodayLeave(
    remainingMinutes,
    days,
    clockInMinutes,
    leave,
    breakMinutes,
  );
  const rows: Row[] = [
    { k: "오늘 체류", v: formatDuration(r.todayStayMinutes) },
    { k: "오늘 인정근무", v: formatDuration(r.todayWorkMinutes) },
    { k: "남은 시간", v: formatDuration(Math.max(0, r.nextRemainingMinutes)) },
    { k: "남은 일수", v: `${Math.max(0, r.nextRemainingDays)}일` },
  ];

  if (r.nextRemainingDays <= 0) {
    return lastDayEnding(title, r.nextRemainingMinutes, rows);
  }

  const level = evaluateLevel(
    r.nextRequiredWorkMinutes,
    r.nextRequiredStayMinutes,
  );
  rows.push(
    { k: "남은 날 하루 인정근무", v: formatDuration(r.nextRequiredWorkMinutes) },
    { k: "휴게 포함 체류", v: formatDuration(r.nextRequiredStayMinutes) },
  );
  return {
    title,
    headline: `나머지 ${r.nextRemainingDays}일은 하루 ${formatDuration(
      r.nextRequiredWorkMinutes,
    )} 인정근무가 필요해요.`,
    level: level.level,
    rows,
    note: levelNote(level),
  };
}

function splitScenario(
  remainingMinutes: number,
  days: number,
  shortDays: number,
  stay: number,
  breakMinutes: number,
): ScenarioCardData {
  const title = `${shortDays}일만 ${formatDuration(stay)} 체류하면`;
  const r = calculateSplitStay(
    remainingMinutes,
    days,
    shortDays,
    stay,
    breakMinutes,
  );
  if (r.restDays <= 0) {
    return {
      title,
      headline: "짧게 체류할 일수가 남은 일수보다 많거나 같아요.",
      level: "warn",
      rows: [{ k: "남은 일수", v: `${days}일` }],
      note: { text: "짧게 체류할 일수를 줄여 보세요.", tone: "warn" },
    };
  }
  const level = evaluateLevel(
    r.restRequiredWorkMinutes,
    r.restRequiredStayMinutes,
  );
  return {
    title,
    headline: `${shortDays}일은 ${formatDuration(
      stay,
    )} 체류, 나머지 ${r.restDays}일은 하루 ${formatDuration(
      r.restRequiredStayMinutes,
    )} 체류하면 돼요.`,
    level: level.level,
    rows: [
      { k: `${shortDays}일 체류`, v: formatDuration(stay) },
      { k: "나머지 일수", v: `${r.restDays}일` },
      { k: "나머지 하루 인정근무", v: formatDuration(r.restRequiredWorkMinutes) },
      { k: "나머지 하루 체류", v: formatDuration(r.restRequiredStayMinutes) },
    ],
    note: levelNote(level),
  };
}

function lastDaysScenario(
  remainingMinutes: number,
  days: number,
  lastDays: number,
  stay: number,
  breakMinutes: number,
): ScenarioCardData {
  const title = `마지막 ${lastDays}일을 ${formatDuration(stay)} 체류로 줄이면`;
  const r = calculateLastDaysPlan(
    remainingMinutes,
    days,
    lastDays,
    stay,
    breakMinutes,
  );
  if (r.frontDays <= 0) {
    return {
      title,
      headline: "마지막에 줄일 일수가 남은 일수보다 많거나 같아요.",
      level: "warn",
      rows: [{ k: "남은 일수", v: `${days}일` }],
      note: { text: "마지막에 줄일 일수를 줄여 보세요.", tone: "warn" },
    };
  }
  const level = evaluateLevel(
    r.frontRequiredWorkMinutes,
    r.frontRequiredStayMinutes,
  );
  return {
    title,
    headline: `앞 ${r.frontDays}일은 하루 ${formatDuration(
      r.frontRequiredStayMinutes,
    )} 체류해야 해요.`,
    level: level.level,
    rows: [
      { k: `마지막 ${lastDays}일 체류`, v: formatDuration(stay) },
      { k: "앞쪽 일수", v: `${r.frontDays}일` },
      { k: "앞쪽 하루 인정근무", v: formatDuration(r.frontRequiredWorkMinutes) },
      { k: "앞쪽 하루 체류", v: formatDuration(r.frontRequiredStayMinutes) },
    ],
    note: levelNote(level),
  };
}

/** 오늘이 마지막 근무일이 되는 경우의 공통 처리 */
function lastDayEnding(
  title: string,
  nextRemainingMinutes: number,
  rows: Row[],
): ScenarioCardData {
  if (nextRemainingMinutes <= 0) {
    return {
      title,
      headline: "오늘로 끝! 남은 인정근무를 다 채웠어요. 🎉",
      level: "easy",
      rows,
      note: { text: "수고했어요. 남은 시간이 없습니다." },
    };
  }
  return {
    title,
    headline: `오늘이 마지막인데 ${formatDuration(
      nextRemainingMinutes,
    )} 부족해요.`,
    level: "danger",
    rows,
    note: {
      text: "오늘 체류를 더 늘리거나 일정을 다시 확인해 주세요.",
      tone: "danger",
    },
  };
}
