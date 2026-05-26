"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { usePlaidLink } from "react-plaid-link";
import { RefreshCw, Trash2, AlertCircle, Plus } from "lucide-react";
import { createClient } from "@/lib/supabase";
import { fadeUp, staggerParent, spring, micro } from "@/lib/animations";

// ── Category → emoji + color ───────────────────────────────────────────────

const CATEGORY_MAP: Record<string, { emoji: string; color: string }> = {
  // Food
  "Food and Drink":               { emoji: "🍔", color: "#FF9500" },
  "Restaurants":                  { emoji: "🍽️", color: "#FF9500" },
  "Fast Food":                    { emoji: "🍟", color: "#FF9500" },
  "Coffee Shop":                  { emoji: "☕", color: "#A0522D" },
  "Bakeries":                     { emoji: "🥐", color: "#D2691E" },
  "Bar":                          { emoji: "🍺", color: "#FF9500" },
  "Breweries":                    { emoji: "🍻", color: "#FF9500" },
  // Groceries
  "Supermarkets and Groceries":   { emoji: "🥦", color: "#34C759" },
  "Groceries":                    { emoji: "🥦", color: "#34C759" },
  // Transport
  "Transportation":               { emoji: "🚗", color: "#34C759" },
  "Gas Stations":                 { emoji: "⛽", color: "#34C759" },
  "Taxi":                         { emoji: "🚕", color: "#FFCC00" },
  "Ride Share":                   { emoji: "🚗", color: "#34C759" },
  "Parking":                      { emoji: "🅿️", color: "#5AC8FA" },
  "Public Transportation":        { emoji: "🚌", color: "#34C759" },
  // Travel
  "Travel":                       { emoji: "✈️", color: "#5AC8FA" },
  "Airlines and Aviation Services": { emoji: "✈️", color: "#5AC8FA" },
  "Hotels":                       { emoji: "🏨", color: "#5AC8FA" },
  "Car Rental":                   { emoji: "🚗", color: "#5AC8FA" },
  "Vacation Rentals":             { emoji: "🏖️", color: "#5AC8FA" },
  // Shopping
  "Shopping":                     { emoji: "🛒", color: "#007AFF" },
  "Clothing and Accessories":     { emoji: "👕", color: "#007AFF" },
  "Electronics":                  { emoji: "💻", color: "#007AFF" },
  "Sporting Goods":               { emoji: "⚽", color: "#007AFF" },
  "Books and Magazines":          { emoji: "📚", color: "#007AFF" },
  "Pet Supplies":                 { emoji: "🐾", color: "#007AFF" },
  "Kids":                         { emoji: "👶", color: "#007AFF" },
  "Pharmacies":                   { emoji: "💊", color: "#FF3B30" },
  // Health
  "Health":                       { emoji: "🏥", color: "#FF3B30" },
  "Healthcare":                   { emoji: "🏥", color: "#FF3B30" },
  "Gyms and Fitness Centers":     { emoji: "💪", color: "#FF3B30" },
  "Dentists":                     { emoji: "🦷", color: "#FF3B30" },
  "Doctors":                      { emoji: "👨‍⚕️", color: "#FF3B30" },
  // Entertainment
  "Entertainment":                { emoji: "🎬", color: "#AF52DE" },
  "Movies and DVDs":              { emoji: "🎬", color: "#AF52DE" },
  "Music":                        { emoji: "🎵", color: "#AF52DE" },
  "Games":                        { emoji: "🎮", color: "#AF52DE" },
  "Recreation":                   { emoji: "🎯", color: "#AF52DE" },
  // Bills / Home
  "Service":                      { emoji: "🔧", color: "#8E8E93" },
  "Home":                         { emoji: "🏠", color: "#8E8E93" },
  "Rent":                         { emoji: "🏠", color: "#8E8E93" },
  "Utilities":                    { emoji: "💡", color: "#FFCC00" },
  "Telecommunication Services":   { emoji: "📱", color: "#8E8E93" },
  "Internet Services":            { emoji: "🌐", color: "#8E8E93" },
  "Insurance":                    { emoji: "🛡️", color: "#8E8E93" },
  "Subscription":                 { emoji: "🔄", color: "#8E8E93" },
  // Finance
  "Bank Charges":                 { emoji: "🏦", color: "#636366" },
  "ATM":                          { emoji: "🏧", color: "#636366" },
  "Transfer":                     { emoji: "💸", color: "#636366" },
  "Payment":                      { emoji: "💳", color: "#636366" },
  "Credit Card":                  { emoji: "💳", color: "#636366" },
  "Tax":                          { emoji: "📋", color: "#636366" },
  "Income":                       { emoji: "💰", color: "#34C759" },
  "Payroll":                      { emoji: "💰", color: "#34C759" },
  "Deposit":                      { emoji: "💰", color: "#34C759" },
  "Interest Earned":              { emoji: "📈", color: "#34C759" },
  // Education
  "Education":                    { emoji: "📚", color: "#5AC8FA" },
  // Charity
  "Charity":                      { emoji: "❤️", color: "#FF3B30" },
  "Government":                   { emoji: "🏛️", color: "#8E8E93" },
};

function getCategoryInfo(cats: string[] | null): { emoji: string; color: string; label: string } {
  if (!cats || cats.length === 0) return { emoji: "💳", color: "#8E8E93", label: "Other" };
  // Try most specific first, then top-level
  for (const c of [...cats].reverse()) {
    if (CATEGORY_MAP[c]) return { ...CATEGORY_MAP[c], label: cats[0] };
  }
  return { emoji: "💳", color: "#8E8E93", label: cats[0] };
}

// Account type → emoji
function accountEmoji(type: string, subtype: string | null): string {
  if (subtype === "checking") return "🏦";
  if (subtype === "savings") return "💰";
  if (subtype === "credit card") return "💳";
  if (type === "investment") return "📈";
  if (type === "loan") return "📋";
  return "🏦";
}

// ── Types ──────────────────────────────────────────────────────────────────

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

interface PlaidAccount {
  account_id: string;
  name: string;
  official_name: string | null;
  type: string;
  subtype: string | null;
  balance_current: number;
  balance_available: number | null;
  iso_currency_code: string;
  institution_name: string;
}

interface PlaidItem {
  id: string;
  institution_name: string;
  created_at: string;
}

// ── Connect Bank button ────────────────────────────────────────────────────

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
      if (data.error) setTokenError(data.error);
      else setLinkToken(data.link_token);
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
        body: JSON.stringify({ public_token, institution_name: metadata.institution?.name ?? "Bank" }),
      });
      onSuccess();
    },
  });

  const handleClick = async () => {
    if (!linkToken) await fetchLinkToken();
    else if (ready) open();
  };

  useEffect(() => {
    if (linkToken && ready) open();
  }, [linkToken, ready, open]);

  return (
    <div className="flex flex-col items-end gap-1">
      <button onClick={handleClick} disabled={loadingToken} className="btn-primary">
        <Plus size={14} />
        {loadingToken ? "Loading…" : "Connect Bank"}
      </button>
      {tokenError && (
        <p className="type-small" style={{ color: "var(--accent-overdue)", maxWidth: 240, textAlign: "right" }}>
          {tokenError}
        </p>
      )}
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────

// AI category cache — persisted in localStorage
const AI_CACHE_KEY = "ld_tx_categories";

function loadCache(): Record<string, { emoji: string; label: string }> {
  try { return JSON.parse(localStorage.getItem(AI_CACHE_KEY) ?? "{}"); } catch { return {}; }
}
function saveCache(c: Record<string, { emoji: string; label: string }>) {
  try { localStorage.setItem(AI_CACHE_KEY, JSON.stringify(c)); } catch { /* ignore */ }
}

// Label → color for AI categories
const LABEL_COLOR: Record<string, string> = {
  Food: "#FF9500", Coffee: "#A0522D", Groceries: "#34C759",
  Gas: "#34C759", Transport: "#34C759", Travel: "#5AC8FA",
  Shopping: "#007AFF", Entertainment: "#AF52DE", Health: "#FF3B30",
  Pharmacy: "#FF3B30", Rent: "#8E8E93", Utilities: "#FFCC00",
  Phone: "#8E8E93", Internet: "#8E8E93", Subscriptions: "#8E8E93",
  Education: "#5AC8FA", Finance: "#636366", Income: "#34C759",
  Other: "#8E8E93",
};

export default function PurchasesPage() {
  const [transactions, setTransactions] = useState<PlaidTransaction[]>([]);
  const [accounts, setAccounts] = useState<PlaidAccount[]>([]);
  const [items, setItems] = useState<PlaidItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aiCategories, setAiCategories] = useState<Record<string, { emoji: string; label: string }>>({});
  const categorizingRef = useRef(false);

  const categorizeWithAI = useCallback(async (txs: PlaidTransaction[]) => {
    if (categorizingRef.current || !txs.length) return;
    const cache = loadCache();
    const uncached = txs.filter(t => !cache[t.transaction_id]);
    if (!uncached.length) { setAiCategories(cache); return; }

    categorizingRef.current = true;
    try {
      const res = await fetch("/api/ai/categorize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transactions: uncached.map(t => ({
          id: t.transaction_id, name: t.name, merchant_name: t.merchant_name, amount: t.amount,
        })) }),
      });
      const json = await res.json();
      if (json.categories) {
        const merged = { ...cache, ...json.categories };
        saveCache(merged);
        setAiCategories(merged);
      }
    } finally {
      categorizingRef.current = false;
    }
  }, []);

  const loadData = useCallback(async () => {
    setError(null);
    setAiCategories(loadCache());
    const supabase = createClient();
    const { data: itemData } = await supabase
      .from("plaid_items")
      .select("id, institution_name, created_at")
      .order("created_at");
    setItems((itemData as PlaidItem[]) ?? []);

    const [txRes, acctRes] = await Promise.all([
      fetch("/api/plaid/transactions"),
      fetch("/api/plaid/accounts"),
    ]);

    const txJson = await txRes.json();
    const acctJson = await acctRes.json();

    if (txJson.error) setError(txJson.error);
    else {
      const txs = txJson.transactions ?? [];
      setTransactions(txs);
      categorizeWithAI(txs);
    }

    if (!acctJson.error) setAccounts(acctJson.accounts ?? []);

    setLoading(false);
    setRefreshing(false);
  }, [categorizeWithAI]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleRefresh = async () => { setRefreshing(true); await loadData(); };

  const handleDisconnect = async (id: string) => {
    const supabase = createClient();
    await supabase.from("plaid_items").delete().eq("id", id);
    setItems(prev => prev.filter(i => i.id !== id));
    await loadData();
  };

  const sorted = [...transactions].sort((a, b) => b.date.localeCompare(a.date));
  const totalSpend = sorted.filter(t => t.amount > 0 && !t.pending).reduce((s, t) => s + t.amount, 0);

  // Net balance across all depository accounts
  const depositAccounts = accounts.filter(a => a.type === "depository");
  const totalBalance = depositAccounts.reduce((s, a) => s + a.balance_current, 0);
  const currency = accounts[0]?.iso_currency_code ?? "CAD";

  return (
    <main className="min-h-screen" style={{ background: "var(--bg-base)" }}>
      <motion.div
        style={{ padding: "var(--page-top) var(--page-gutter) 60px" }}
        variants={staggerParent}
        initial="hidden"
        animate="visible"
        className="flex flex-col gap-8"
      >
        {/* Back */}
        <motion.div variants={fadeUp} transition={spring}>
          <Link href="/" className="type-small" style={{ color: "var(--accent)" }}>← Dashboard</Link>
        </motion.div>

        {/* Header */}
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
              <button onClick={handleRefresh} disabled={refreshing} className="btn-icon" style={{ borderRadius: "50%" }} aria-label="Refresh">
                <RefreshCw size={14} style={{ opacity: refreshing ? 0.4 : 1, transition: "opacity 150ms" }} />
              </button>
            )}
            <ConnectBankButton onSuccess={() => { setLoading(true); loadData(); }} />
          </div>
        </motion.div>

        {/* Balance cards */}
        {!loading && accounts.length > 0 && (
          <motion.div variants={fadeUp} transition={spring} className="flex flex-col gap-3">
            <h2 className="type-section">Balances</h2>
            <div className="flex gap-3 overflow-x-auto" style={{ scrollbarWidth: "none", paddingBottom: 2 }}>

              {/* Total balance summary card */}
              {depositAccounts.length > 1 && (
                <div
                  className="card shrink-0 px-5 py-4 flex flex-col gap-1"
                  style={{ minWidth: 180, background: "var(--accent)", border: "none" }}
                >
                  <p className="type-caption" style={{ color: "rgba(255,255,255,0.7)" }}>Total Balance</p>
                  <p style={{ fontSize: 24, fontWeight: 700, color: "#fff", letterSpacing: "-0.03em", fontFamily: "inherit" }}>
                    ${totalBalance.toLocaleString("en-CA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                  <p className="type-small" style={{ color: "rgba(255,255,255,0.6)" }}>{currency} · {depositAccounts.length} accounts</p>
                </div>
              )}

              {/* Individual account cards */}
              {accounts.map((acct) => (
                <motion.div
                  key={acct.account_id}
                  className="card shrink-0 px-5 py-4 flex flex-col gap-2"
                  style={{ minWidth: 200 }}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={spring}
                >
                  <div className="flex items-center gap-2">
                    <span style={{ fontSize: 18 }}>{accountEmoji(acct.type, acct.subtype)}</span>
                    <div className="flex flex-col min-w-0">
                      <p className="type-small truncate" style={{ fontWeight: 500, color: "var(--text-primary)" }}>
                        {acct.name}
                      </p>
                      <p className="type-caption truncate">{acct.institution_name}</p>
                    </div>
                  </div>
                  <div>
                    <p style={{ fontSize: 20, fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.02em", fontFamily: "inherit" }}>
                      ${acct.balance_current.toLocaleString("en-CA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                    {acct.balance_available !== null && acct.balance_available !== acct.balance_current && (
                      <p className="type-small" style={{ color: "var(--text-tertiary)" }}>
                        ${acct.balance_available.toLocaleString("en-CA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} available
                      </p>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

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
                  <span style={{ fontSize: 20 }}>🏦</span>
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

        {/* Error */}
        {error && (
          <motion.div variants={fadeUp} transition={spring} className="card px-5 py-4 flex items-start gap-3" style={{ border: "1px solid rgba(255,59,48,0.2)" }}>
            <AlertCircle size={15} style={{ color: "var(--accent-overdue)", flexShrink: 0, marginTop: 1 }} />
            <div>
              <p className="type-body" style={{ fontWeight: 500, color: "var(--accent-overdue)" }}>Could not load data</p>
              <p className="type-small mt-0.5">{error}</p>
            </div>
          </motion.div>
        )}

        {/* Empty state */}
        {!loading && items.length === 0 && !error && (
          <motion.div variants={fadeUp} transition={spring} className="card px-6 py-14 flex flex-col items-center gap-4 text-center">
            <div style={{ width: 64, height: 64, borderRadius: 20, background: "var(--bg-card-hover)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 30 }}>
              🏦
            </div>
            <div>
              <p className="type-body" style={{ fontWeight: 500 }}>No banks connected</p>
              <p className="type-small mt-1">Connect your bank to see your balance and spending.</p>
            </div>
          </motion.div>
        )}

        {/* Loading skeleton */}
        {loading && (
          <motion.div variants={fadeUp} transition={spring} className="flex flex-col gap-3">
            <div className="flex gap-3">
              {[180, 200, 200].map((w, i) => (
                <div key={i} className="skeleton shrink-0 rounded-[14px]" style={{ width: w, height: 96 }} />
              ))}
            </div>
            <div className="card" style={{ padding: 0, overflow: "hidden" }}>
              {[1,2,3,4,5].map(i => (
                <div key={i} className="flex items-center gap-4 px-5 py-4" style={{ borderBottom: i < 5 ? "1px solid var(--border-subtle)" : "none" }}>
                  <div className="skeleton shrink-0" style={{ width: 40, height: 40, borderRadius: 12 }} />
                  <div className="flex flex-col gap-1.5 flex-1">
                    <div className="skeleton h-4 rounded" style={{ width: "50%" }} />
                    <div className="skeleton h-3 rounded" style={{ width: "28%" }} />
                  </div>
                  <div className="skeleton h-4 rounded" style={{ width: 64 }} />
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Transactions */}
        {!loading && sorted.length > 0 && (
          <motion.div variants={fadeUp} transition={spring} className="flex flex-col gap-3">
            <h2 className="type-section">Transactions</h2>
            <div className="card" style={{ padding: 0, overflow: "hidden" }}>
              <AnimatePresence initial={false}>
                {sorted.map((t, i) => {
                  const ai = aiCategories[t.transaction_id];
                  const fallback = getCategoryInfo(t.category);
                  const emoji = ai?.emoji ?? fallback.emoji;
                  const label = ai?.label ?? fallback.label;
                  const color = (ai ? LABEL_COLOR[ai.label] : null) ?? fallback.color;
                  return (
                    <motion.div
                      key={t.transaction_id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ ...micro, delay: Math.min(i * 0.012, 0.3) }}
                      className="flex items-center gap-4 px-5 py-3.5"
                      style={{ borderBottom: i < sorted.length - 1 ? "1px solid var(--border-subtle)" : "none" }}
                    >
                      {/* Emoji icon */}
                      <div
                        className="shrink-0 flex items-center justify-center"
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 12,
                          background: `${color}15`,
                          fontSize: 20,
                          lineHeight: 1,
                        }}
                      >
                        {emoji}
                      </div>

                      {/* Name + meta */}
                      <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                        <span className="type-body truncate" style={{ fontWeight: 500 }}>
                          {t.merchant_name ?? t.name}
                        </span>
                        <span className="type-small" style={{ color: "var(--text-tertiary)" }}>
                          {label} · {t.date}{t.pending ? " · Pending" : ""}
                        </span>
                      </div>

                      {/* Amount */}
                      <span
                        className="type-body shrink-0"
                        style={{
                          fontWeight: 600,
                          fontVariantNumeric: "tabular-nums",
                          color: t.amount < 0 ? "var(--accent-success)" : "var(--text-primary)",
                        }}
                      >
                        {t.amount < 0 ? "+" : "−"}${Math.abs(t.amount).toFixed(2)}
                      </span>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </motion.div>
    </main>
  );
}
