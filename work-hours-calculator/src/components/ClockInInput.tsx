/**
 * 출근 시간(선택 입력). 오전 8시 ~ 정오(12시)만.
 * 네이티브 time 스피너 대신 커스텀 시/분 드롭다운 + 프리셋 칩으로 사용성 개선.
 */

type Props = {
  label: string;
  value: string; // "HH:MM" 또는 ""
  onChange: (value: string) => void;
  hint?: string;
};

const HOURS = [8, 9, 10, 11, 12];
const MINUTES = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];
const PRESETS = ["08:00", "08:30", "09:00", "09:30", "10:00"];

const pad = (n: number) => String(n).padStart(2, "0");

export function ClockInInput({ label, value, onChange, hint }: Props) {
  const [hStr, mStr] = value ? value.split(":") : ["", ""];
  const hour = hStr === "" ? "" : Number(hStr);
  const minute = mStr === "" ? "" : Number(mStr);

  // 정오(12시)는 00분만 허용
  const minuteOptions = hour === 12 ? [0] : MINUTES;

  const setHour = (h: number) => {
    const m = minute === "" ? 0 : (h === 12 ? 0 : (minute as number));
    onChange(`${pad(h)}:${pad(m)}`);
  };
  const setMinute = (m: number) => {
    const h = hour === "" ? 8 : (hour as number);
    onChange(`${pad(h)}:${pad(m)}`);
  };

  return (
    <div className="field">
      <label className="field-label">{label}</label>

      <div className="timepick">
        <div className="select-wrap">
          <select
            className="time-select"
            value={hour === "" ? "" : String(hour)}
            aria-label={`${label} 시`}
            onChange={(e) => setHour(Number(e.target.value))}
          >
            <option value="" disabled>
              시
            </option>
            {HOURS.map((h) => (
              <option key={h} value={h}>
                {pad(h)}시
              </option>
            ))}
          </select>
        </div>
        <span className="timepick-colon">:</span>
        <div className="select-wrap">
          <select
            className="time-select"
            value={minute === "" ? "" : String(minute)}
            aria-label={`${label} 분`}
            disabled={hour === ""}
            onChange={(e) => setMinute(Number(e.target.value))}
          >
            <option value="" disabled>
              분
            </option>
            {minuteOptions.map((m) => (
              <option key={m} value={m}>
                {pad(m)}분
              </option>
            ))}
          </select>
        </div>
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

      {hint && <p className="input-hint">{hint}</p>}
    </div>
  );
}

export const CLOCK_IN_MIN = "08:00";
export const CLOCK_IN_MAX = "12:00";
