/** 연차/반차/반반차 stepper 묶음. 추가하면 남은 인정근무시간에서 차감된다. */

import { Stepper } from "./Stepper";

export type LeaveCounts = {
  annual: number; // 연차 8시간
  half: number; // 반차 4시간
  quarter: number; // 반반차 2시간
};

type Props = {
  value: LeaveCounts;
  onChange: (next: LeaveCounts) => void;
};

export function LeaveSteppers({ value, onChange }: Props) {
  return (
    <div className="field">
      <label className="field-label">연차 · 반차 · 반반차</label>
      <div className="stepper-list">
        <Stepper
          label="연차"
          sublabel="−8시간"
          value={value.annual}
          onChange={(annual) => onChange({ ...value, annual })}
        />
        <Stepper
          label="반차"
          sublabel="−4시간"
          value={value.half}
          onChange={(half) => onChange({ ...value, half })}
        />
        <Stepper
          label="반반차"
          sublabel="−2시간"
          value={value.quarter}
          onChange={(quarter) => onChange({ ...value, quarter })}
        />
      </div>
    </div>
  );
}
