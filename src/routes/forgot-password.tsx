import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { AuthShell, Field } from "@/components/auth/AuthShell";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({ meta: [{ title: "Reset password · Devgn PerformX" }] }),
  component: Forgot,
});

function Forgot() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  return (
    <AuthShell
      title="Reset password"
      subtitle="We'll send a secure reset link to your work email."
      footer={<><Link to="/login" className="text-gold hover:underline">Back to sign in</Link></>}
    >
      {sent ? (
        <div className="text-sm text-foreground/90">
          <div className="rounded-lg border border-gold/30 bg-gold/5 px-4 py-3">
            If <span className="text-gold">{email}</span> exists, a reset link is on its way.
          </div>
        </div>
      ) : (
        <form
          onSubmit={(e) => { e.preventDefault(); setSent(true); }}
          className="space-y-5"
        >
          <Field label="Work email" type="email" value={email} onChange={setEmail} placeholder="you@devgncinex.com" required />
          <button
            type="submit"
            className="w-full rounded-lg bg-gradient-gold px-4 py-3 text-sm font-medium text-primary-foreground gold-glow"
          >
            Send reset link
          </button>
        </form>
      )}
    </AuthShell>
  );
}
