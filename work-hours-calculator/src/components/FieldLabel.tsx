/**
 * 입력 라벨 + (선택) ⓘ 툴팁.
 * 긴 설명은 화면에 항상 노출하지 않고, ⓘ를 탭하면 라벨 아래에 펼쳐진다.
 * 모바일에서 떠다니는 팝오버보다 화면 흐름에 그대로 끼워 넣는 편이 안정적이라
 * 절대위치 버블 대신 인라인 노트로 토글한다.
 */

import { type ReactNode, useState } from "react";

type Props = {
  children: ReactNode;
  /** ⓘ로 숨길 설명. 없으면 아이콘을 그리지 않는다. */
  info?: ReactNode;
};

export function FieldLabel({ children, info }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="field-label">
        <span className="field-label-text">{children}</span>
        {info != null && (
          <button
            type="button"
            className="tip-btn"
            aria-label="설명 보기"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            ⓘ
          </button>
        )}
      </div>
      {info != null && open && (
        <p className="tip-note" role="note">
          {info}
        </p>
      )}
    </>
  );
}
