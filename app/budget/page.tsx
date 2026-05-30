"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { Trash2, Send, Plus, Sparkles } from "lucide-react";
import { fadeUp, staggerParent, spring, micro } from "@/lib/animations";
import { Emoji } from "@/components/ui/Emoji";

// ── Types ──────────────────────────────────────────────────────────────────

interface BudgetItem {
  id: string;
  name: string;
  amount: number;
  type: "recurring" | "one_time";
  created_at: string;
}

interface BudgetAction {
  type: "upserted" | "removed";
  item: { id?: string; name: string; amount?: number; itemType?: string };
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  actions?: BudgetAction[];
  loading?: boolean;
}

const CHAT_KEY = "ld_financial_chat";
const STARTER_PROMPTS = [
  "My budget is rent $700, food $400, phone $80",
  "I have a lawyer bill for $1000 and car license renewal $500",
  "Should I pay off my debt or save more right now?",
  "How much can I realistically save this month?",
];

// ── Budget Overview Panel ──────────────────────────────────────────────────

function BudgetPanel({
  items,
  bankBalance,
  onDelete,
  loading,
}: {
  items: BudgetItem[];
  bankBalance: number | null;
  onDelete: (id: string) => void;
  loading: boolean;
}) {
  const recurring = items.filter((i) => i.type === "recurring");
  const oneTime = items.filter((i) => i.type === "one_time");
  const recurringTotal = recurring.reduce((s, i) => s + i.amount, 0);
  const oneTimeTotal = oneTime.reduce((s, i) => s + i.amount, 0);
  const expectedOutflow = recurringTotal + oneTimeTotal;
  const netPosition = bankBalance !== null ? bankBalance - expectedOutflow : null;
  const isShortfall = netPosition !== null && netPosition < 0;

  const Row = ({ item }: { item: BudgetItem }) => (
    <div className="flex items-center gap-3 group py-2.5" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
      <span className="type-body flex-1 truncate">{item.name}</span>
      <span
        className="type-body shrink-0"
        style={{ fontVariantNumeric: "tabular-nums", fontWeight: 500 }}
      >
        ${item.amount.toFixed(2)}
      </span>
      <button
        onClick={() => onDelete(item.id)}
        className="btn-icon-ghost opacity-0 group-hover:opacity-100 transition-opacity"
        style={{ color: "var(--text-tertiary)" }}
        onMouseEnter={(e) => { e.currentTarget.style.color = "var(--accent-overdue)"; }}
        onMouseLeave={(e) => { e.currentTarget.style.color = "var(--text-tertiary)"; }}
        aria-label={`Remove ${item.name}`}
      >
        <Trash2 size={12} />
      </button>
    </div>
  );

  const SectionTotal = ({ label, amount }: { label: string; amount: number }) => (
    <div className="flex items-center justify-between pt-2 pb-1">
      <span className="type-caption">{label}</span>
      <span className="type-small" style={{ fontVariantNumeric: "tabular-nums", fontWeight: 600 }}>
        ${amount.toFixed(2)}
      </span>
    </div>
  );

  if (loading) {
    return (
      <div className="card px-5 py-5 flex flex-col gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="skeleton h-5 rounded" style={{ width: `${50 + i * 12}%` }} />
        ))}
      </div>
    );
  }

  return (
    <div className="card px-5 py-5 flex flex-col gap-0">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <Emoji size={18}>💰</Emoji>
        <span className="type-section">Budget Overview</span>
      </div>

      {/* Bank balance */}
      {bankBalance !== null && (
        <div
          className="flex items-center justify-between px-4 py-3 rounded-[10px] mb-4"
          style={{ background: "var(--bg-card-hover)", border: "1px solid var(--border-subtle)" }}
        >
          <div className="flex items-center gap-2">
            <Emoji size={15}>🏦</Emoji>
            <span className="type-small" style={{ fontWeight: 500, color: "var(--text-secondary)" }}>
              Bank Balance
            </span>
          </div>
          <span
            className="type-body"
            style={{ fontWeight: 700, fontVariantNumeric: "tabular-nums", color: "var(--text-primary)" }}
          >
            ${bankBalance.toFixed(2)}
          </span>
        </div>
      )}

      {/* Monthly recurring */}
      <div className="mb-1">
        <p className="type-caption mb-1" style={{ letterSpacing: "0.06em" }}>Monthly</p>
        {recurring.length === 0 ? (
          <p className="type-small py-2" style={{ color: "var(--text-tertiary)" }}>
            Tell the AI your monthly budget to add items
          </p>
        ) : (
          recurring.map((item) => <Row key={item.id} item={item} />)
        )}
        {recurring.length > 0 && <SectionTotal label="Monthly total" amount={recurringTotal} />}
      </div>

      {/* One-time expenses */}
      {(oneTime.length > 0 || items.length > 0) && (
        <div className="mt-3 pt-3" style={{ borderTop: "1px solid var(--border-card)" }}>
          <p className="type-caption mb-1" style={{ letterSpacing: "0.06em" }}>One-time expenses</p>
          {oneTime.length === 0 ? (
            <p className="type-small py-2" style={{ color: "var(--text-tertiary)" }}>
              None added yet
            </p>
          ) : (
            oneTime.map((item) => <Row key={item.id} item={item} />)
          )}
          {oneTime.length > 0 && <SectionTotal label="One-time total" amount={oneTimeTotal} />}
        </div>
      )}

      {/* Net position */}
      {items.length > 0 && (
        <div
          className="mt-4 rounded-[10px] px-4 py-3 flex items-center justify-between"
          style={{
            background: isShortfall ? "rgba(255,59,48,0.08)" : "rgba(52,199,89,0.08)",
            border: `1px solid ${isShortfall ? "rgba(255,59,48,0.2)" : "rgba(52,199,89,0.2)"}`,
          }}
        >
          <div>
            <p className="type-caption" style={{ color: isShortfall ? "var(--accent-overdue)" : "var(--accent-success)", letterSpacing: "0.06em" }}>
              {isShortfall ? "Shortfall" : "Buffer"}
            </p>
            <p className="type-small" style={{ color: "var(--text-tertiary)", marginTop: 1 }}>
              Balance − expected outflow
            </p>
          </div>
          <span
            style={{
              fontSize: 22,
              fontWeight: 700,
              fontVariantNumeric: "tabular-nums",
              fontFamily: "inherit",
              color: isShortfall ? "var(--accent-overdue)" : "var(--accent-success)",
              letterSpacing: "-0.02em",
            }}
          >
            {isShortfall ? "−" : "+"}${Math.abs(netPosition!).toFixed(0)}
          </span>
        </div>
      )}

      {items.length === 0 && (
        <div className="py-6 text-center">
          <Emoji size={28}>💬</Emoji>
          <p className="type-small mt-2" style={{ color: "var(--text-tertiary)" }}>
            Chat with the AI adviser to set up your budget
          </p>
        </div>
      )}
    </div>
  );
}

// ── Chat bubble ────────────────────────────────────────────────────────────

function Bubble({ msg }: { msg: ChatMessage }) {
  const isUser = msg.role === "user";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={spring}
      className={`flex flex-col gap-1.5 ${isUser ? "items-end" : "items-start"}`}
    >
      <div
        className="px-4 py-3 rounded-[14px] max-w-[85%]"
        style={{
          background: isUser ? "var(--accent)" : "var(--bg-card)",
          border: isUser ? "none" : "1px solid var(--border-card)",
          boxShadow: isUser ? "none" : "var(--shadow-card)",
          color: isUser ? "#fff" : "var(--text-primary)",
        }}
      >
        {msg.loading ? (
          <div className="flex items-center gap-1.5 py-0.5">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--text-tertiary)" }}
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
              />
            ))}
          </div>
        ) : (
          <p className="type-body" style={{ color: isUser ? "#fff" : "var(--text-primary)", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
            {msg.content}
          </p>
        )}
      </div>

      {/* Action chips — items the AI added/removed */}
      {msg.actions && msg.actions.length > 0 && (
        <div className="flex flex-wrap gap-1.5 max-w-[85%]">
          {msg.actions.map((action, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ ...spring, delay: i * 0.05 }}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full"
              style={{
                background: action.type === "upserted" ? "rgba(52,199,89,0.1)" : "rgba(255,59,48,0.1)",
                border: `1px solid ${action.type === "upserted" ? "rgba(52,199,89,0.25)" : "rgba(255,59,48,0.25)"}`,
              }}
            >
              <span style={{ fontSize: 10 }}>{action.type === "upserted" ? "✓" : "✕"}</span>
              <span className="type-caption" style={{ color: action.type === "upserted" ? "var(--accent-success)" : "var(--accent-overdue)", letterSpacing: 0, textTransform: "none", fontWeight: 500, fontSize: 11 }}>
                {action.type === "upserted" ? "Added" : "Removed"} {action.item.name}
                {action.item.amount ? ` · $${action.item.amount.toFixed(0)}` : ""}
              </span>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────

export default function BudgetPage() {
  const [items, setItems] = useState<BudgetItem[]>([]);
  const [bankBalance, setBankBalance] = useState<number | null>(null);
  const [loadingItems, setLoadingItems] = useState(true);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const loadBudget = useCallback(async () => {
    const [budgetRes, acctRes] = await Promise.all([
      fetch("/api/budget"),
      fetch("/api/plaid/accounts"),
    ]);
    const budgetJson = await budgetRes.json();
    const acctJson = await acctRes.json();

    setItems(budgetJson.items ?? []);

    if (!acctJson.error && acctJson.accounts) {
      const balance = (acctJson.accounts as { type: string; balance_current: number }[])
        .filter((a) => a.type === "depository")
        .reduce((s, a) => s + a.balance_current, 0);
      setBankBalance(balance > 0 ? balance : null);
    }

    setLoadingItems(false);
  }, []);

  useEffect(() => {
    loadBudget();
    // Load chat history from localStorage
    try {
      const saved = JSON.parse(localStorage.getItem(CHAT_KEY) ?? "[]") as ChatMessage[];
      setMessages(saved);
    } catch { /* ignore */ }
  }, [loadBudget]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const saveHistory = (msgs: ChatMessage[]) => {
    try {
      // Keep last 40 messages
      const toSave = msgs.filter((m) => !m.loading).slice(-40);
      localStorage.setItem(CHAT_KEY, JSON.stringify(toSave));
    } catch { /* ignore */ }
  };

  const handleDelete = async (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
    await fetch(`/api/budget/${id}`, { method: "DELETE" });
  };

  const sendMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || sending) return;

    const userMsg: ChatMessage = { id: Date.now().toString(), role: "user", content: trimmed };
    const loadingMsg: ChatMessage = { id: `loading-${Date.now()}`, role: "assistant", content: "", loading: true };

    const newMessages = [...messages, userMsg, loadingMsg];
    setMessages(newMessages);
    setInput("");
    setSending(true);
    inputRef.current?.focus();

    try {
      const res = await fetch("/api/ai/financial-adviser", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: messages.filter((m) => !m.loading).map((m) => ({ role: m.role, content: m.content })),
          newMessage: trimmed,
        }),
      });

      const json = await res.json() as { reply: string; actions: BudgetAction[]; error?: string };

      const assistantMsg: ChatMessage = {
        id: Date.now().toString(),
        role: "assistant",
        content: json.error ? `Sorry, something went wrong: ${json.error}` : json.reply,
        actions: json.actions ?? [],
      };

      const finalMessages = [...messages, userMsg, assistantMsg];
      setMessages(finalMessages);
      saveHistory(finalMessages);

      // If AI added/removed items, reload budget
      if (json.actions?.length > 0) {
        await loadBudget();
      }
    } catch {
      const errMsg: ChatMessage = {
        id: Date.now().toString(),
        role: "assistant",
        content: "Couldn't reach the adviser — check your connection.",
      };
      const finalMessages = [...messages, userMsg, errMsg];
      setMessages(finalMessages);
      saveHistory(finalMessages);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  return (
    <main className="min-h-screen" style={{ background: "var(--bg-base)" }}>
      <motion.div
        style={{ padding: "var(--page-top) var(--page-gutter) 60px" }}
        variants={staggerParent}
        initial="hidden"
        animate="visible"
        className="flex flex-col gap-6 h-[calc(100vh-0px)]"
      >
        {/* Back */}
        <motion.div variants={fadeUp} transition={spring}>
          <Link href="/" className="type-small" style={{ color: "var(--accent)" }}>
            ← Dashboard
          </Link>
        </motion.div>

        {/* Header */}
        <motion.div variants={fadeUp} transition={spring} className="flex items-end justify-between">
          <div>
            <h1 className="type-display">Financial Adviser</h1>
            <p className="type-small mt-1" style={{ color: "var(--text-tertiary)" }}>
              Tell the AI your budget and it updates the overview instantly
            </p>
          </div>
          <button
            onClick={() => {
              setMessages([]);
              localStorage.removeItem(CHAT_KEY);
            }}
            className="type-small"
            style={{ color: "var(--text-tertiary)", background: "none", border: "none", cursor: "pointer" }}
          >
            Clear chat
          </button>
        </motion.div>

        {/* Two-panel layout */}
        <motion.div
          variants={fadeUp}
          transition={spring}
          className="flex flex-col lg:flex-row gap-5 flex-1 min-h-0"
          style={{ minHeight: 500 }}
        >
          {/* Left: Budget widget */}
          <div className="lg:w-[340px] shrink-0">
            <BudgetPanel
              items={items}
              bankBalance={bankBalance}
              onDelete={handleDelete}
              loading={loadingItems}
            />
          </div>

          {/* Right: AI Chat */}
          <div className="flex-1 flex flex-col card overflow-hidden" style={{ minHeight: 500, padding: 0 }}>
            {/* Chat header */}
            <div
              className="flex items-center gap-2 px-5 py-4 shrink-0"
              style={{ borderBottom: "1px solid var(--border-subtle)" }}
            >
              <Sparkles size={14} style={{ color: "var(--accent)" }} />
              <span className="type-section">AI Financial Adviser</span>
              <span className="type-small ml-1" style={{ color: "var(--text-tertiary)" }}>
                · powered by Claude
              </span>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-5 py-5 flex flex-col gap-4 min-h-0">
              <AnimatePresence initial={false}>
                {messages.length === 0 ? (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={micro}
                    className="flex flex-col gap-4 h-full justify-center"
                  >
                    <div className="text-center">
                      <Emoji size={36}>💬</Emoji>
                      <p className="type-body mt-3" style={{ fontWeight: 500 }}>
                        Your AI financial adviser
                      </p>
                      <p className="type-small mt-1" style={{ color: "var(--text-tertiary)" }}>
                        Tell it your budget and it will track everything for you.
                      </p>
                    </div>

                    <div className="flex flex-col gap-2 mt-2">
                      {STARTER_PROMPTS.map((p) => (
                        <button
                          key={p}
                          onClick={() => sendMessage(p)}
                          className="text-left px-4 py-3 rounded-[10px] type-small transition-colors duration-100"
                          style={{
                            background: "var(--bg-card-hover)",
                            border: "1px solid var(--border-card)",
                            color: "var(--text-secondary)",
                            cursor: "pointer",
                            fontFamily: "inherit",
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = "var(--border-subtle)"; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = "var(--bg-card-hover)"; }}
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                ) : (
                  messages.map((msg) => <Bubble key={msg.id} msg={msg} />)
                )}
              </AnimatePresence>
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div
              className="shrink-0 px-4 py-3"
              style={{ borderTop: "1px solid var(--border-subtle)" }}
            >
              <div
                className="flex items-end gap-2 rounded-[12px] px-4 py-2.5"
                style={{
                  background: "var(--bg-card-hover)",
                  border: "1px solid var(--border-card)",
                  transition: "border-color 150ms",
                }}
                onFocusCapture={(e) => {
                  (e.currentTarget as HTMLDivElement).style.borderColor = "var(--accent)";
                  (e.currentTarget as HTMLDivElement).style.boxShadow = "0 0 0 3px rgba(0,122,255,0.1)";
                }}
                onBlurCapture={(e) => {
                  (e.currentTarget as HTMLDivElement).style.borderColor = "var(--border-card)";
                  (e.currentTarget as HTMLDivElement).style.boxShadow = "none";
                }}
              >
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Tell me your budget, ask for advice…"
                  rows={1}
                  disabled={sending}
                  className="flex-1 type-body bg-transparent outline-none resize-none"
                  style={{
                    border: "none",
                    color: "var(--text-primary)",
                    fontFamily: "inherit",
                    lineHeight: 1.5,
                    maxHeight: 120,
                    overflow: "auto",
                    opacity: sending ? 0.5 : 1,
                  }}
                />
                <button
                  onClick={() => sendMessage(input)}
                  disabled={!input.trim() || sending}
                  className="btn-primary shrink-0"
                  style={{ height: 32, padding: "0 12px", borderRadius: 8 }}
                >
                  {sending ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      style={{ width: 12, height: 12, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%" }}
                    />
                  ) : (
                    <Send size={13} />
                  )}
                </button>
              </div>
              <p className="type-caption mt-1.5 text-center" style={{ color: "var(--text-tertiary)", letterSpacing: 0, textTransform: "none", fontSize: 11 }}>
                Enter to send · Shift+Enter for new line · Changes update the widget instantly
              </p>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </main>
  );
}
