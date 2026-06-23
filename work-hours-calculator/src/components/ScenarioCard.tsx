/** 시나리오 결과 카드(ResultCard 겸용). 복사 버튼 포함. */

import { useState } from "react";
import type { PlanLevel } from "../lib/calculations";

export type Row = { k: string; v: string };
export type Note = { text: string; tone?: "normal" | "warn" | "danger" };

type Props = {
  title: string;
  headline: string;
  level: PlanLevel;
  rows: Row[];
  note?: Note;
};

export function ScenarioCard({ title, headline, level, rows, note }: Props) {
  const [copied, setCopied] = useState(false);

  const copyText = [
    title,
    headline,
    ...rows.map((r) => `- ${r.k}: ${r.v}`),
    note ? note.text : "",
  ]
    .filter(Boolean)
    .join("\n");

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(copyText);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  };

  return (
    <section className={`card scenario-card level-${level}`}>
      <p className="scenario-head">{title}</p>
      <p className="scenario-line">{headline}</p>
      <ul className="kv-list">
        {rows.map((r) => (
          <li key={r.k}>
            <span className="k">{r.k}</span>
            <span className="v">{r.v}</span>
          </li>
        ))}
      </ul>
      {note && (
        <p className={`note${note.tone && note.tone !== "normal" ? " " + note.tone : ""}`}>
          {note.text}
        </p>
      )}
      <button type="button" className="copy-btn" onClick={handleCopy}>
        {copied ? "복사됐어요 ✓" : "결과 복사"}
      </button>
    </section>
  );
}
