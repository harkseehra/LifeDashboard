"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { usePlaidLink } from "react-plaid-link";
import { Building2, RefreshCw, Trash2, AlertCircle, TrendingDown, Plus } from "lucide-react";
import { createClient } from "@/lib/supabase";
import { fadeUp, staggerParent, spring, micro } from "@/lib/animations";

interface PlaidTransaction {
  transaction_id: string;
  name: string;
  merchant_name: string | null;
  amount: number;
  date: string;
  category: string[] | null;
  institution_name: string;
  pending: boolean;
}

interface PlaidItem {
  id: string;
  institution_name: string;
  created_at: string;
}

// Spend category colour map
const CATEGORY_COLORS: Record<string, string> = {
  "Food and Drink": "#FF9500",
  "Shopping": "#007AFF",
  "Transportation": "#34C759",
  "Entertainment": "#AF52DE",
  "Health": "#FF3B30",
  "Travel": "#5AC8FA",
  "Bills": "#FF6B00",
};

function categoryColor(cats: string[] | null): string {
  if (!cats) return "var(--text-tertiary)";
  for (const c of cats) {
    if (CATEGORY_COLORS[c]) return CATEGORY_COLORS[c];
  }
  return "var(--text-tertiary)";
}

function categoryLabel(cats: string[] | null): string {
  if (!cats || cats.length === 0) return "Other";
  return cats[0];
}

// Plaid Link wrapper — must be a separate component so usePlaidLink works
function ConnectBankButton({ onSuccess }: { onSuccess: () => void }) {
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const [loadingToken, setLoadingToken] = useState(false);
  const [tokenError, setTokenError] = useState<string | null>(null);

  const fetchLinkToken = useCallback(async () => {
    setLoadingToken(true);
    setTokenError(null);
    try {
      const res = await fetch("/api/plaid/link-token", { method: "POST" });
      const data = await res.json();
      if (data.error) {
        setTokenError(data.error);
      } else {
        setLinkToken(data.link_token);
      }
    } catch {
      setTokenError("Network error");
    } finally {
      setLoadingToken(false);
    }
  }, []);

  const { open, ready } = usePlaidLink({
    token: linkToken ?? "",
    onSuccess: async (public_token, metadata) => {
      await fetch("/api/plaid/exchange-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          public_token,
          institution_name: metadata.institution?.name ?? "Bank",
        }),
      });
      onSuccess();
    },
  });

  const handleClick = async () => {
    if (!linkToken) {
      await fetchLinkToken();
    } else if (ready) {
      open();
    }
  };

  useEffect(() => {
    if (linkToken && ready) {
      open();
    }
  }, [linkToken, ready, open]);

  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={handleClick}
        disabled={loadingToken}
        className="btn-primary"
      >
        <Plus size={14} />
        {loadingToken ? "Loading…" : "Connect Bank"}
      </button>
      {tokenError && (
        <p className="type-small" style={{ color: "var(--accent-overdue)" }}>
          {tokenError.includes("not configured")
            ? "Add PLAID_CLIENT_ID and PLAID_SECRET to your .env.local file."
            : tokenError}
        </p>
      )}
    </div>
  );
}

export default function PurchasesPage() {
  const [transactions, setTransactions] = useState<PlaidTransaction[]>([]);
  const [items, setItems] = useState<PlaidItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setError(null);
    const supabase = createClient();
    const { data: itemData } = await supabase
      .from("plaid_items")
      .select("id, institution_name, created_at")
      .order("created_at");
    setItems((itemData as PlaidItem[]) ?? []);

    const res = await fetch("/api/plaid/transactions");
    const json = await res.json();
    if (json.error) {
      setError(json.error);
    } else {
      setTransactions(json.transactions ?? []);
    }
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
  };

  const handleDisconnect = async (id: string) => {
    const supabase = createClient();
    await supabase.from("plaid_items").delete().eq("id", id);
    setItems(prev => prev.filter(i => i.id !== id));
    await loadData();
  };

  // Sort transactions by date (newest first)
  const sorted = [...transactions].sort((a, b) => b.date.localeCompare(a.date));

  // Total spend (positive amount = debit in Plaid)
  const totalSpend = sorted.filter(t => t.amount > 0 && !t.pending).reduce((s, t) => s + t.amount, 0);

  return (
    <main className="min-h-screen" style={{ background: "var(--bg-base)" }}>
      <motion.div
        style={{ padding: "var(--page-top) var(--page-gutter) 60px" }}
        variants={staggerParent}
        initial="hidden"
        animate="visible"
        className="flex flex-col gap-8"
      >
        <motion.div variants={fadeUp} transition={spring}>
          <Link href="/" className="type-small" style={{ color: "var(--accent)" }}>← Dashboard</Link>
        </motion.div>

        <motion.div variants={fadeUp} transition={spring} className="flex items-end justify-between">
          <div>
            <h1 className="type-display">Purchases</h1>
            {!loading && transactions.length > 0 && (
              <p className="type-small mt-1" style={{ color: "var(--text-tertiary)" }}>
                Last 30 days · ${totalSpend.toFixed(2)} spent
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {items.length > 0 && (
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="btn-icon"
                aria-label="Refresh transactions"
                style={{ borderRadius: "50%" }}
              >
                <RefreshCw size={14} style={{ opacity: refreshing ? 0.5 : 1 }} />
              </button>
            )}
            <ConnectBankButton onSuccess={() => { setLoading(true); loadData(); }} />
          </div>
        </motion.div>

        {/* Connected banks */}
        {items.length > 0 && (
          <motion.section variants={fadeUp} transition={spring} className="flex flex-col gap-3">
            <h2 className="type-section">Connected Banks</h2>
            <div className="card" style={{ padding: 0, overflow: "hidden" }}>
              {items.map((item, i) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 px-5 py-3.5"
                  style={{ borderBottom: i < items.length - 1 ? "1px solid var(--border-subtle)" : "none" }}
                >
                  <div
                    className="shrink-0 flex items-center justify-center"
                    style={{ width: 32, height: 32, borderRadius: 8, background: "var(--bg-card-hover)" }}
                  >
                    <Building2 size={15} style={{ color: "var(--text-secondary)" }} />
                  </div>
                  <span className="type-body flex-1" style={{ fontWeight: 500 }}>{item.institution_name}</span>
                  <button
                    onClick={() => handleDisconnect(item.id)}
                    className="btn-icon-ghost"
                    onMouseEnter={(e) => { e.currentTarget.style.color = "var(--accent-overdue)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = "var(--text-tertiary)"; }}
                    aria-label={`Disconnect ${item.institution_name}`}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
          </motion.section>
        )}

        {/* Error state */}
        {error && (
          <motion.div
            variants={fadeUp}
            transition={spring}
            className="card px-5 py-4 flex items-start gap-3"
            style={{ border: "1px solid rgba(255,59,48,0.2)" }}
          >
            <AlertCircle size={15} style={{ color: "var(--accent-overdue)", flexShrink: 0, marginTop: 1 }} />
            <div>
              <p className="type-body" style={{ fontWeight: 500, color: "var(--accent-overdue)" }}>Could not load transactions</p>
              <p className="type-small mt-0.5">{error}</p>
            </div>
          </motion.div>
        )}

        {/* Empty — no banks connected */}
        {!loading && items.length === 0 && !error && (
          <motion.div variants={fadeUp} transition={spring} className="card px-6 py-12 flex flex-col items-center gap-4 text-center">
            <div
              style={{ width: 56, height: 56, borderRadius: 16, background: "var(--bg-card-hover)", display: "flex", alignItems: "center", justifyContent: "center" }}
            >
              <TrendingDown size={24} style={{ color: "var(--text-tertiary)" }} />
            </div>
            <div>
              <p className="type-body" style={{ fontWeight: 500 }}>No banks connected</p>
              <p className="type-small mt-1">Connect your bank to see spending automatically.</p>
            </div>
          </motion.div>
        )}

        {/* Loading skeleton */}
        {loading && (
          <motion.div variants={fadeUp} transition={spring} className="card" style={{ padding: 0, overflow: "hidden" }}>
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="flex items-center gap-4 px-5 py-4" style={{ borderBottom: i < 5 ? "1px solid var(--border-subtle)" : "none" }}>
                <div className="skeleton w-9 h-9 rounded-[8px] shrink-0" />
                <div className="flex flex-col gap-1.5 flex-1">
                  <div className="skeleton h-4 rounded" style={{ width: "50%" }} />
                  <div className="skeleton h-3 rounded" style={{ width: "25%" }} />
                </div>
                <div className="skeleton h-4 rounded" style={{ width: 60 }} />
              </div>
            ))}
          </motion.div>
        )}

        {/* Transactions list */}
        {!loading && sorted.length > 0 && (
          <motion.div variants={fadeUp} transition={spring} className="flex flex-col gap-3">
            <h2 className="type-section">Transactions</h2>
            <div className="card" style={{ padding: 0, overflow: "hidden" }}>
              <AnimatePresence initial={false}>
                {sorted.map((t, i) => (
                  <motion.div
                    key={t.transaction_id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ ...micro, delay: i * 0.015 }}
                    className="flex items-center gap-4 px-5 py-3.5"
                    style={{ borderBottom: i < sorted.length - 1 ? "1px solid var(--border-subtle)" : "none" }}
                  >
                    {/* Category dot */}
                    <div
                      className="shrink-0 flex items-center justify-center"
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 10,
                        background: `${categoryColor(t.category)}18`,
                        border: `1px solid ${categoryColor(t.category)}30`,
                      }}
                    >
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: categoryColor(t.category) }} />
                    </div>

                    {/* Name + category */}
                    <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                      <span className="type-body truncate" style={{ fontWeight: 500 }}>
                        {t.merchant_name ?? t.name}
                      </span>
                      <span className="type-small truncate" style={{ color: "var(--text-tertiary)" }}>
                        {categoryLabel(t.category)} · {t.date}
                        {t.pending && " · Pending"}
                      </span>
                    </div>

                    {/* Amount */}
                    <span
                      className="type-body shrink-0"
                      style={{
                        fontWeight: 500,
                        fontVariantNumeric: "tabular-nums",
                        color: t.amount < 0 ? "var(--accent-success)" : "var(--text-primary)",
                      }}
                    >
                      {t.amount < 0 ? "+" : "−"}${Math.abs(t.amount).toFixed(2)}
                    </span>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </motion.div>
    </main>
  );
}
