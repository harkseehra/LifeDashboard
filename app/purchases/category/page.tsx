"use client";

import { useState, useEffect, useCallback, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { fadeUp, staggerParent, spring, micro } from "@/lib/animations";

// ── Shared category logic (mirrors purchases/page.tsx) ────────────────────

const CATEGORY_MAP: Record<string, { emoji: string; color: string }> = {
  FOOD_AND_DRINK: { emoji: "🍔", color: "#FF9500" },
  TRANSPORTATION: { emoji: "🚗", color: "#34C759" },
  TRAVEL: { emoji: "✈️", color: "#5AC8FA" },
  SHOPPING: { emoji: "🛒", color: "#007AFF" },
  GENERAL_MERCHANDISE: { emoji: "🛍️", color: "#007AFF" },
  ENTERTAINMENT: { emoji: "🎬", color: "#AF52DE" },
  MEDICAL: { emoji: "🏥", color: "#FF3B30" },
  PERSONAL_CARE: { emoji: "💆", color: "#FF3B30" },
  RENT_AND_UTILITIES: { emoji: "🏠", color: "#8E8E93" },
  HOME_IMPROVEMENT: { emoji: "🔧", color: "#8E8E93" },
  GENERAL_SERVICES: { emoji: "🔧", color: "#8E8E93" },
  GOVERNMENT_AND_NON_PROFIT: { emoji: "🏛️", color: "#8E8E93" },
  INCOME: { emoji: "💰", color: "#34C759" },
  TRANSFER_IN: { emoji: "💸", color: "#636366" },
  TRANSFER_OUT: { emoji: "💸", color: "#636366" },
  LOAN_PAYMENTS: { emoji: "📋", color: "#636366" },
  BANK_FEES: { emoji: "🏦", color: "#636366" },
  FOOD_AND_DRINK_COFFEE: { emoji: "☕", color: "#A0522D" },
  FOOD_AND_DRINK_FAST_FOOD: { emoji: "🍟", color: "#FF9500" },
  FOOD_AND_DRINK_RESTAURANTS: { emoji: "🍽️", color: "#FF9500" },
  FOOD_AND_DRINK_GROCERIES: { emoji: "🥦", color: "#34C759" },
  FOOD_AND_DRINK_ALCOHOL_AND_BAR: { emoji: "🍺", color: "#FF9500" },
  TRANSPORTATION_GAS_AND_CONVENIENCE: { emoji: "⛽", color: "#34C759" },
  TRANSPORTATION_PARKING: { emoji: "🅿️", color: "#5AC8FA" },
  TRANSPORTATION_PUBLIC_TRANSIT: { emoji: "🚌", color: "#34C759" },
  TRANSPORTATION_TAXIS_AND_RIDE_SHARES: { emoji: "🚕", color: "#FFCC00" },
  TRAVEL_FLIGHTS: { emoji: "✈️", color: "#5AC8FA" },
  TRAVEL_HOTELS_AND_MOTELS: { emoji: "🏨", color: "#5AC8FA" },
  TRAVEL_CAR_RENTAL: { emoji: "🚗", color: "#5AC8FA" },
  ENTERTAINMENT_MUSIC_AND_AUDIO: { emoji: "🎵", color: "#AF52DE" },
  ENTERTAINMENT_SPORTING_EVENTS: { emoji: "⚽", color: "#AF52DE" },
  ENTERTAINMENT_TV_AND_MOVIES: { emoji: "🎬", color: "#AF52DE" },
  ENTERTAINMENT_VIDEO_GAMES: { emoji: "🎮", color: "#AF52DE" },
  SHOPPING_CLOTHING_AND_ACCESSORIES: { emoji: "👕", color: "#007AFF" },
  SHOPPING_ELECTRONICS: { emoji: "💻", color: "#007AFF" },
  SHOPPING_SPORTING_GOODS: { emoji: "⚽", color: "#007AFF" },
  MEDICAL_PHARMACIES_AND_SUPPLEMENTS: { emoji: "💊", color: "#FF3B30" },
  MEDICAL_GYMS_AND_FITNESS: { emoji: "💪", color: "#FF3B30" },
  RENT_AND_UTILITIES_TELEPHONE: { emoji: "📱", color: "#8E8E93" },
  RENT_AND_UTILITIES_INTERNET: { emoji: "🌐", color: "#8E8E93" },
  RENT_AND_UTILITIES_RENT: { emoji: "🏠", color: "#8E8E93" },
  RENT_AND_UTILITIES_ELECTRICITY: { emoji: "💡", color: "#FFCC00" },
  RENT_AND_UTILITIES_GAS: { emoji: "🔥", color: "#FF9500" },
  RENT_AND_UTILITIES_WATER: { emoji: "💧", color: "#5AC8FA" },
  INCOME_WAGES: { emoji: "💼", color: "#34C759" },
  INCOME_TAX_REFUND: { emoji: "💰", color: "#34C759" },
  "Food and Drink": { emoji: "🍔", color: "#FF9500" },
  Restaurants: { emoji: "🍽️", color: "#FF9500" },
  "Fast Food": { emoji: "🍟", color: "#FF9500" },
  "Coffee Shop": { emoji: "☕", color: "#A0522D" },
  Bakeries: { emoji: "🥐", color: "#D2691E" },
  Bar: { emoji: "🍺", color: "#FF9500" },
  "Supermarkets and Groceries": { emoji: "🥦", color: "#34C759" },
  Groceries: { emoji: "🥦", color: "#34C759" },
  Transportation: { emoji: "🚗", color: "#34C759" },
  "Gas Stations": { emoji: "⛽", color: "#34C759" },
  Taxi: { emoji: "🚕", color: "#FFCC00" },
  Parking: { emoji: "🅿️", color: "#5AC8FA" },
  "Public Transportation": { emoji: "🚌", color: "#34C759" },
  Travel: { emoji: "✈️", color: "#5AC8FA" },
  "Airlines and Aviation Services": { emoji: "✈️", color: "#5AC8FA" },
  Hotels: { emoji: "🏨", color: "#5AC8FA" },
  Shopping: { emoji: "🛒", color: "#007AFF" },
  "Clothing and Accessories": { emoji: "👕", color: "#007AFF" },
  Electronics: { emoji: "💻", color: "#007AFF" },
  Health: { emoji: "🏥", color: "#FF3B30" },
  Healthcare: { emoji: "🏥", color: "#FF3B30" },
  "Gyms and Fitness Centers": { emoji: "💪", color: "#FF3B30" },
  Pharmacies: { emoji: "💊", color: "#FF3B30" },
  Entertainment: { emoji: "🎬", color: "#AF52DE" },
  Music: { emoji: "🎵", color: "#AF52DE" },
  Games: { emoji: "🎮", color: "#AF52DE" },
  Service: { emoji: "🔧", color: "#8E8E93" },
  Home: { emoji: "🏠", color: "#8E8E93" },
  Utilities: { emoji: "💡", color: "#FFCC00" },
  "Telecommunication Services": { emoji: "📱", color: "#8E8E93" },
  "Internet Services": { emoji: "🌐", color: "#8E8E93" },
  Insurance: { emoji: "🛡️", color: "#8E8E93" },
  "Bank Charges": { emoji: "🏦", color: "#636366" },
  Transfer: { emoji: "💸", color: "#636366" },
  Payment: { emoji: "💳", color: "#636366" },
  Tax: { emoji: "📋", color: "#636366" },
  Income: { emoji: "💰", color: "#34C759" },
  Payroll: { emoji: "💰", color: "#34C759" },
  Education: { emoji: "📚", color: "#5AC8FA" },
  Charity: { emoji: "❤️", color: "#FF3B30" },
};

const LABEL_COLOR: Record<string, string> = {
  Food: "#FF9500", Coffee: "#A0522D", Groceries: "#34C759",
  Gas: "#34C759", Transport: "#34C759", Travel: "#5AC8FA",
  Shopping: "#007AFF", Entertainment: "#AF52DE", Health: "#FF3B30",
  Pharmacy: "#FF3B30", Rent: "#8E8E93", Utilities: "#FFCC00",
  Phone: "#8E8E93", Internet: "#8E8E93", Subscriptions: "#8E8E93",
  Education: "#5AC8FA", Finance: "#636366", Income: "#34C759",
  Other: "#8E8E93",
};

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

const PFC_DETAILED_LABELS: Record<string, string> = {
  FOOD_AND_DRINK_GROCERIES: "Groceries",
};

function getCategoryInfo(cats: string[] | null, pfcPrimary: string | null, pfcDetailed: string | null): { emoji: string; color: string; label: string } {
  if (pfcDetailed && CATEGORY_MAP[pfcDetailed]) {
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

function getNameOverride(name: string, merchantName: string | null, amount?: number): { emoji: string; color: string; label: string } | null {
  const haystack = `${name} ${merchantName ?? ""}`.toLowerCase();
  if (haystack.includes("presto")) return { emoji: "🚌", color: "#34C759", label: "Transportation" };
  if (
    haystack.includes("fresco") ||
    haystack.includes("freshco") ||
    haystack.includes("fresh co") ||
    haystack.includes("walmart") ||
    haystack.includes("wal-mart")
  ) return { emoji: "🥦", color: "#34C759", label: "Groceries" };
  if (haystack.includes("paypal")) return { emoji: "🅿️", color: "#003087", label: "PayPal" };
  if (haystack.includes("interac") || haystack.includes("e-transfer") || haystack.includes("etransfer")) {
    if (amount !== undefined && amount >= 400) return { emoji: "🏠", color: "#8E8E93", label: "Rent & Utilities" };
    return { emoji: "🔁", color: "#FFCC00", label: "E-Transfer" };
  }
  return null;
}

const CATEGORY_NORMALIZE: Record<string, { label: string; emoji: string; color: string }> = {
  "Bank Fees":          { label: "Fees & Services", emoji: "🏦", color: "#636366" },
  "General Services":   { label: "Fees & Services", emoji: "🏦", color: "#636366" },
  "Rent And Utilities": { label: "Rent & Utilities", emoji: "🏠", color: "#8E8E93" },
};

function normalizeCategory(cat: { emoji: string; color: string; label: string }) {
  return CATEGORY_NORMALIZE[cat.label] ?? cat;
}

function resolveCategory(t: PlaidTransaction, aiCache: Record<string, { emoji: string; label: string }>) {
  const nameOverride = getNameOverride(t.name, t.merchant_name, t.amount);
  if (nameOverride) return normalizeCategory(nameOverride);
  const ai = aiCache[t.transaction_id];
  if (ai) return normalizeCategory({ emoji: ai.emoji, color: LABEL_COLOR[ai.label] ?? "#8E8E93", label: ai.label });
  return normalizeCategory(getCategoryInfo(t.category, t.pfc_primary, t.pfc_detailed));
}

function loadCache(): Record<string, { emoji: string; label: string }> {
  try { return JSON.parse(localStorage.getItem("ld_tx_categories") ?? "{}"); } catch { return {}; }
}

// ── Inner page (needs useSearchParams) ───────────────────────────────────

function CategoryPageInner() {
  const params = useSearchParams();
  const categoryLabel = params.get("label") ?? "";
  const days = parseInt(params.get("days") ?? "30", 10);

  const [transactions, setTransactions] = useState<PlaidTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const aiCacheRef = useRef<Record<string, { emoji: string; label: string }>>({});

  const load = useCallback(async () => {
    setLoading(true);
    aiCacheRef.current = loadCache();
    try {
      const res = await fetch(`/api/plaid/transactions?days=${days}`);
      const json = await res.json();
      if (json.error) { setError(json.error); setLoading(false); return; }
      const all: PlaidTransaction[] = json.transactions ?? [];
      const filtered = all
        .filter(t => !t.pending && t.amount > 0)
        .filter(t => resolveCategory(t, aiCacheRef.current).label === categoryLabel)
        .sort((a, b) => b.date.localeCompare(a.date));
      setTransactions(filtered);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [categoryLabel, days]);

  useEffect(() => { load(); }, [load]);

  const total = transactions.reduce((s, t) => s + t.amount, 0);
  const catInfo = transactions[0]
    ? resolveCategory(transactions[0], aiCacheRef.current)
    : { emoji: "💳", color: "#8E8E93", label: categoryLabel };

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
          <Link
            href="/purchases"
            className="flex items-center gap-1.5 type-small"
            style={{ color: "var(--accent)", width: "fit-content" }}
          >
            <ArrowLeft size={13} />
            Purchases
          </Link>
        </motion.div>

        {/* Header */}
        <motion.div variants={fadeUp} transition={spring} className="flex items-center gap-4">
          <div
            className="flex items-center justify-center shrink-0"
            style={{
              width: 52, height: 52, borderRadius: 14,
              background: `${catInfo.color}18`,
              fontSize: 26,
            }}
          >
            {catInfo.emoji}
          </div>
          <div>
            <h1 className="type-display">{categoryLabel}</h1>
            {!loading && (
              <p className="type-small mt-0.5" style={{ color: "var(--text-tertiary)" }}>
                Last {days} days · {transactions.length} transaction{transactions.length !== 1 ? "s" : ""} · ${total.toFixed(2)} total
              </p>
            )}
          </div>
        </motion.div>

        {/* Error */}
        {error && (
          <motion.div variants={fadeUp} transition={spring} className="card px-5 py-4" style={{ border: "1px solid rgba(255,59,48,0.2)" }}>
            <p className="type-body" style={{ color: "var(--accent-overdue)" }}>{error}</p>
          </motion.div>
        )}

        {/* Skeleton */}
        {loading && (
          <motion.div variants={fadeUp} transition={spring} className="card" style={{ padding: 0, overflow: "hidden" }}>
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="flex items-center gap-4 px-5 py-4" style={{ borderBottom: i < 6 ? "1px solid var(--border-subtle)" : "none" }}>
                <div className="skeleton shrink-0" style={{ width: 40, height: 40, borderRadius: 12 }} />
                <div className="flex flex-col gap-1.5 flex-1">
                  <div className="skeleton h-4 rounded" style={{ width: "50%" }} />
                  <div className="skeleton h-3 rounded" style={{ width: "25%" }} />
                </div>
                <div className="skeleton h-4 rounded" style={{ width: 60 }} />
              </div>
            ))}
          </motion.div>
        )}

        {/* Empty */}
        {!loading && !error && transactions.length === 0 && (
          <motion.div variants={fadeUp} transition={spring} className="card px-6 py-12 text-center">
            <p className="type-body" style={{ fontWeight: 500 }}>No transactions found</p>
            <p className="type-small mt-1" style={{ color: "var(--text-tertiary)" }}>
              No {categoryLabel} transactions in the last {days} days.
            </p>
          </motion.div>
        )}

        {/* Transaction list */}
        {!loading && transactions.length > 0 && (
          <motion.div variants={fadeUp} transition={spring} className="card" style={{ padding: 0, overflow: "hidden" }}>
            {transactions.map((t, i) => (
              <motion.div
                key={t.transaction_id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ ...micro, delay: Math.min(i * 0.012, 0.3) }}
                className="flex items-center gap-4 px-5 py-3.5"
                style={{ borderBottom: i < transactions.length - 1 ? "1px solid var(--border-subtle)" : "none" }}
              >
                <div
                  className="shrink-0 flex items-center justify-center"
                  style={{ width: 40, height: 40, borderRadius: 12, background: `${catInfo.color}15`, fontSize: 20 }}
                >
                  {catInfo.emoji}
                </div>
                <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                  <span className="type-body truncate" style={{ fontWeight: 500 }}>
                    {t.merchant_name ?? t.name}
                  </span>
                  <span className="type-small" style={{ color: "var(--text-tertiary)" }}>
                    {t.date} · {t.institution_name}
                  </span>
                </div>
                <span
                  className="type-body shrink-0"
                  style={{ fontWeight: 600, fontVariantNumeric: "tabular-nums" }}
                >
                  −${t.amount.toFixed(2)}
                </span>
              </motion.div>
            ))}

            {/* Summary footer */}
            <div
              className="flex items-center justify-between px-5 py-3.5"
              style={{ borderTop: "1px solid var(--border-subtle)", background: "var(--bg-card-hover)" }}
            >
              <span className="type-small" style={{ color: "var(--text-tertiary)", fontWeight: 500 }}>
                {transactions.length} transactions
              </span>
              <span className="type-body" style={{ fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>
                ${total.toFixed(2)}
              </span>
            </div>
          </motion.div>
        )}
      </motion.div>
    </main>
  );
}

export default function CategoryPage() {
  return (
    <Suspense>
      <CategoryPageInner />
    </Suspense>
  );
}
