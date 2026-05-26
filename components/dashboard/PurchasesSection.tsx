"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { TrendingDown } from "lucide-react";
import { fadeUp, spring } from "@/lib/animations";
import { createClient } from "@/lib/supabase";

interface PlaidTransaction {
  transaction_id: string;
  name: string;
  merchant_name: string | null;
  amount: number;
  date: string;
  category: string[] | null;
  pending: boolean;
}

const CATEGORY_COLORS: Record<string, string> = {
  "Food and Drink": "#FF9500",
  "Shopping": "#007AFF",
  "Transportation": "#34C759",
  "Entertainment": "#AF52DE",
  "Health": "#FF3B30",
};

function catColor(cats: string[] | null): string {
  if (!cats) return "var(--text-tertiary)";
  for (const c of cats) if (CATEGORY_COLORS[c]) return CATEGORY_COLORS[c];
  return "var(--text-tertiary)";
}

export function PurchasesSection() {
  const [transactions, setTransactions] = useState<PlaidTransaction[]>([]);
  const [connected, setConnected] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const supabase = createClient();
    const { data: items } = await supabase.from("plaid_items").select("id").limit(1);
    const hasBank = (items?.length ?? 0) > 0;
    setConnected(hasBank);

    if (hasBank) {
      const res = await fetch("/api/plaid/transactions");
      const json = await res.json();
      const recent = (json.transactions ?? [])
        .sort((a: PlaidTransaction, b: PlaidTransaction) => b.date.localeCompare(a.date))
        .slice(0, 4);
      setTransactions(recent);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="type-section">Recent Purchases</h2>
      </div>
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        {[1,2,3].map(i => (
          <div key={i} className="flex items-center gap-3 px-5 py-3.5" style={{ borderBottom: i < 3 ? "1px solid var(--border-subtle)" : "none" }}>
            <div className="skeleton w-8 h-8 rounded-[8px] shrink-0" />
            <div className="flex flex-col gap-1.5 flex-1">
              <div className="skeleton h-3.5 rounded" style={{ width: "55%" }} />
              <div className="skeleton h-3 rounded" style={{ width: "30%" }} />
            </div>
          </div>
        ))}
      </div>
    </section>
  );

  if (!connected) return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="type-section" style={{ color: "var(--text-tertiary)" }}>Recent Purchases</h2>
      </div>
      <div className="card px-5 py-6 flex flex-col items-center gap-3 text-center">
        <TrendingDown size={20} style={{ color: "var(--text-tertiary)" }} />
        <p className="type-small">Connect your bank to track spending.</p>
        <Link href="/purchases" className="btn-primary type-small" style={{ textDecoration: "none" }}>
          Connect Bank
        </Link>
      </div>
    </section>
  );

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="type-section">Recent Purchases</h2>
        <Link href="/purchases" className="type-small transition-colors duration-150" style={{ color: "var(--accent)" }}>
          View all →
        </Link>
      </div>

      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        {transactions.length === 0 ? (
          <div className="px-5 py-8 text-center">
            <p className="type-body" style={{ color: "var(--text-secondary)" }}>No recent transactions.</p>
          </div>
        ) : (
          transactions.map((t, i) => (
            <motion.div
              key={t.transaction_id}
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              transition={{ ...spring, delay: i * 0.04 }}
              className="flex items-center gap-3 px-5 py-3.5"
              style={{ borderBottom: i < transactions.length - 1 ? "1px solid var(--border-subtle)" : "none" }}
            >
              <div
                className="shrink-0 flex items-center justify-center"
                style={{ width: 32, height: 32, borderRadius: 8, background: `${catColor(t.category)}18` }}
              >
                <div style={{ width: 7, height: 7, borderRadius: "50%", background: catColor(t.category) }} />
              </div>
              <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                <span className="type-body truncate" style={{ fontWeight: 500, fontSize: 13 }}>
                  {t.merchant_name ?? t.name}
                </span>
                <span className="type-small truncate" style={{ color: "var(--text-tertiary)" }}>
                  {t.date}
                </span>
              </div>
              <span
                className="type-body shrink-0"
                style={{ fontSize: 13, fontWeight: 500, fontVariantNumeric: "tabular-nums", color: t.amount < 0 ? "var(--accent-success)" : "var(--text-primary)" }}
              >
                {t.amount < 0 ? "+" : "−"}${Math.abs(t.amount).toFixed(2)}
              </span>
            </motion.div>
          ))
        )}
      </div>
    </section>
  );
}
