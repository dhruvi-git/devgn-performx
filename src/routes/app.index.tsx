import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { roleHome } from "@/lib/auth";

export const Route = createFileRoute("/app/")({
  component: AppIndex,
});

function AppIndex() {
  const navigate = useNavigate();
  const { status, role } = useAuth();

  useEffect(() => {
    if (status === "authenticated") navigate({ to: roleHome(role), replace: true });
    else if (status === "anonymous") navigate({ to: "/login", replace: true });
  }, [status, role, navigate]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-sm text-muted-foreground animate-pulse">Routing to your workspace…</div>
    </div>
  );
}
