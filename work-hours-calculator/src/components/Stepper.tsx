/** 숫자 증감 stepper (연차/반차/반반차 개수 입력) */

type Props = {
  label: string;
  sublabel?: string;
  value: number;
  onChange: (next: number) => void;
  min?: number;
  max?: number;
};

export function Stepper({
  label,
  sublabel,
  value,
  onChange,
  min = 0,
  max = 99,
}: Props) {
  const dec = () => onChange(Math.max(min, value - 1));
  const inc = () => onChange(Math.min(max, value + 1));

  return (
    <div className="stepper-row">
      <div className="stepper-label">
        <span className="stepper-name">{label}</span>
        {sublabel && <span className="stepper-sub">{sublabel}</span>}
      </div>
      <div className="stepper-controls">
        <button
          type="button"
          className="stepper-btn"
          onClick={dec}
          disabled={value <= min}
          aria-label={`${label} 감소`}
        >
          −
        </button>
        <span className="stepper-value" aria-live="polite">
          {value}
        </span>
        <button
          type="button"
          className="stepper-btn"
          onClick={inc}
          disabled={value >= max}
          aria-label={`${label} 증가`}
        >
          +
        </button>
      </div>
    </div>
  );
}
