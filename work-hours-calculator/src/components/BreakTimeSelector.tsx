/** 휴게시간 포함 여부 체크박스. 휴게시간은 1시간만 선택 가능. */

const BREAK_MINUTES = 60;

type Props = {
  included: boolean;
  onChange: (included: boolean) => void;
};

export function BreakTimeSelector({ included, onChange }: Props) {
  return (
    <div className="field">
      <label className="field-label">휴게시간</label>
      <label className="checkbox-row">
        <input
          type="checkbox"
          checked={included}
          onChange={(e) => onChange(e.target.checked)}
        />
        <span>휴게시간 1시간 포함</span>
      </label>
      <p className="input-hint">
        {included
          ? "체류시간 = 인정근무 + 1시간으로 계산해요."
          : "휴게 없이 체류시간 = 인정근무로 계산해요."}
      </p>
    </div>
  );
}

export const BREAK_TIME_MINUTES = BREAK_MINUTES;
