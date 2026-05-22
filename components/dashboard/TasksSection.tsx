export function TasksSection() {
  return (
    <section>
      <div className="flex items-center gap-3 mb-4">
        <h2 className="type-section">To Do</h2>
      </div>
      <div className="card px-6 py-8">
        <p
          className="type-body text-center"
          style={{ color: "var(--text-secondary)" }}
        >
          All clear.
        </p>
      </div>
    </section>
  );
}
