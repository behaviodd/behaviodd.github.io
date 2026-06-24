/** 출근 시간(선택 입력). 오전 8시 ~ 정오(12시)까지만 선택 가능. */

type Props = {
  label: string;
  value: string; // "HH:MM" 또는 ""
  onChange: (value: string) => void;
  hint?: string;
};

const MIN_TIME = "08:00";
const MAX_TIME = "12:00";

export function ClockInInput({ label, value, onChange, hint }: Props) {
  const outOfRange = value !== "" && (value < MIN_TIME || value > MAX_TIME);

  return (
    <div className="field">
      <label className="field-label">{label}</label>
      <input
        className="clock-input"
        type="time"
        min={MIN_TIME}
        max={MAX_TIME}
        value={value}
        aria-label={label}
        onChange={(e) => onChange(e.target.value)}
      />
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
