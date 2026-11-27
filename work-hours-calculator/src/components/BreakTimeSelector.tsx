/** 휴게시간 포함 여부 체크박스. 휴게시간은 1시간만 선택 가능. */

import { FieldLabel } from "./FieldLabel";

const BREAK_MINUTES = 60;

type Props = {
  included: boolean;
  onChange: (included: boolean) => void;
};

export function BreakTimeSelector({ included, onChange }: Props) {
  return (
    <div className="field">
      <FieldLabel info="체류시간 = 인정근무 + 휴게 1시간. 보통 점심 1시간을 빼고 계산해요.">
        휴게시간
      </FieldLabel>
      <label className="checkbox-row">
        <input
          type="checkbox"
          checked={included}
          onChange={(e) => onChange(e.target.checked)}
        />
        <span>휴게시간 1시간 포함</span>
      </label>
    </div>
  );
}

export const BREAK_TIME_MINUTES = BREAK_MINUTES;
