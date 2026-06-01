import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AuthShell, Field } from "@/components/auth/AuthShell";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { roleHome } from "@/lib/auth";

export const Route = createFileRoute("/signup")({
  head: () => ({ meta: [{ title: "Create account · Devgn PerformX" }] }),
  component: Signup,
});

function Signup() {
  const navigate = useNavigate();
  const { status, role } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (status === "authenticated") {
      navigate({ to: roleHome(role), replace: true });
    }
  }, [status, role, navigate]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/app`,
        data: { full_name: name },
      },
    });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    // Auto-confirm is on — onAuthStateChange will redirect.
  };

  return (
    <AuthShell
      title="Create account"
      subtitle="The first account becomes Super Admin. Subsequent users start as Employee until promoted."
      footer={<>Already have access? <Link to="/login" className="text-gold hover:underline">Sign in</Link></>}
    >
      <form onSubmit={onSubmit} className="space-y-5">
        <Field label="Full name" value={name} onChange={setName} placeholder="Arjun Kapoor" required />
        <Field label="Work email" type="email" value={email} onChange={setEmail} placeholder="you@devgncinex.com" required />
        <Field label="Password" type="password" value={password} onChange={setPassword} placeholder="At least 8 characters" required />

        {error && (
          <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-gradient-gold px-4 py-3 text-sm font-medium text-primary-foreground gold-glow disabled:opacity-60"
        >
          {loading ? "Creating account…" : "Create account"}
        </button>
      </form>
    </AuthShell>
  );
}
