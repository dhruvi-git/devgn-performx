import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { AuthShell, Field } from "@/components/auth/AuthShell";
import { setSession, roleHome, type Role } from "@/lib/auth";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Sign in · Devgn PerformX" }] }),
  component: Login,
});

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("super_admin");

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const name = email.split("@")[0] || "Leader";
    setSession({ name: name.charAt(0).toUpperCase() + name.slice(1), email, role });
    navigate({ to: roleHome(role) });
  };

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to your PerformX command center."
      footer={<>New here? <Link to="/signup" className="text-gold hover:underline">Request access</Link></>}
    >
      <form onSubmit={onSubmit} className="space-y-5">
        <Field label="Email" type="email" value={email} onChange={setEmail} placeholder="you@devgncinex.com" required />
        <Field label="Password" type="password" value={password} onChange={setPassword} placeholder="••••••••" required />

        <div>
          <span className="text-xs uppercase tracking-widest text-muted-foreground">Sign in as</span>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {([
              ["super_admin", "Super Admin"],
              ["hod", "HOD"],
              ["team_lead", "Team Lead"],
              ["employee", "Employee"],
            ] as [Role, string][]).map(([r, label]) => (
              <button
                key={r}
                type="button"
                onClick={() => setRole(r)}
                className={`rounded-lg px-3 py-2 text-xs border transition ${
                  role === r
                    ? "border-gold/60 bg-gold/10 text-gold gold-glow"
                    : "border-gold/15 text-muted-foreground hover:border-gold/30"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between text-xs">
          <label className="flex items-center gap-2 text-muted-foreground">
            <input type="checkbox" className="accent-gold" /> Remember me
          </label>
          <Link to="/forgot-password" className="text-gold hover:underline">Forgot password?</Link>
        </div>

        <button
          type="submit"
          className="w-full rounded-lg bg-gradient-gold px-4 py-3 text-sm font-medium text-primary-foreground gold-glow hover:gold-glow-lg transition"
        >
          Enter PerformX
        </button>
      </form>
    </AuthShell>
  );
}
