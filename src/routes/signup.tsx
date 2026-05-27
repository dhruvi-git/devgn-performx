import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { AuthShell, Field } from "@/components/auth/AuthShell";
import { setSession, roleHome, type Role } from "@/lib/auth";

export const Route = createFileRoute("/signup")({
  head: () => ({ meta: [{ title: "Request access · Devgn PerformX" }] }),
  component: Signup,
});

function Signup() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("employee");

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSession({ name: name || "New User", email, role });
    navigate({ to: roleHome(role) });
  };

  return (
    <AuthShell
      title="Request access"
      subtitle="Create your PerformX identity."
      footer={<>Already have access? <Link to="/login" className="text-gold hover:underline">Sign in</Link></>}
    >
      <form onSubmit={onSubmit} className="space-y-5">
        <Field label="Full name" value={name} onChange={setName} placeholder="Arjun Kapoor" required />
        <Field label="Work email" type="email" value={email} onChange={setEmail} placeholder="you@devgncinex.com" required />
        <Field label="Password" type="password" value={password} onChange={setPassword} placeholder="At least 8 characters" required />

        <div>
          <span className="text-xs uppercase tracking-widest text-muted-foreground">Role</span>
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

        <button
          type="submit"
          className="w-full rounded-lg bg-gradient-gold px-4 py-3 text-sm font-medium text-primary-foreground gold-glow"
        >
          Create account
        </button>
      </form>
    </AuthShell>
  );
}
