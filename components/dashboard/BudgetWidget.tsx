"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import { Emoji } from "@/components/ui/Emoji";

interface BudgetItem {
  id: string;
  name: string;
  amount: number;
  type: "recurring" | "one_time";
}

export function BudgetWidget() {
  const [items, setItems] = useState<BudgetItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/budget")
      .then((r) => r.json())
      .then((json) => { setItems(json.items ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const recurring = items.filter((i) => i.type === "recurring");
  const oneTime   = items.filter((i) => i.type === "one_time");
  const recurringTotal = recurring.reduce((s, i) => s + i.amount, 0);
  const oneTimeTotal   = oneTime.reduce((s, i) => s + i.amount, 0);

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Emoji size={15}>💰</Emoji>
          <span className="type-section">Budget</span>
        </div>
        <Link
          href="/budget"
          className="flex items-center gap-1 type-small"
          style={{ color: "var(--accent)", textDecoration: "none", fontWeight: 500 }}
        >
          <Sparkles size={11} />
          AI Adviser
        </Link>
      </div>

      {loading ? (
        <div className="card px-5 py-4 flex flex-col gap-3">
          {[75, 55, 65].map((w) => (
            <div key={w} className="skeleton h-4 rounded" style={{ width: `${w}%` }} />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="card px-5 py-4 flex items-center gap-3">
          <Emoji size={20}>💬</Emoji>
          <div>
            <p className="type-body" style={{ fontWeight: 500 }}>No budget set up yet</p>
            <p className="type-small mt-0.5" style={{ color: "var(--text-tertiary)" }}>
              <Link href="/budget" style={{ color: "var(--accent)", textDecoration: "none" }}>
                Open the AI Adviser
              </Link>
              {" "}to add your first items
            </p>
          </div>
        </div>
      ) : (
        <div className="card px-5 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="type-caption" style={{ letterSpacing: "0.06em" }}>Monthly</p>
              <p className="mt-1" style={{ fontSize: 22, fontWeight: 700, fontVariantNumeric: "tabular-nums", letterSpacing: "-0.02em" }}>
                ${recurringTotal.toFixed(0)}
              </p>
              <p className="type-caption mt-0.5" style={{ letterSpacing: 0, textTransform: "none", color: "var(--text-tertiary)" }}>
                {recurring.length} item{recurring.length !== 1 ? "s" : ""}
              </p>
            </div>
            <div>
              <p className="type-caption" style={{ letterSpacing: "0.06em" }}>One-time</p>
              <p className="mt-1" style={{ fontSize: 22, fontWeight: 700, fontVariantNumeric: "tabular-nums", letterSpacing: "-0.02em", color: oneTimeTotal > 0 ? "var(--text-primary)" : "var(--text-tertiary)" }}>
                {oneTimeTotal > 0 ? `$${oneTimeTotal.toFixed(0)}` : "—"}
              </p>
              <p className="type-caption mt-0.5" style={{ letterSpacing: 0, textTransform: "none", color: "var(--text-tertiary)" }}>
                {oneTime.length > 0 ? `${oneTime.length} expense${oneTime.length !== 1 ? "s" : ""}` : "none"}
              </p>
            </div>
          </div>

          <div
            className="mt-4 pt-3 flex items-center justify-between"
            style={{ borderTop: "1px solid var(--border-subtle)" }}
          >
            <span className="type-small" style={{ color: "var(--text-tertiary)" }}>Expected outflow</span>
            <span className="type-body" style={{ fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>
              ${(recurringTotal + oneTimeTotal).toFixed(0)}
            </span>
          </div>
        </div>
      )}
    </section>
  );
}
