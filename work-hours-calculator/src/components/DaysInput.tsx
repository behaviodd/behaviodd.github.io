/** 남은 근무일 수 입력 */

import { type ReactNode } from "react";
import { FieldLabel } from "./FieldLabel";

type Props = {
  label: string;
  days: number;
  onChange: (days: number) => void;
  info?: ReactNode;
};

export function DaysInput({ label, days, onChange, info }: Props) {
  return (
    <div className="field">
      <FieldLabel info={info}>{label}</FieldLabel>
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
