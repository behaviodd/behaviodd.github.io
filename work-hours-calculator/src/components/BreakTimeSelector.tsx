/** 휴게시간 선택. 기본 60분, 프리셋 30/45/60/90분. */

import { formatDuration } from "../lib/time";

const PRESETS = [30, 45, 60, 90];

type Props = {
  breakMinutes: number;
  onChange: (minutes: number) => void;
};

export function BreakTimeSelector({ breakMinutes, onChange }: Props) {
  return (
    <div className="field">
      <label className="field-label">
        휴게시간 <span className="input-unit">(현재 {formatDuration(breakMinutes)})</span>
      </label>
      <div className="preset-row">
        {PRESETS.map((m) => (
          <button
            key={m}
            type="button"
            className={`preset-btn${breakMinutes === m ? " active" : ""}`}
            aria-pressed={breakMinutes === m}
            onClick={() => onChange(m)}
          >
            {formatDuration(m)}
          </button>
        ))}
      </div>
    </div>
  );
}
