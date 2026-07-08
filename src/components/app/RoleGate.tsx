import { ShieldAlert, ArrowLeft } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-context";
import { roleLabels, type Role } from "@/lib/auth";
import type { ReactNode } from "react";

type Props = {
  allow: Role[];
  children: ReactNode;
  /** Optional label shown on the denial screen, e.g. "Executive Dashboard". */
  area?: string;
};

/**
 * Client-side role gate. RLS is the source of truth on the server — this
 * component only prevents unauthorized users from *seeing* a section's shell
 * and provides a graceful, branded denial page.
 */
export function RoleGate({ allow, children, area }: Props) {
  const { status, role } = useAuth();

  if (status === "loading") {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-sm text-muted-foreground animate-pulse">Checking permissions…</div>
      </div>
    );
  }

  if (!allow.includes(role)) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-8">
        <div className="glass rounded-2xl p-8 max-w-md text-center gold-glow">
          <div className="size-14 rounded-xl bg-destructive/10 border border-destructive/30 flex items-center justify-center mx-auto mb-4">
            <ShieldAlert className="size-7 text-destructive" />
          </div>
          <h2 className="font-display text-xl text-foreground mb-1">Access restricted</h2>
          <p className="text-sm text-muted-foreground mb-4">
            {area ? `The ${area} area is` : "This area is"} limited to{" "}
            <span className="text-gold">{allow.map((r) => roleLabels[r]).join(" · ")}</span>.
            Your current role is <span className="text-foreground">{roleLabels[role]}</span>.
          </p>
          <Link
            to="/app"
            className="inline-flex items-center gap-2 rounded-lg bg-gradient-gold px-4 py-2 text-sm font-medium text-primary-foreground gold-glow"
          >
            <ArrowLeft className="size-4" /> Back to my workspace
          </Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
