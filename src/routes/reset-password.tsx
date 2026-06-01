import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { AuthShell, Field } from "@/components/auth/AuthShell";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/reset-password")({
  head: () => ({ meta: [{ title: "Set new password · Devgn PerformX" }] }),
  component: ResetPassword,
});

function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < 8) { setError("Password must be at least 8 characters."); return; }
    if (password !== confirm) { setError("Passwords do not match."); return; }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) { setError(error.message); return; }
    navigate({ to: "/app", replace: true });
  };

  return (
    <AuthShell
      title="Set new password"
      subtitle="Choose a strong password to secure your account."
      footer={<><Link to="/login" className="text-gold hover:underline">Back to sign in</Link></>}
    >
      <form onSubmit={onSubmit} className="space-y-5">
        <Field label="New password" type="password" value={password} onChange={setPassword} placeholder="At least 8 characters" required />
        <Field label="Confirm password" type="password" value={confirm} onChange={setConfirm} placeholder="Re-enter password" required />
        {error && (
          <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">{error}</div>
        )}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-gradient-gold px-4 py-3 text-sm font-medium text-primary-foreground gold-glow disabled:opacity-60"
        >
          {loading ? "Updating…" : "Update password"}
        </button>
      </form>
    </AuthShell>
  );
}
