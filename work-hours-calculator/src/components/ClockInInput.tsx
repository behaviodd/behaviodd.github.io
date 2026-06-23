/** 출근 시간(선택 입력). 네이티브 time input 사용. */

type Props = {
  label: string;
  value: string; // "HH:MM" 또는 ""
  onChange: (value: string) => void;
  hint?: string;
};

export function ClockInInput({ label, value, onChange, hint }: Props) {
  return (
    <div className="field">
      <label className="field-label">{label}</label>
      <input
        className="clock-input"
        type="time"
        value={value}
        aria-label={label}
        onChange={(e) => onChange(e.target.value)}
      />
      {hint && <p className="input-hint">{hint}</p>}
    </div>
  );
}
