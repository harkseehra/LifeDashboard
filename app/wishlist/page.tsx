"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  Plus,
  Trash2,
  Sparkles,
  AlertCircle,
  TrendingUp,
  DollarSign,
  Clock,
  Zap,
  ChevronDown,
} from "lucide-react";
import { getWishlist, addWishlistItem, deleteWishlistItem } from "@/lib/wishlist";
import { fadeUp, staggerParent, spring, springGentle } from "@/lib/animations";
import { Emoji } from "@/components/ui/Emoji";
import type { WishlistItem, SavingsAdvice } from "@/lib/types";

const EMOJI_OPTIONS = ["🛒", "🚗", "✈️", "💻", "📱", "🏠", "🎸", "⌚", "📷", "🎮", "👟", "🏋️", "📚", "🎨"];

function PriorityBadge({ priority }: { priority: number }) {
  const configs: Record<number, { label: string; color: string; bg: string }> = {
    1: { label: "Priority 1", color: "#FF3B30", bg: "rgba(255,59,48,0.10)" },
    2: { label: "Priority 2", color: "#FF9500", bg: "rgba(255,149,0,0.10)" },
    3: { label: "Priority 3", color: "#007AFF", bg: "rgba(0,122,255,0.10)" },
  };
  const cfg = configs[priority] ?? { label: `P${priority}`, color: "var(--text-tertiary)", bg: "var(--bg-card-hover)" };
  return (
    <span
      className="type-small px-2 py-0.5 rounded-full"
      style={{ color: cfg.color, background: cfg.bg, fontWeight: 500 }}
    >
      {cfg.label}
    </span>
  );
}

function MonthsBar({ months, label, color }: { months: number; label: string; color: string }) {
  const capped = Math.min(months, 24);
  const pct = (capped / 24) * 100;
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <span className="type-small" style={{ color: "var(--text-tertiary)" }}>{label}</span>
        <span className="type-small" style={{ color, fontWeight: 600 }}>
          {months > 24 ? "24+ mo" : `${months} mo`}
        </span>
      </div>
      <div className="h-1.5 rounded-full" style={{ background: "var(--bg-card-hover)" }}>
        <motion.div
          className="h-1.5 rounded-full"
          style={{ background: color }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ ...springGentle, delay: 0.2 }}
        />
      </div>
    </div>
  );
}

export default function WishlistPage() {
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [adding, setAdding] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState("");
  const [cost, setCost] = useState("");
  const [priority, setPriority] = useState(1);
  const [emoji, setEmoji] = useState("🛒");
  const [notes, setNotes] = useState("");
  const [customEmoji, setCustomEmoji] = useState("");

  // AI state
  const [advice, setAdvice] = useState<SavingsAdvice | null>(null);
  const [adviceLoading, setAdviceLoading] = useState(false);
  const [adviceError, setAdviceError] = useState<string | null>(null);
  const [adviceOpen, setAdviceOpen] = useState(false);

  const activeEmoji = customEmoji || emoji;

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoadError(null);
    const { data, error } = await getWishlist();
    if (error) {
      setLoadError(
        error.includes("does not exist")
          ? "Run supabase/migrations/005_wishlist.sql in your Supabase SQL editor first."
          : error
      );
    } else {
      setItems(data);
    }
    setLoading(false);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !cost || adding) return;
    const parsedCost = parseFloat(cost.replace(/,/g, ""));
    if (isNaN(parsedCost) || parsedCost <= 0) {
      setFormError("Enter a valid cost.");
      return;
    }
    setFormError(null);
    setAdding(true);
    const { data, error } = await addWishlistItem({
      title: title.trim(),
      estimated_cost: parsedCost,
      priority,
      emoji: activeEmoji,
      notes: notes.trim() || null,
    });
    setAdding(false);
    if (error || !data) {
      setFormError(error ?? "Couldn't save — try again.");
      return;
    }
    setItems((prev) => [...prev, data].sort((a, b) => a.priority - b.priority));
    setTitle("");
    setCost("");
    setPriority(1);
    setEmoji("🛒");
    setCustomEmoji("");
    setNotes("");
    setShowForm(false);
  };

  const handleDelete = async (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
    await deleteWishlistItem(id);
  };

  const handleGetAdvice = async () => {
    setAdviceLoading(true);
    setAdviceError(null);
    setAdviceOpen(true);
    try {
      const res = await fetch("/api/ai/savings-advice");
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed");
      setAdvice(json.advice);
      // Refresh wishlist from response
      if (json.wishlist) setItems(json.wishlist);
    } catch (err: unknown) {
      setAdviceError(err instanceof Error ? err.message : "Failed to load advice");
    } finally {
      setAdviceLoading(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    background: "var(--bg-base)",
    border: "1px solid var(--border-card)",
    color: "var(--text-primary)",
    outline: "none",
    fontFamily: "inherit",
    transition: "border-color 150ms, box-shadow 150ms",
  };

  const onFocus = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    e.target.style.border = "1px solid var(--accent)";
    e.target.style.boxShadow = "0 0 0 3px rgba(0,122,255,0.12)";
  };
  const onBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    e.target.style.border = "1px solid var(--border-card)";
    e.target.style.boxShadow = "none";
  };

  const adviceItem = advice?.wishlist_advice;

  return (
    <main className="min-h-screen" style={{ background: "var(--bg-base)" }}>
      <motion.div
        style={{ padding: "var(--page-top) var(--page-gutter) 80px" }}
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
        <motion.div variants={fadeUp} transition={spring} className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="type-display">Wishlist</h1>
            <p className="type-small mt-1" style={{ color: "var(--text-tertiary)" }}>
              {items.length > 0
                ? `${items.length} item${items.length === 1 ? "" : "s"} · sorted by priority`
                : "Track what you're saving for"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleGetAdvice}
              disabled={adviceLoading}
              className="btn-primary gap-1.5"
              style={{ gap: 6 }}
            >
              <Sparkles size={13} />
              {adviceLoading ? "Analysing…" : "AI Advice"}
            </button>
            <button
              onClick={() => { setShowForm((s) => !s); setFormError(null); }}
              className={showForm ? "btn-primary" : "btn-secondary"}
            >
              <Plus size={13} />
              Add item
            </button>
          </div>
        </motion.div>

        {/* Add item form */}
        <AnimatePresence>
          {showForm && (
            <motion.form
              onSubmit={handleAdd}
              className="card px-5 py-5 flex flex-col gap-4"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={spring}
            >
              <p className="type-section">New Wishlist Item</p>

              {/* Emoji picker */}
              <div className="flex gap-2 flex-wrap items-center">
                {EMOJI_OPTIONS.map((e) => (
                  <button
                    key={e}
                    type="button"
                    onClick={() => { setEmoji(e); setCustomEmoji(""); }}
                    className="flex items-center justify-center rounded-[8px] transition-all duration-150"
                    style={{
                      width: 36, height: 36,
                      background: !customEmoji && emoji === e ? "var(--accent)" : "var(--bg-card-hover)",
                      border: "none", cursor: "pointer",
                    }}
                  >
                    <Emoji size={18}>{e}</Emoji>
                  </button>
                ))}
                <input
                  type="text"
                  value={customEmoji}
                  onChange={(e) => { setCustomEmoji(e.target.value); if (e.target.value) setEmoji(""); }}
                  maxLength={2}
                  className="type-body text-center rounded-[8px]"
                  style={{
                    width: 36, height: 36, fontSize: 18,
                    background: customEmoji ? "var(--accent)" : "var(--bg-card-hover)",
                    border: customEmoji ? "none" : "1px solid var(--border-card)",
                    color: customEmoji ? "#fff" : "var(--text-primary)",
                    outline: "none", fontFamily: "inherit",
                  }}
                  placeholder="✦"
                />
              </div>

              {/* Title + cost row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. MacBook Pro, Tesla Model 3"
                  autoFocus
                  className="w-full px-4 py-3 rounded-[10px] type-body"
                  style={inputStyle}
                  onFocus={onFocus}
                  onBlur={onBlur}
                />
                <div className="relative">
                  <span
                    className="absolute left-4 top-1/2 -translate-y-1/2 type-body"
                    style={{ color: "var(--text-tertiary)", pointerEvents: "none" }}
                  >
                    $
                  </span>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={cost}
                    onChange={(e) => setCost(e.target.value)}
                    placeholder="2,500"
                    className="w-full pl-8 pr-4 py-3 rounded-[10px] type-body"
                    style={inputStyle}
                    onFocus={onFocus}
                    onBlur={onBlur}
                  />
                </div>
              </div>

              {/* Priority */}
              <div className="flex items-center gap-3">
                <span className="type-small" style={{ color: "var(--text-secondary)", whiteSpace: "nowrap" }}>Priority</span>
                <div className="flex gap-2">
                  {[1, 2, 3].map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPriority(p)}
                      className="type-small px-3 py-1.5 rounded-full transition-all duration-150"
                      style={{
                        fontWeight: 500,
                        background: priority === p
                          ? p === 1 ? "rgba(255,59,48,0.12)" : p === 2 ? "rgba(255,149,0,0.12)" : "rgba(0,122,255,0.12)"
                          : "var(--bg-card-hover)",
                        color: priority === p
                          ? p === 1 ? "#FF3B30" : p === 2 ? "#FF9500" : "#007AFF"
                          : "var(--text-tertiary)",
                        border: priority === p
                          ? p === 1 ? "1px solid rgba(255,59,48,0.25)" : p === 2 ? "1px solid rgba(255,149,0,0.25)" : "1px solid rgba(0,122,255,0.25)"
                          : "1px solid transparent",
                        cursor: "pointer",
                      }}
                    >
                      P{p}
                    </button>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Notes (optional)"
                rows={2}
                className="w-full px-4 py-3 rounded-[10px] type-body resize-none"
                style={{ ...inputStyle }}
                onFocus={onFocus}
                onBlur={onBlur}
              />

              {/* Form error */}
              <AnimatePresence>
                {formError && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="flex items-start gap-2 px-3 py-2.5 rounded-[8px]"
                    style={{ background: "rgba(255,59,48,0.08)", border: "1px solid rgba(255,59,48,0.18)" }}
                  >
                    <AlertCircle size={13} style={{ color: "var(--accent-overdue)", flexShrink: 0, marginTop: 1 }} />
                    <p className="type-small" style={{ color: "var(--accent-overdue)" }}>{formError}</p>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex gap-2 justify-end">
                <button type="button" onClick={() => { setShowForm(false); setFormError(null); }} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" disabled={adding || !title.trim() || !cost} className="btn-primary">
                  {adding ? "Saving…" : "Add to wishlist"}
                </button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>

        {/* AI Advice panel */}
        <AnimatePresence>
          {adviceOpen && (
            <motion.div
              className="card overflow-hidden"
              style={{ padding: 0 }}
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={spring}
            >
              {/* Panel header */}
              <div
                className="flex items-center justify-between px-5 py-4 cursor-pointer"
                style={{ borderBottom: "1px solid var(--border-subtle)" }}
                onClick={() => !adviceLoading && setAdviceOpen((s) => !s)}
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className="flex items-center justify-center rounded-[8px]"
                    style={{ width: 30, height: 30, background: "rgba(0,122,255,0.10)" }}
                  >
                    <Sparkles size={14} style={{ color: "var(--accent)" }} />
                  </div>
                  <div>
                    <p className="type-body" style={{ fontWeight: 600 }}>AI Savings Advisor</p>
                    {advice && (
                      <p className="type-small" style={{ color: "var(--text-tertiary)" }}>
                        ${advice.monthly_savings.toFixed(0)}/mo saved · {advice.recurring_bills.length} recurring bills found
                      </p>
                    )}
                  </div>
                </div>
                {!adviceLoading && (
                  <ChevronDown
                    size={16}
                    style={{ color: "var(--text-tertiary)", transition: "transform 200ms", transform: adviceOpen ? "rotate(0deg)" : "rotate(-90deg)" }}
                  />
                )}
              </div>

              {/* Loading state */}
              {adviceLoading && (
                <div className="px-5 py-8 flex flex-col items-center gap-3">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
                  >
                    <Sparkles size={22} style={{ color: "var(--accent)" }} />
                  </motion.div>
                  <p className="type-small" style={{ color: "var(--text-secondary)" }}>
                    Analysing your finances…
                  </p>
                </div>
              )}

              {/* Error state */}
              {adviceError && !adviceLoading && (
                <div className="px-5 py-5 flex items-start gap-3">
                  <AlertCircle size={15} style={{ color: "var(--accent-overdue)", flexShrink: 0, marginTop: 1 }} />
                  <div>
                    <p className="type-body" style={{ color: "var(--accent-overdue)", fontWeight: 500 }}>Could not load advice</p>
                    <p className="type-small mt-0.5">{adviceError}</p>
                    <button className="btn-secondary mt-3" style={{ fontSize: 12, height: 30 }} onClick={handleGetAdvice}>
                      Try again
                    </button>
                  </div>
                </div>
              )}

              {/* Advice content */}
              {advice && !adviceLoading && (
                <div className="flex flex-col">
                  {/* Summary */}
                  <div className="px-5 py-4" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                    <p className="type-body" style={{ color: "var(--text-secondary)", lineHeight: 1.6 }}>
                      {advice.summary}
                    </p>
                  </div>

                  {/* Stats row */}
                  <div
                    className="grid grid-cols-3 divide-x"
                    style={{
                      borderBottom: "1px solid var(--border-subtle)",
                      // @ts-expect-error CSS variable
                      "--tw-divide-opacity": 1,
                      borderColor: "var(--border-subtle)",
                    }}
                  >
                    {[
                      { label: "Monthly income", value: `$${advice.monthly_income.toFixed(0)}`, icon: DollarSign, color: "var(--accent-success)" },
                      { label: "Monthly expenses", value: `$${advice.monthly_expenses.toFixed(0)}`, icon: TrendingUp, color: "var(--accent-overdue)" },
                      { label: "Monthly savings", value: `$${advice.monthly_savings.toFixed(0)}`, icon: Clock, color: "var(--accent)" },
                    ].map(({ label, value, icon: Icon, color }) => (
                      <div key={label} className="px-5 py-4 flex flex-col gap-1">
                        <div className="flex items-center gap-1.5">
                          <Icon size={12} style={{ color }} />
                          <span className="type-small" style={{ color: "var(--text-tertiary)" }}>{label}</span>
                        </div>
                        <span className="type-body" style={{ fontWeight: 600 }}>{value}</span>
                      </div>
                    ))}
                  </div>

                  {/* Wishlist timelines */}
                  {adviceItem && adviceItem.length > 0 && (
                    <div className="px-5 py-4 flex flex-col gap-5" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                      <p className="type-section">Savings timeline</p>
                      {adviceItem.map((w) => (
                        <div key={w.id} className="flex flex-col gap-2">
                          <div className="flex items-center justify-between gap-2">
                            <span className="type-body" style={{ fontWeight: 500 }}>{w.title}</span>
                            <span className="type-small" style={{ color: "var(--text-tertiary)" }}>
                              ${w.cost.toLocaleString()}
                            </span>
                          </div>
                          <div className="flex flex-col gap-1.5">
                            <MonthsBar months={w.months_current} label="At current rate" color="#FF9500" />
                            <MonthsBar months={w.months_optimized} label="With optimizations" color="var(--accent-success)" />
                          </div>
                          <p className="type-small" style={{ color: "var(--text-secondary)" }}>{w.message}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Recurring bills */}
                  {advice.recurring_bills.length > 0 && (
                    <div className="px-5 py-4 flex flex-col gap-3" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                      <p className="type-section">Recurring bills</p>
                      <div className="flex flex-col gap-0" style={{ border: "1px solid var(--border-card)", borderRadius: 10, overflow: "hidden" }}>
                        {advice.recurring_bills.map((bill, i) => (
                          <div
                            key={bill.name}
                            className="flex items-center justify-between px-4 py-3"
                            style={{ borderBottom: i < advice.recurring_bills.length - 1 ? "1px solid var(--border-subtle)" : "none" }}
                          >
                            <div className="flex items-center gap-2.5">
                              <span className="type-body">{bill.name}</span>
                              {bill.cancellable && (
                                <span
                                  className="type-small px-1.5 py-0.5 rounded"
                                  style={{
                                    background: "rgba(255,149,0,0.10)",
                                    color: "#FF9500",
                                    fontWeight: 500,
                                    fontSize: 10,
                                  }}
                                >
                                  optional
                                </span>
                              )}
                            </div>
                            <span className="type-small" style={{ color: "var(--text-secondary)", fontWeight: 500 }}>
                              ${bill.monthly_amount.toFixed(2)}/mo
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Top categories */}
                  {advice.top_categories.length > 0 && (
                    <div className="px-5 py-4 flex flex-col gap-3" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                      <p className="type-section">Top spending categories</p>
                      <div className="flex flex-col gap-2">
                        {advice.top_categories.map((cat) => {
                          const max = advice.top_categories[0].monthly_avg;
                          const pct = (cat.monthly_avg / max) * 100;
                          return (
                            <div key={cat.category} className="flex items-center gap-3">
                              <span className="type-small w-28 shrink-0" style={{ color: "var(--text-secondary)" }}>
                                {cat.category}
                              </span>
                              <div className="flex-1 h-1.5 rounded-full" style={{ background: "var(--bg-card-hover)" }}>
                                <motion.div
                                  className="h-1.5 rounded-full"
                                  style={{ background: "var(--accent)" }}
                                  initial={{ width: 0 }}
                                  animate={{ width: `${pct}%` }}
                                  transition={{ ...springGentle, delay: 0.1 }}
                                />
                              </div>
                              <span className="type-small w-16 text-right shrink-0" style={{ color: "var(--text-secondary)", fontWeight: 500 }}>
                                ${cat.monthly_avg.toFixed(0)}/mo
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Quick wins */}
                  {advice.quick_wins.length > 0 && (
                    <div className="px-5 py-4 flex flex-col gap-3">
                      <p className="type-section">Quick wins</p>
                      <div className="flex flex-col gap-2">
                        {advice.quick_wins.map((tip, i) => (
                          <div key={i} className="flex items-start gap-2.5">
                            <div
                              className="flex items-center justify-center shrink-0 rounded-full mt-0.5"
                              style={{ width: 18, height: 18, background: "rgba(52,199,89,0.12)" }}
                            >
                              <Zap size={10} style={{ color: "var(--accent-success)" }} />
                            </div>
                            <p className="type-small" style={{ color: "var(--text-secondary)", lineHeight: 1.55 }}>
                              {tip}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Wishlist items */}
        <motion.div variants={fadeUp} transition={spring}>
          {loadError ? (
            <div className="card px-6 py-5 flex items-start gap-3" style={{ border: "1px solid rgba(255,59,48,0.25)" }}>
              <AlertCircle size={16} style={{ color: "var(--accent-overdue)", flexShrink: 0, marginTop: 1 }} />
              <div>
                <p className="type-body" style={{ fontWeight: 500, color: "var(--accent-overdue)" }}>Could not load wishlist</p>
                <p className="type-small mt-1">{loadError}</p>
              </div>
            </div>
          ) : loading ? (
            <div className="card" style={{ padding: 0, overflow: "hidden" }}>
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="flex items-center gap-4 px-5 py-4"
                  style={{ borderBottom: i < 3 ? "1px solid var(--border-subtle)" : "none" }}
                >
                  <div className="skeleton w-10 h-10 rounded-[10px]" />
                  <div className="flex flex-col gap-1.5 flex-1">
                    <div className="skeleton h-4 rounded" style={{ width: "45%" }} />
                    <div className="skeleton h-3 rounded" style={{ width: "25%" }} />
                  </div>
                  <div className="skeleton h-5 rounded-full" style={{ width: 70 }} />
                </div>
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="card px-6 py-12 flex flex-col items-center gap-3 text-center">
              <div
                className="flex items-center justify-center rounded-2xl"
                style={{ width: 48, height: 48, background: "var(--bg-card-hover)" }}
              >
                <Emoji size={24}>🛒</Emoji>
              </div>
              <p className="type-body" style={{ fontWeight: 500 }}>Nothing on your wishlist yet</p>
              <p className="type-small" style={{ color: "var(--text-tertiary)" }}>
                Add items you&apos;re saving for and let AI show you a realistic timeline.
              </p>
              <button onClick={() => setShowForm(true)} className="btn-primary mt-1">
                <Plus size={13} />
                Add first item
              </button>
            </div>
          ) : (
            <div className="card" style={{ padding: 0, overflow: "hidden" }}>
              <AnimatePresence initial={false}>
                {items.map((item, i) => {
                  const wishlistAdviceForItem = advice?.wishlist_advice?.find((w) => w.id === item.id);
                  return (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={spring}
                      className="flex items-center gap-4 px-5 py-4"
                      style={{
                        borderBottom: i < items.length - 1 ? "1px solid var(--border-subtle)" : "none",
                      }}
                    >
                      {/* Emoji */}
                      <div
                        className="flex items-center justify-center shrink-0"
                        style={{ width: 42, height: 42, borderRadius: 11, background: "var(--bg-card-hover)" }}
                      >
                        <Emoji size={22}>{item.emoji}</Emoji>
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="type-body" style={{ fontWeight: 500 }}>{item.title}</p>
                          <PriorityBadge priority={item.priority} />
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          <p className="type-small" style={{ color: "var(--text-secondary)", fontWeight: 500 }}>
                            ${item.estimated_cost.toLocaleString()}
                          </p>
                          {wishlistAdviceForItem && (
                            <>
                              <span style={{ color: "var(--text-tertiary)" }}>·</span>
                              <p className="type-small" style={{ color: "var(--accent-success)" }}>
                                {wishlistAdviceForItem.months_optimized} mo with savings
                              </p>
                            </>
                          )}
                          {item.notes && (
                            <>
                              <span style={{ color: "var(--text-tertiary)" }}>·</span>
                              <p className="type-small" style={{ color: "var(--text-tertiary)" }}>{item.notes}</p>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Delete */}
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="btn-icon-ghost shrink-0"
                        onMouseEnter={(e) => { e.currentTarget.style.color = "var(--accent-overdue)"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.color = "var(--text-tertiary)"; }}
                        aria-label={`Delete ${item.title}`}
                      >
                        <Trash2 size={13} />
                      </button>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </motion.div>
      </motion.div>
    </main>
  );
}
