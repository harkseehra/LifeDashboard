"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase";
import { Button } from "@/components/ui/Button";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: `${location.origin}/auth/callback` },
    });

    if (authError) {
      setError("Couldn't send the link. Check the email and try again.");
    } else {
      setSent(true);
    }
    setLoading(false);
  };

  return (
    <main
      className="min-h-screen flex items-center justify-center px-6"
      style={{ background: "var(--bg-base)" }}
    >
      <div className="w-full max-w-sm">
        <div className="card px-8 py-10 flex flex-col gap-6">
          {sent ? (
            <div className="flex flex-col gap-3 text-center">
              <p className="type-title">Check your email.</p>
              <p className="type-body" style={{ color: "var(--text-secondary)" }}>
                A sign-in link is on its way to <strong>{email}</strong>.
              </p>
            </div>
          ) : (
            <>
              <div className="flex flex-col gap-1">
                <h1 className="type-title">Life Dashboard</h1>
                <p className="type-small">Enter your email to sign in.</p>
              </div>

              <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="w-full px-4 py-3 rounded-card type-body"
                  style={{
                    background: "var(--bg-base)",
                    border: "1px solid var(--border-card)",
                    color: "var(--text-primary)",
                    outline: "none",
                  }}
                  onFocus={(e) => {
                    e.target.style.border = "1px solid var(--accent)";
                    e.target.style.boxShadow = "0 0 0 3px rgba(0, 122, 255, 0.12)";
                  }}
                  onBlur={(e) => {
                    e.target.style.border = "1px solid var(--border-card)";
                    e.target.style.boxShadow = "none";
                  }}
                />

                {error && (
                  <p className="type-small" style={{ color: "var(--accent-warning)" }}>
                    {error}
                  </p>
                )}

                <Button type="submit" disabled={loading} style={{ width: "100%" }}>
                  {loading ? "Sending…" : "Send sign-in link"}
                </Button>
              </form>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
