"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { format, isToday, parseISO } from "date-fns";
import { createClient } from "@/lib/supabase";
import { spring, micro } from "@/lib/animations";
import type { Task, Appointment } from "@/lib/types";

interface Props {
  tasks: Task[];
  appointments: Appointment[];
}

interface TodayTx {
  transaction_id: string;
  name: string;
  merchant_name: string | null;
  amount: number;
  date: string;
  pending: boolean;
}

const BRIEF_KEY = `ld_daily_brief_${format(new Date(), "yyyy-MM-dd")}`;

function Chip({ emoji, label, accent }: { emoji: string; label: string; accent?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={spring}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full shrink-0"
      style={{
        background: accent ? `${accent}12` : "var(--bg-card-hover)",
        border: `1px solid ${accent ? `${accent}28` : "var(--border-card)"}`,
      }}
    >
      <span style={{ fontSize: 13 }}>{emoji}</span>
      <span className="type-small" style={{ fontWeight: 500, color: accent ?? "var(--text-secondary)", whiteSpace: "nowrap" }}>
        {label}
      </span>
    </motion.div>
  );
}

export function DailyBrief({ tasks, appointments }: Props) {
  const [summary, setSummary] = useState<string | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [todayTxs, setTodayTxs] = useState<TodayTx[]>([]);
  const [todaySpend, setTodaySpend] = useState<number | null>(null);
  const [goalsPending, setGoalsPending] = useState<string[]>([]);

  const todayAppts = appointments.filter(a => isToday(parseISO(a.starts_at)));
  const pendingTasks = tasks.filter(t => !t.completed);

  useEffect(() => {
    // Load from cache first
    const cached = localStorage.getItem(BRIEF_KEY);
    if (cached) {
      setSummary(cached);
      setSummaryLoading(false);
    }

    // Fetch Plaid today's transactions
    const fetchTransactions = async () => {
      try {
        const res = await fetch("/api/plaid/transactions?days=1");
        const json = await res.json();
        if (!json.error) {
          const today = format(new Date(), "yyyy-MM-dd");
          const txs: TodayTx[] = (json.transactions ?? []).filter(
            (t: TodayTx) => t.date === today && !t.pending && t.amount > 0
          );
          setTodayTxs(txs);
          setTodaySpend(txs.reduce((s: number, t: TodayTx) => s + t.amount, 0));
          return txs;
        }
      } catch { /* no bank connected */ }
      return [];
    };

    // Fetch goals pending check-in today
    const fetchGoals = async () => {
      try {
        const supabase = createClient();
        const today = format(new Date(), "yyyy-MM-dd");
        const [{ data: goals }, { data: checkIns }] = await Promise.all([
          supabase.from("goals").select("id, title"),
          supabase.from("goal_check_ins").select("goal_id").eq("checked_in_on", today),
        ]);
        const checkedIds = new Set((checkIns ?? []).map((c: { goal_id: string }) => c.goal_id));
        const pending = (goals ?? [])
          .filter((g: { id: string; title: string }) => !checkedIds.has(g.id))
          .map((g: { id: string; title: string }) => g.title);
        setGoalsPending(pending);
        return pending;
      } catch { return []; }
    };

    Promise.all([fetchTransactions(), fetchGoals()]).then(async ([txs, pending]) => {
      if (cached) return; // already have today's brief cached
      setSummaryLoading(true);
      try {
        const res = await fetch("/api/ai/daily-brief", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tasks_pending: pendingTasks.length,
            appointments_today: todayAppts.map(a => ({
              title: a.title,
              time: format(parseISO(a.starts_at), "h:mm a"),
            })),
            goals_pending: pending,
            today_spend: txs.length > 0 ? txs.reduce((s, t) => s + t.amount, 0) : null,
            today_transactions: txs.slice(0, 5).map(t => ({
              name: t.merchant_name ?? t.name,
              amount: t.amount,
            })),
          }),
        });
        const json = await res.json();
        if (json.summary) {
          setSummary(json.summary);
          localStorage.setItem(BRIEF_KEY, json.summary);
        }
      } catch { /* silently fail */ } finally {
        setSummaryLoading(false);
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const hasAnything = pendingTasks.length > 0 || todayAppts.length > 0 || goalsPending.length > 0 || todaySpend !== null;
  if (!hasAnything && !summaryLoading && !summary) return null;

  return (
    <motion.div
      className="card px-5 py-4 flex flex-col gap-3"
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={spring}
    >
      {/* AI summary */}
      <div className="flex items-start gap-2.5 min-h-[20px]">
        <span style={{ fontSize: 14, marginTop: 1 }}>✦</span>
        <AnimatePresence mode="wait">
          {summaryLoading && !summary ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={micro}
              className="flex items-center gap-2"
            >
              <div className="skeleton h-4 rounded" style={{ width: 220 }} />
            </motion.div>
          ) : summary ? (
            <motion.p
              key="summary"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="type-body"
              style={{ color: "var(--text-secondary)", lineHeight: 1.5 }}
            >
              {summary}
            </motion.p>
          ) : null}
        </AnimatePresence>
      </div>

      {/* Stat chips */}
      <div className="flex gap-2 flex-wrap">
        {pendingTasks.length > 0 && (
          <Chip emoji="📋" label={`${pendingTasks.length} task${pendingTasks.length > 1 ? "s" : ""} pending`} accent="#007AFF" />
        )}
        {todayAppts.map(a => (
          <Chip key={a.id} emoji="📅" label={`${a.title} · ${format(parseISO(a.starts_at), "h:mm a")}`} accent="#34C759" />
        ))}
        {goalsPending.length > 0 && (
          <Chip emoji="🌱" label={`${goalsPending.length} goal${goalsPending.length > 1 ? "s" : ""} to check in`} accent="#FF9500" />
        )}
        {todaySpend !== null && todaySpend > 0 && (
          <Chip emoji="💳" label={`$${todaySpend.toFixed(2)} spent today`} accent="#AF52DE" />
        )}
      </div>

      {/* Today's purchases mini-list */}
      {todayTxs.length > 0 && (
        <div className="flex flex-col gap-0" style={{ borderTop: "1px solid var(--border-subtle)", paddingTop: 10 }}>
          {todayTxs.slice(0, 4).map((t, i) => (
            <div
              key={t.transaction_id}
              className="flex items-center justify-between py-1.5"
              style={{ borderBottom: i < Math.min(todayTxs.length, 4) - 1 ? "1px solid var(--border-subtle)" : "none" }}
            >
              <span className="type-small" style={{ color: "var(--text-secondary)" }}>
                {t.merchant_name ?? t.name}
              </span>
              <span className="type-small" style={{ fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>
                −${t.amount.toFixed(2)}
              </span>
            </div>
          ))}
          {todayTxs.length > 4 && (
            <p className="type-small pt-1" style={{ color: "var(--text-tertiary)" }}>
              +{todayTxs.length - 4} more today
            </p>
          )}
        </div>
      )}
    </motion.div>
  );
}
