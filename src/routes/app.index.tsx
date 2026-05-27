import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/app/")({
  beforeLoad: () => {
    const raw = typeof window !== "undefined" ? localStorage.getItem("devgn_performx_session") : null;
    if (!raw) throw redirect({ to: "/login" });
    try {
      const s = JSON.parse(raw);
      if (s.role === "super_admin") throw redirect({ to: "/app/executive" });
      if (s.role === "hod" || s.role === "team_lead") throw redirect({ to: "/app/hod" });
      throw redirect({ to: "/app/employee" });
    } catch (e) {
      throw e;
    }
  },
});
