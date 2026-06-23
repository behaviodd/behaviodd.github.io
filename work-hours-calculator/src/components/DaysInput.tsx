/** 남은 근무일 수 입력 */

type Props = {
  label: string;
  days: number;
  onChange: (days: number) => void;
};

export function DaysInput({ label, days, onChange }: Props) {
  return (
    <div className="field">
      <label className="field-label">{label}</label>
      <div className="input-row">
        <input
          className="num-input"
          type="number"
          inputMode="numeric"
          min={0}
          value={days}
          aria-label={label}
          onChange={(e) => {
            const n = parseInt(e.target.value, 10);
            onChange(Number.isNaN(n) ? 0 : Math.max(0, n));
          }}
        />
        <span className="input-unit">일</span>
      </div>
    </div>
  );
}
