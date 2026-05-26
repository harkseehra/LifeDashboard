"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { usePlaidLink } from "react-plaid-link";
import { RefreshCw, Trash2, AlertCircle, Plus, ChevronRight } from "lucide-react";
import { createClient } from "@/lib/supabase";
import { fadeUp, staggerParent, spring, micro, springGentle } from "@/lib/animations";

// Maps both legacy ("Food and Drink") and new PFC codes ("FOOD_AND_DRINK")
const CATEGORY_MAP: Record<string, { emoji: string; color: string }> = {
  // ── New Plaid PFC primary codes ─────────────────────────────
  FOOD_AND_DRINK:              { emoji: "🍔", color: "#FF9500" },
  TRANSPORTATION:              { emoji: "🚗", color: "#34C759" },
  TRAVEL:                      { emoji: "✈️", color: "#5AC8FA" },
  SHOPPING:                    { emoji: "🛒", color: "#007AFF" },
  GENERAL_MERCHANDISE:         { emoji: "🛍️", color: "#007AFF" },
  ENTERTAINMENT:               { emoji: "🎬", color: "#AF52DE" },
  MEDICAL:                     { emoji: "🏥", color: "#FF3B30" },
  PERSONAL_CARE:               { emoji: "💆", color: "#FF3B30" },
  RENT_AND_UTILITIES:          { emoji: "🏠", color: "#8E8E93" },
  HOME_IMPROVEMENT:            { emoji: "🔧", color: "#8E8E93" },
  GENERAL_SERVICES:            { emoji: "🔧", color: "#8E8E93" },
  GOVERNMENT_AND_NON_PROFIT:   { emoji: "🏛️", color: "#8E8E93" },
  INCOME:                      { emoji: "💰", color: "#34C759" },
  TRANSFER_IN:                 { emoji: "💸", color: "#636366" },
  TRANSFER_OUT:                { emoji: "💸", color: "#636366" },
  LOAN_PAYMENTS:               { emoji: "📋", color: "#636366" },
  BANK_FEES:                   { emoji: "🏦", color: "#636366" },
  // ── New PFC detailed codes ───────────────────────────────────
  FOOD_AND_DRINK_COFFEE:       { emoji: "☕", color: "#A0522D" },
  FOOD_AND_DRINK_FAST_FOOD:    { emoji: "🍟", color: "#FF9500" },
  FOOD_AND_DRINK_RESTAURANTS:  { emoji: "🍽️", color: "#FF9500" },
  FOOD_AND_DRINK_GROCERIES:    { emoji: "🥦", color: "#34C759" },
  FOOD_AND_DRINK_ALCOHOL_AND_BAR: { emoji: "🍺", color: "#FF9500" },
  TRANSPORTATION_GAS_AND_CONVENIENCE: { emoji: "⛽", color: "#34C759" },
  TRANSPORTATION_PARKING:      { emoji: "🅿️", color: "#5AC8FA" },
  TRANSPORTATION_PUBLIC_TRANSIT: { emoji: "🚌", color: "#34C759" },
  TRANSPORTATION_TAXIS_AND_RIDE_SHARES: { emoji: "🚕", color: "#FFCC00" },
  TRAVEL_FLIGHTS:              { emoji: "✈️", color: "#5AC8FA" },
  TRAVEL_HOTELS_AND_MOTELS:    { emoji: "🏨", color: "#5AC8FA" },
  TRAVEL_CAR_RENTAL:           { emoji: "🚗", color: "#5AC8FA" },
  ENTERTAINMENT_MUSIC_AND_AUDIO: { emoji: "🎵", color: "#AF52DE" },
  ENTERTAINMENT_SPORTING_EVENTS: { emoji: "⚽", color: "#AF52DE" },
  ENTERTAINMENT_TV_AND_MOVIES:  { emoji: "🎬", color: "#AF52DE" },
  ENTERTAINMENT_VIDEO_GAMES:   { emoji: "🎮", color: "#AF52DE" },
  SHOPPING_CLOTHING_AND_ACCESSORIES: { emoji: "👕", color: "#007AFF" },
  SHOPPING_ELECTRONICS:        { emoji: "💻", color: "#007AFF" },
  SHOPPING_SPORTING_GOODS:     { emoji: "⚽", color: "#007AFF" },
  MEDICAL_PHARMACIES_AND_SUPPLEMENTS: { emoji: "💊", color: "#FF3B30" },
  MEDICAL_GYMS_AND_FITNESS:    { emoji: "💪", color: "#FF3B30" },
  RENT_AND_UTILITIES_TELEPHONE: { emoji: "📱", color: "#8E8E93" },
  RENT_AND_UTILITIES_INTERNET:  { emoji: "🌐", color: "#8E8E93" },
  RENT_AND_UTILITIES_RENT:      { emoji: "🏠", color: "#8E8E93" },
  RENT_AND_UTILITIES_ELECTRICITY: { emoji: "💡", color: "#FFCC00" },
  RENT_AND_UTILITIES_GAS:      { emoji: "🔥", color: "#FF9500" },
  RENT_AND_UTILITIES_WATER:    { emoji: "💧", color: "#5AC8FA" },
  INCOME_WAGES:                { emoji: "💼", color: "#34C759" },
  INCOME_TAX_REFUND:           { emoji: "💰", color: "#34C759" },
  // ── Legacy Plaid category strings ───────────────────────────
  "Food and Drink":            { emoji: "🍔", color: "#FF9500" },
  "Restaurants":               { emoji: "🍽️", color: "#FF9500" },
  "Fast Food":                 { emoji: "🍟", color: "#FF9500" },
  "Coffee Shop":               { emoji: "☕", color: "#A0522D" },
  "Bakeries":                  { emoji: "🥐", color: "#D2691E" },
  "Bar":                       { emoji: "🍺", color: "#FF9500" },
  "Supermarkets and Groceries": { emoji: "🥦", color: "#34C759" },
  "Groceries":                 { emoji: "🥦", color: "#34C759" },
  "Transportation":            { emoji: "🚗", color: "#34C759" },
  "Gas Stations":              { emoji: "⛽", color: "#34C759" },
  "Taxi":                      { emoji: "🚕", color: "#FFCC00" },
  "Parking":                   { emoji: "🅿️", color: "#5AC8FA" },
  "Public Transportation":     { emoji: "🚌", color: "#34C759" },
  "Travel":                    { emoji: "✈️", color: "#5AC8FA" },
  "Airlines and Aviation Services": { emoji: "✈️", color: "#5AC8FA" },
  "Hotels":                    { emoji: "🏨", color: "#5AC8FA" },
  "Shopping":                  { emoji: "🛒", color: "#007AFF" },
  "Clothing and Accessories":  { emoji: "👕", color: "#007AFF" },
  "Electronics":               { emoji: "💻", color: "#007AFF" },
  "Health":                    { emoji: "🏥", color: "#FF3B30" },
  "Healthcare":                { emoji: "🏥", color: "#FF3B30" },
  "Gyms and Fitness Centers":  { emoji: "💪", color: "#FF3B30" },
  "Pharmacies":                { emoji: "💊", color: "#FF3B30" },
  "Entertainment":             { emoji: "🎬", color: "#AF52DE" },
  "Music":                     { emoji: "🎵", color: "#AF52DE" },
  "Games":                     { emoji: "🎮", color: "#AF52DE" },
  "Service":                   { emoji: "🔧", color: "#8E8E93" },
  "Home":                      { emoji: "🏠", color: "#8E8E93" },
  "Utilities":                 { emoji: "💡", color: "#FFCC00" },
  "Telecommunication Services": { emoji: "📱", color: "#8E8E93" },
  "Internet Services":         { emoji: "🌐", color: "#8E8E93" },
  "Insurance":                 { emoji: "🛡️", color: "#8E8E93" },
  "Bank Charges":              { emoji: "🏦", color: "#636366" },
  "Transfer":                  { emoji: "💸", color: "#636366" },
  "Payment":                   { emoji: "💳", color: "#636366" },
  "Tax":                       { emoji: "📋", color: "#636366" },
  "Income":                    { emoji: "💰", color: "#34C759" },
  "Payroll":                   { emoji: "💰", color: "#34C759" },
  "Education":                 { emoji: "📚", color: "#5AC8FA" },
  "Charity":                   { emoji: "❤️", color: "#FF3B30" },
};

// Maps PFC detailed codes to human-readable labels so groceries don't group under "Food And Drink"
const PFC_DETAILED_LABELS: Record<string, string> = {
  FOOD_AND_DRINK_GROCERIES:           "Groceries",
  FOOD_AND_DRINK_COFFEE:              "Coffee",
  FOOD_AND_DRINK_FAST_FOOD:           "Fast Food",
  FOOD_AND_DRINK_RESTAURANTS:         "Restaurants",
  FOOD_AND_DRINK_ALCOHOL_AND_BAR:     "Bars & Drinks",
  TRANSPORTATION_GAS_AND_CONVENIENCE: "Gas",
  TRANSPORTATION_PARKING:             "Parking",
  TRANSPORTATION_PUBLIC_TRANSIT:      "Public Transit",
  TRANSPORTATION_TAXIS_AND_RIDE_SHARES: "Ride Share",
  TRAVEL_FLIGHTS:                     "Flights",
  TRAVEL_HOTELS_AND_MOTELS:           "Hotels",
  ENTERTAINMENT_TV_AND_MOVIES:        "Streaming",
  ENTERTAINMENT_MUSIC_AND_AUDIO:      "Music",
  ENTERTAINMENT_VIDEO_GAMES:          "Games",
  SHOPPING_CLOTHING_AND_ACCESSORIES:  "Clothing",
  SHOPPING_ELECTRONICS:               "Electronics",
  MEDICAL_PHARMACIES_AND_SUPPLEMENTS: "Pharmacy",
  MEDICAL_GYMS_AND_FITNESS:           "Gym & Fitness",
  RENT_AND_UTILITIES_RENT:            "Rent",
  RENT_AND_UTILITIES_TELEPHONE:       "Phone",
  RENT_AND_UTILITIES_INTERNET:        "Internet",
  RENT_AND_UTILITIES_ELECTRICITY:     "Electricity",
  INCOME_WAGES:                       "Wages",
};

function getCategoryInfo(
  cats: string[] | null,
  pfcPrimary: string | null,
  pfcDetailed: string | null,
): { emoji: string; color: string; label: string } {
  if (pfcDetailed && CATEGORY_MAP[pfcDetailed]) {
    // Use the detailed label if available, otherwise fall back to primary
    const label = PFC_DETAILED_LABELS[pfcDetailed]
      ?? pfcPrimary?.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, c => c.toUpperCase())
      ?? "Other";
    return { ...CATEGORY_MAP[pfcDetailed], label };
  }
  if (pfcPrimary && CATEGORY_MAP[pfcPrimary]) {
    const label = pfcPrimary.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
    return { ...CATEGORY_MAP[pfcPrimary], label };
  }
  if (cats && cats.length > 0) {
    for (const c of [...cats].reverse()) {
      if (CATEGORY_MAP[c]) return { ...CATEGORY_MAP[c], label: cats[0] };
    }
    return { emoji: "💳", color: "#8E8E93", label: cats[0] };
  }
  return { emoji: "💳", color: "#8E8E93", label: "Other" };
}

// Detects overrides by transaction name/merchant and amount — runs before AI and Plaid
function getNameOverride(
  name: string,
  merchantName: string | null,
  amount?: number,
): { emoji: string; color: string; label: string } | null {
  const haystack = `${name} ${merchantName ?? ""}`.toLowerCase();
  // Transit cards
  if (haystack.includes("presto")) return { emoji: "🚌", color: "#34C759", label: "Transportation" };
  // Grocery stores (fresco, freshco, wal-mart variants)
  if (
    haystack.includes("fresco") ||
    haystack.includes("freshco") ||
    haystack.includes("fresh co") ||
    haystack.includes("walmart") ||
    haystack.includes("wal-mart")
  ) return { emoji: "🥦", color: "#34C759", label: "Groceries" };
  // PayPal (check before Interac so PayPal e-transfers don't fall through)
  if (haystack.includes("paypal")) return { emoji: "🅿️", color: "#003087", label: "PayPal" };
  // Interac e-transfers: large amounts (>=400) treated as rent
  if (haystack.includes("interac") || haystack.includes("e-transfer") || haystack.includes("etransfer")) {
    if (amount !== undefined && amount >= 400) return { emoji: "🏠", color: "#8E8E93", label: "Rent & Utilities" };
    return { emoji: "🔁", color: "#FFCC00", label: "E-Transfer" };
  }
  return null;
}

// Normalise labels that should be merged or renamed
const CATEGORY_NORMALIZE: Record<string, { label: string; emoji: string; color: string }> = {
  "Bank Fees":        { label: "Fees & Services", emoji: "🏦", color: "#636366" },
  "General Services": { label: "Fees & Services", emoji: "🏦", color: "#636366" },
  "Rent And Utilities": { label: "Rent & Utilities", emoji: "🏠", color: "#8E8E93" },
};

function normalizeCategory(cat: { emoji: string; color: string; label: string }) {
  return CATEGORY_NORMALIZE[cat.label] ?? cat;
}

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
  pfc_primary: string | null;
  pfc_detailed: string | null;
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

interface CategoryBreakdown {
  label: string;
  emoji: string;
  color: string;
  total: number;
  count: number;
  pct: number;
  transactions: PlaidTransaction[];
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

// ── AI cache ───────────────────────────────────────────────────────────────

const AI_CACHE_KEY = "ld_tx_categories";

function loadCache(): Record<string, { emoji: string; label: string }> {
  try { return JSON.parse(localStorage.getItem(AI_CACHE_KEY) ?? "{}"); } catch { return {}; }
}
function saveCache(c: Record<string, { emoji: string; label: string }>) {
  try { localStorage.setItem(AI_CACHE_KEY, JSON.stringify(c)); } catch { /* ignore */ }
}

const LABEL_COLOR: Record<string, string> = {
  Food: "#FF9500", Coffee: "#A0522D", Groceries: "#34C759",
  Gas: "#34C759", Transport: "#34C759", Travel: "#5AC8FA",
  Shopping: "#007AFF", Entertainment: "#AF52DE", Health: "#FF3B30",
  Pharmacy: "#FF3B30", Rent: "#8E8E93", Utilities: "#FFCC00",
  Phone: "#8E8E93", Internet: "#8E8E93", Subscriptions: "#8E8E93",
  Education: "#5AC8FA", Finance: "#636366", Income: "#34C759",
  Other: "#8E8E93",
};

// ── Period options ─────────────────────────────────────────────────────────

const PERIODS = [
  { label: "30 days", days: 30 },
  { label: "60 days", days: 60 },
  { label: "90 days", days: 90 },
] as const;

// ── Page ───────────────────────────────────────────────────────────────────

export default function PurchasesPage() {
  const [transactions, setTransactions] = useState<PlaidTransaction[]>([]);
  const [accounts, setAccounts] = useState<PlaidAccount[]>([]);
  const [items, setItems] = useState<PlaidItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aiCategories, setAiCategories] = useState<Record<string, { emoji: string; label: string }>>({});
  const [days, setDays] = useState<30 | 60 | 90>(30);
  const [periodLoading, setPeriodLoading] = useState(false);
  const [showAllCategories, setShowAllCategories] = useState(false);
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

  const loadData = useCallback(async (d: number, showFullLoad = false) => {
    setError(null);
    if (showFullLoad) setLoading(true);
    setAiCategories(loadCache());
    const supabase = createClient();
    const { data: itemData } = await supabase
      .from("plaid_items")
      .select("id, institution_name, created_at")
      .order("created_at");
    setItems((itemData as PlaidItem[]) ?? []);

    const [txRes, acctRes] = await Promise.all([
      fetch(`/api/plaid/transactions?days=${d}`),
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
    setPeriodLoading(false);
  }, [categorizeWithAI]);

  useEffect(() => { loadData(30, true); }, [loadData]);

  const handlePeriodChange = (newDays: 30 | 60 | 90) => {
    if (newDays === days || periodLoading) return;
    setDays(newDays);
    setPeriodLoading(true);
    loadData(newDays, false);
  };

  const handleRefresh = async () => { setRefreshing(true); await loadData(days, false); };

  const handleDisconnect = async (id: string) => {
    const supabase = createClient();
    await supabase.from("plaid_items").delete().eq("id", id);
    setItems(prev => prev.filter(i => i.id !== id));
    await loadData(days, false);
  };

  const sorted = [...transactions].sort((a, b) => b.date.localeCompare(a.date));
  const expenses = sorted.filter(t => t.amount > 0 && !t.pending);
  const totalSpend = expenses.reduce((s, t) => s + t.amount, 0);

  const depositAccounts = accounts.filter(a => a.type === "depository");
  const totalBalance = depositAccounts.reduce((s, a) => s + a.balance_current, 0);
  const currency = accounts[0]?.iso_currency_code ?? "CAD";

  // ── Category breakdown ────────────────────────────────────────────────────
  const categoryBreakdown: CategoryBreakdown[] = (() => {
    const map = new Map<string, { emoji: string; color: string; total: number; count: number; transactions: PlaidTransaction[] }>();
    for (const t of expenses) {
      const nameOverride = getNameOverride(t.name, t.merchant_name, t.amount);
      const ai = nameOverride ? null : aiCategories[t.transaction_id];
      const fallback = getCategoryInfo(t.category, t.pfc_primary, t.pfc_detailed);
      const resolved = normalizeCategory(nameOverride ?? (ai ? { emoji: ai.emoji, color: LABEL_COLOR[ai.label] ?? "#8E8E93", label: ai.label } : fallback));
      const { label, emoji, color } = resolved;
      const existing = map.get(label);
      if (existing) {
        existing.total += t.amount;
        existing.count += 1;
        existing.transactions.push(t);
      } else {
        map.set(label, { emoji, color, total: t.amount, count: 1, transactions: [t] });
      }
    }
    const entries = Array.from(map.entries())
      .map(([label, v]) => ({ label, ...v, pct: 0 }))
      .sort((a, b) => b.total - a.total);
    const max = entries[0]?.total ?? 1;
    return entries.map(e => ({ ...e, pct: (e.total / max) * 100 }));
  })();

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
        <motion.div variants={fadeUp} transition={spring} className="flex items-end justify-between gap-4 flex-wrap">
          <div>
            <h1 className="type-display">Purchases</h1>
            {!loading && transactions.length > 0 && (
              <p className="type-small mt-1" style={{ color: "var(--text-tertiary)" }}>
                Last {days} days · ${totalSpend.toFixed(2)} spent
              </p>
            )}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {/* Period selector */}
            <div
              className="flex items-center gap-1 p-1 rounded-[10px]"
              style={{ background: "var(--bg-card)", border: "1px solid var(--border-card)" }}
            >
              {PERIODS.map(({ label, days: d }) => (
                <button
                  key={d}
                  onClick={() => handlePeriodChange(d)}
                  className="type-small rounded-[7px] transition-all duration-150"
                  style={{
                    padding: "4px 10px",
                    fontWeight: 500,
                    background: days === d ? "var(--accent)" : "transparent",
                    color: days === d ? "#fff" : "var(--text-secondary)",
                    border: "none",
                    cursor: "pointer",
                    opacity: periodLoading && days !== d ? 0.5 : 1,
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
            {items.length > 0 && (
              <button onClick={handleRefresh} disabled={refreshing} className="btn-icon" style={{ borderRadius: "50%" }} aria-label="Refresh">
                <RefreshCw size={14} style={{ opacity: refreshing ? 0.4 : 1, transition: "opacity 150ms" }} />
              </button>
            )}
            <ConnectBankButton onSuccess={() => { setLoading(true); loadData(days, true); }} />
          </div>
        </motion.div>

        {/* Balance cards */}
        {!loading && accounts.length > 0 && (
          <motion.div variants={fadeUp} transition={spring} className="flex flex-col gap-3">
            <h2 className="type-section">Balances</h2>
            <div className="flex gap-3 overflow-x-auto" style={{ scrollbarWidth: "none", paddingBottom: 2 }}>
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
                      <p className="type-small truncate" style={{ fontWeight: 500, color: "var(--text-primary)" }}>{acct.name}</p>
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

        {/* Spending categories breakdown */}
        <AnimatePresence mode="wait">
          {!loading && categoryBreakdown.length > 0 && (
            <motion.div
              key={`categories-${days}`}
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              exit={{ opacity: 0 }}
              transition={spring}
              className="flex flex-col gap-3"
            >
              <div className="flex items-center justify-between">
                <h2 className="type-section">Spending by category</h2>
                <span className="type-small" style={{ color: "var(--text-tertiary)" }}>
                  {categoryBreakdown.length} categories
                </span>
              </div>

              <div className="card" style={{ padding: 0, overflow: "hidden" }}>
                {(showAllCategories ? categoryBreakdown : categoryBreakdown.slice(0, 8)).map((cat, i, arr) => (
                  <Link
                    key={cat.label}
                    href={`/purchases/category?label=${encodeURIComponent(cat.label)}&days=${days}`}
                    className="flex items-center gap-4 px-5 py-3.5 transition-colors duration-100"
                    style={{
                      borderBottom: i < arr.length - 1 || (categoryBreakdown.length > 8 && !showAllCategories) ? "1px solid var(--border-subtle)" : "none",
                      textDecoration: "none",
                      display: "flex",
                    }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--bg-card-hover)"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                  >
                    {/* Emoji */}
                    <div
                      className="shrink-0 flex items-center justify-center"
                      style={{ width: 36, height: 36, borderRadius: 10, background: `${cat.color}18`, fontSize: 18, lineHeight: 1 }}
                    >
                      {cat.emoji}
                    </div>

                    {/* Category + bar */}
                    <div className="flex-1 min-w-0 flex flex-col gap-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="type-body" style={{ fontWeight: 500, color: "var(--text-primary)" }}>{cat.label}</span>
                        <span className="type-body shrink-0" style={{ fontWeight: 600, fontVariantNumeric: "tabular-nums", color: "var(--text-primary)" }}>
                          ${cat.total.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 rounded-full overflow-hidden" style={{ height: 4, background: "var(--bg-card-hover)" }}>
                          <motion.div
                            style={{ height: 4, background: cat.color, borderRadius: 9999 }}
                            initial={{ width: 0 }}
                            animate={{ width: `${cat.pct}%` }}
                            transition={{ ...springGentle, delay: i * 0.04 }}
                          />
                        </div>
                        <span className="type-small shrink-0" style={{ color: "var(--text-tertiary)", width: 32, textAlign: "right" }}>
                          {cat.count}×
                        </span>
                      </div>
                    </div>

                    <ChevronRight size={14} style={{ color: "var(--text-tertiary)", flexShrink: 0 }} />
                  </Link>
                ))}

                {/* Show more / less */}
                {categoryBreakdown.length > 8 && (
                  <button
                    onClick={() => setShowAllCategories(s => !s)}
                    className="w-full px-5 py-3 flex items-center justify-between"
                    style={{ background: "transparent", border: "none", borderTop: "1px solid var(--border-subtle)", cursor: "pointer" }}
                  >
                    <span className="type-small" style={{ color: "var(--accent)", fontWeight: 500 }}>
                      {showAllCategories ? "Show less" : `Show ${categoryBreakdown.length - 8} more categories`}
                    </span>
                    {!showAllCategories && (
                      <span className="type-small" style={{ color: "var(--text-tertiary)", fontVariantNumeric: "tabular-nums" }}>
                        ${categoryBreakdown.slice(8).reduce((s, c) => s + c.total, 0).toFixed(2)}
                      </span>
                    )}
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

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
            <div className="skeleton rounded-[14px]" style={{ height: 320 }} />
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

        {/* Period switching overlay */}
        {periodLoading && !loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 pointer-events-none flex items-end justify-center pb-8 z-40"
          >
            <div
              className="px-4 py-2.5 rounded-full type-small"
              style={{
                background: "var(--bg-card)",
                border: "1px solid var(--border-card)",
                boxShadow: "var(--shadow-elevated)",
                color: "var(--text-secondary)",
              }}
            >
              Loading {days} days…
            </div>
          </motion.div>
        )}

        {/* Transactions */}
        <AnimatePresence mode="wait">
          {!loading && sorted.length > 0 && (
            <motion.div
              key={`transactions-${days}`}
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              exit={{ opacity: 0 }}
              transition={spring}
              className="flex flex-col gap-3"
            >
              <div className="flex items-center justify-between">
                <h2 className="type-section">Transactions</h2>
                <span className="type-small" style={{ color: "var(--text-tertiary)" }}>
                  {sorted.length} transactions
                </span>
              </div>
              <div className="card" style={{ padding: 0, overflow: "hidden" }}>
                <AnimatePresence initial={false}>
                  {sorted.map((t, i) => {
                    const nameOverride = getNameOverride(t.name, t.merchant_name, t.amount);
                    const ai = nameOverride ? null : aiCategories[t.transaction_id];
                    const fallback = getCategoryInfo(t.category, t.pfc_primary, t.pfc_detailed);
                    const resolved = normalizeCategory(nameOverride ?? (ai ? { emoji: ai.emoji, color: LABEL_COLOR[ai.label] ?? "#8E8E93", label: ai.label } : fallback));
                    const { emoji, label, color } = resolved;
                    return (
                      <motion.div
                        key={t.transaction_id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ ...micro, delay: Math.min(i * 0.01, 0.25) }}
                        className="flex items-center gap-4 px-5 py-3.5"
                        style={{ borderBottom: i < sorted.length - 1 ? "1px solid var(--border-subtle)" : "none" }}
                      >
                        <div
                          className="shrink-0 flex items-center justify-center"
                          style={{ width: 40, height: 40, borderRadius: 12, background: `${color}15`, fontSize: 20, lineHeight: 1 }}
                        >
                          {emoji}
                        </div>
                        <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                          <span className="type-body truncate" style={{ fontWeight: 500 }}>
                            {t.merchant_name ?? t.name}
                          </span>
                          <span className="type-small" style={{ color: "var(--text-tertiary)" }}>
                            {label} · {t.date}{t.pending ? " · Pending" : ""}
                          </span>
                        </div>
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
        </AnimatePresence>
      </motion.div>
    </main>
  );
}
