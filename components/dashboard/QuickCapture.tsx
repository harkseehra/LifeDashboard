"use client";

import { useState, useRef } from "react";
import { Plus } from "lucide-react";

const PLACEHOLDERS = [
  "Add a task…",
  "Add a task… try /goal or /appt",
  "Add a task… try /appt dentist friday 3pm",
];

export function QuickCapture() {
  const [value, setValue] = useState("");
  const [placeholderIdx, setPlaceholderIdx] = useState(0);
  const [focused, setFocused] = useState(false);
  const cycled = useRef(false);

  const handleFocus = () => {
    setFocused(true);
    if (!cycled.current) {
      cycled.current = true;
      setPlaceholderIdx((i) => (i + 1) % PLACEHOLDERS.length);
    }
  };

  const handleBlur = () => {
    setFocused(false);
    cycled.current = false;
    setPlaceholderIdx((i) => (i + 1) % PLACEHOLDERS.length);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!value.trim()) return;
    // Phase 2+ wires up actual submission
    setValue("");
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="relative flex items-center">
        <Plus
          size={17}
          className="absolute left-4 pointer-events-none"
          style={{ color: "var(--text-tertiary)" }}
        />
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={PLACEHOLDERS[placeholderIdx]}
          className="w-full pl-10 pr-4 py-3 rounded-card type-body transition-all duration-150"
          style={{
            background: "var(--bg-card)",
            border: `1px solid ${focused ? "var(--accent)" : "var(--border-card)"}`,
            boxShadow: focused
              ? "0 0 0 3px rgba(0, 122, 255, 0.12), var(--shadow-card)"
              : "var(--shadow-card)",
            color: "var(--text-primary)",
            outline: "none",
          }}
        />
      </div>
    </form>
  );
}
