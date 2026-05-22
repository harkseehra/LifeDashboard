// UI shell for the purchases section — data wired in v2
const MOCK_PURCHASES = [
  { id: "1", name: "Amazon", category: "Shopping", amount: 47.2, date: "May 20" },
  { id: "2", name: "Spotify", category: "Subscriptions", amount: 9.99, date: "May 18" },
  { id: "3", name: "Shell Gas Station", category: "Transport", amount: 62.4, date: "May 17" },
];

export function PurchasesStub() {
  return (
    <section>
      <div className="flex items-center gap-2.5 mb-4">
        <h2 className="type-section" style={{ color: "var(--text-tertiary)" }}>
          Recent Purchases
        </h2>
        <span
          className="type-caption px-2 py-0.5 rounded-full"
          style={{
            background: "var(--bg-card-hover)",
            color: "var(--text-tertiary)",
          }}
        >
          v2
        </span>
      </div>

      <div
        className="card"
        style={{ padding: 0, overflow: "hidden", position: "relative" }}
      >
        {/* Blurred mock rows — shows what the design will look like */}
        <div style={{ filter: "blur(3px)", opacity: 0.35, pointerEvents: "none", userSelect: "none" }}>
          {MOCK_PURCHASES.map((p, i) => (
            <div
              key={p.id}
              className="flex items-center gap-3 px-5 py-3.5"
              style={{
                borderBottom:
                  i < MOCK_PURCHASES.length - 1
                    ? "1px solid var(--border-subtle)"
                    : "none",
              }}
            >
              {/* Icon placeholder */}
              <div
                className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center"
                style={{ background: "var(--bg-card-hover)" }}
              />
              <div className="flex-1 min-w-0">
                <div className="type-body">{p.name}</div>
                <div className="type-small">{p.category}</div>
              </div>
              <div className="flex flex-col items-end gap-0.5 shrink-0">
                <span className="type-body">−${p.amount.toFixed(2)}</span>
                <span className="type-caption">{p.date}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Overlay with call to action */}
        <div
          className="absolute inset-0 flex flex-col items-center justify-center gap-2"
        >
          <p className="type-small" style={{ color: "var(--text-tertiary)" }}>
            Purchases sync coming in v2.
          </p>
        </div>
      </div>
    </section>
  );
}
