/** 출근 시간(선택 입력). 오전 8시 ~ 정오(12시)까지만. 프리셋 칩으로 빠르게 선택. */

type Props = {
  label: string;
  value: string; // "HH:MM" 또는 ""
  onChange: (value: string) => void;
  hint?: string;
};

const MIN_TIME = "08:00";
const MAX_TIME = "12:00";
const PRESETS = ["08:00", "08:30", "09:00", "09:30", "10:00"];

export function ClockInInput({ label, value, onChange, hint }: Props) {
  const outOfRange = value !== "" && (value < MIN_TIME || value > MAX_TIME);

  return (
    <div className="field">
      <label className="field-label">{label}</label>
      <div className="clock-wrap">
        <input
          className="clock-input"
          type="time"
          min={MIN_TIME}
          max={MAX_TIME}
          step={300}
          value={value}
          aria-label={label}
          onChange={(e) => onChange(e.target.value)}
        />
        {value !== "" && (
          <button
            type="button"
            className="clock-clear"
            onClick={() => onChange("")}
            aria-label="출근 시간 지우기"
          >
            지움
          </button>
        )}
      </div>
      <div className="chip-row">
        {PRESETS.map((t) => (
          <button
            key={t}
            type="button"
            className={`chip${value === t ? " active" : ""}`}
            onClick={() => onChange(t)}
          >
            {t}
          </button>
        ))}
      </div>
      {outOfRange ? (
        <p className="input-hint error">
          출근 시간은 오전 8시 ~ 정오(12:00) 사이로 선택해 주세요.
        </p>
      ) : (
        hint && <p className="input-hint">{hint}</p>
      )}
    </div>
  );
}

export const CLOCK_IN_MIN = MIN_TIME;
export const CLOCK_IN_MAX = MAX_TIME;
