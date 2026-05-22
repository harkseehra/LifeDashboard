export function PurchasesStub() {
  return (
    <section>
      <div className="flex items-center gap-3 mb-4">
        <h2 className="type-section" style={{ color: "var(--text-tertiary)" }}>
          Recent Purchases
        </h2>
        <span
          className="type-caption"
          style={{
            background: "var(--bg-card-hover)",
            color: "var(--text-tertiary)",
            padding: "2px 8px",
            borderRadius: "6px",
          }}
        >
          v2
        </span>
      </div>
      <div
        className="card px-6 py-8"
        style={{
          opacity: 0.45,
          border: "1px solid var(--border-subtle)",
          boxShadow: "none",
          pointerEvents: "none",
        }}
      >
        <p
          className="type-body text-center"
          style={{ color: "var(--text-tertiary)" }}
        >
          Purchases sync coming in v2.
        </p>
      </div>
    </section>
  );
}
