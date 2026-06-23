/** 접을 수 있는 상세 계산 카드 */

type Props = {
  title?: string;
  detail: string;
  defaultOpen?: boolean;
};

export function CalculationDetailAccordion({
  title = "상세 계산 보기",
  detail,
  defaultOpen = false,
}: Props) {
  return (
    <details className="card accordion" open={defaultOpen}>
      <summary>{title}</summary>
      <div className="calc-detail">{detail}</div>
    </details>
  );
}
