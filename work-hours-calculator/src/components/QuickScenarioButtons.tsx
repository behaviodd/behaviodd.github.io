/** 빠른 시나리오 버튼 그리드 */

export type ScenarioKey =
  | "stay8"
  | "stay9"
  | "stay9h30"
  | "leave18"
  | "split2x9"
  | "last3x9";

const BUTTONS: { key: ScenarioKey; label: string }[] = [
  { key: "stay8", label: "오늘 8시간 체류하면?" },
  { key: "stay9", label: "오늘 9시간 체류하면?" },
  { key: "stay9h30", label: "오늘 9시간 30분 체류하면?" },
  { key: "leave18", label: "오늘 18:00 퇴근하면?" },
  { key: "split2x9", label: "이틀만 9시간 체류하기" },
  { key: "last3x9", label: "마지막 3일 9시간 체류하기" },
];

type Props = {
  active: ScenarioKey | null;
  onSelect: (key: ScenarioKey) => void;
};

export function QuickScenarioButtons({ active, onSelect }: Props) {
  return (
    <section className="card">
      <p className="card-title">빠른 시나리오</p>
      <div className="scenario-buttons">
        {BUTTONS.map((b) => (
          <button
            key={b.key}
            type="button"
            className={`scenario-btn${active === b.key ? " active" : ""}`}
            aria-pressed={active === b.key}
            onClick={() => onSelect(b.key)}
          >
            {b.label}
          </button>
        ))}
      </div>
    </section>
  );
}
