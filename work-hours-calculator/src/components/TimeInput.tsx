/** 시간 + 분 입력(예: 남은 인정근무시간). 분은 0~59만 허용. */

type Props = {
  label: string;
  hours: number;
  minutes: number;
  onChange: (next: { hours: number; minutes: number }) => void;
};

export function TimeInput({ label, hours, minutes, onChange }: Props) {
  const minutesInvalid = minutes < 0 || minutes > 59;

  const clampInt = (raw: string) => {
    const n = parseInt(raw, 10);
    return Number.isNaN(n) ? 0 : n;
  };

  return (
    <div className="field">
      <label className="field-label">{label}</label>
      <div className="input-row">
        <input
          className="time-input"
          type="number"
          inputMode="numeric"
          min={0}
          value={hours}
          aria-label={`${label} 시간`}
          onChange={(e) =>
            onChange({ hours: Math.max(0, clampInt(e.target.value)), minutes })
          }
        />
        <span className="input-unit">시간</span>
        <input
          className="time-input"
          type="number"
          inputMode="numeric"
          min={0}
          max={59}
          value={minutes}
          aria-label={`${label} 분`}
          onChange={(e) => onChange({ hours, minutes: clampInt(e.target.value) })}
        />
        <span className="input-unit">분</span>
      </div>
      {minutesInvalid && (
        <p className="input-hint error">분은 0~59 사이로 입력해 주세요.</p>
      )}
    </div>
  );
}
