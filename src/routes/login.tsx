import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AuthShell, Field } from "@/components/auth/AuthShell";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { roleHome } from "@/lib/auth";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Sign in · Devgn PerformX" }] }),
  component: Login,
});

function Login() {
  const navigate = useNavigate();
  const { status, role } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Redirect after auth state hydrates
  useEffect(() => {
    if (status === "authenticated") {
      navigate({ to: roleHome(role), replace: true });
    }
  }, [status, role, navigate]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    // onAuthStateChange will trigger the effect above
  };

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to your PerformX command center."
      footer={
        <>
          First-time setup? <Link to="/signup" className="text-gold hover:underline">Create the founding admin account</Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-5">
        <Field label="Email" type="email" value={email} onChange={setEmail} placeholder="you@devgncinex.com" required />
        <Field label="Password" type="password" value={password} onChange={setPassword} placeholder="••••••••" required />

        {error && (
          <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
            {error}
          </div>
        )}

        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Roles are assigned by your administrator.</span>
          <Link to="/forgot-password" className="text-gold hover:underline">Forgot password?</Link>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-gradient-gold px-4 py-3 text-sm font-medium text-primary-foreground gold-glow hover:gold-glow-lg transition disabled:opacity-60"
        >
          {loading ? "Signing in…" : "Enter PerformX"}
        </button>
      </form>
    </AuthShell>
  );
}
