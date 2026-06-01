import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { AuthShell, Field } from "@/components/auth/AuthShell";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({ meta: [{ title: "Reset password · Devgn PerformX" }] }),
  component: ForgotPassword,
});

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) { setError(error.message); return; }
    setSent(true);
  };

  return (
    <AuthShell
      title="Reset password"
      subtitle="We'll email you a secure link to set a new password."
      footer={<>Remember it? <Link to="/login" className="text-gold hover:underline">Sign in</Link></>}
    >
      {sent ? (
        <div className="rounded-lg border border-gold/30 bg-gold/5 px-4 py-3 text-sm text-foreground">
          Reset link sent. Check your inbox.
        </div>
      ) : (
        <form onSubmit={onSubmit} className="space-y-5">
          <Field label="Email" type="email" value={email} onChange={setEmail} placeholder="you@devgncinex.com" required />
          {error && (
            <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">{error}</div>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-gradient-gold px-4 py-3 text-sm font-medium text-primary-foreground gold-glow disabled:opacity-60"
          >
            {loading ? "Sending…" : "Send reset link"}
          </button>
        </form>
      )}
    </AuthShell>
  );
}
