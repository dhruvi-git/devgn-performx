import { createFileRoute, Outlet, Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  LayoutDashboard, Users, BarChart3, ClipboardList, Brain, Bell, Search,
  LogOut, Settings, ChevronLeft, Building2, ShieldCheck, Kanban, Trophy,
} from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { useAuth } from "@/lib/auth-context";
import { roleLabels, signOut, type Role } from "@/lib/auth";

export const Route = createFileRoute("/app")({
  component: AppLayout,
});

const nav: { to: string; label: string; icon: typeof LayoutDashboard; roles: Role[] }[] = [
  { to: "/app/executive", label: "Executive", icon: LayoutDashboard, roles: ["super_admin"] },
  { to: "/app/hod", label: "HOD Center", icon: Users, roles: ["super_admin", "hod", "team_lead"] },
  { to: "/app/employee", label: "My Workspace", icon: ClipboardList, roles: ["super_admin", "hod", "team_lead", "employee"] },
  { to: "/app/tasks", label: "Task Board", icon: Kanban, roles: ["super_admin", "hod", "team_lead", "employee"] },
  { to: "/app/performance", label: "Performance", icon: Trophy, roles: ["super_admin", "hod", "team_lead", "employee"] },
  { to: "/app/departments", label: "Departments", icon: Building2, roles: ["super_admin", "hod"] },
  { to: "/app/analytics", label: "Analytics", icon: BarChart3, roles: ["super_admin", "hod"] },
  { to: "/app/ai", label: "AI Assistant", icon: Brain, roles: ["super_admin", "hod", "team_lead", "employee"] },
  { to: "/app/admin/users", label: "User Management", icon: ShieldCheck, roles: ["super_admin"] },
];

function AppLayout() {
  const navigate = useNavigate();
  const { status, profile, role } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    if (status === "anonymous") navigate({ to: "/login", replace: true });
  }, [status, navigate]);

  if (status !== "authenticated") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-sm text-muted-foreground animate-pulse">Authenticating…</div>
      </div>
    );
  }

  const visible = nav.filter((n) => n.roles.includes(role));
  const displayName = profile?.full_name || profile?.email || "Member";

  return (
    <div className="min-h-screen flex bg-background">
      <aside className={`${collapsed ? "w-20" : "w-64"} transition-all duration-300 border-r border-gold/15 bg-surface/60 backdrop-blur-xl flex flex-col`}>
        <div className="p-5 border-b border-gold/15 flex items-center justify-between">
          {collapsed ? <Logo size={32} withText={false} /> : <Logo size={32} />}
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {visible.map((item) => {
            const active = pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition ${
                  active
                    ? "bg-gold/10 text-gold border border-gold/30 gold-glow"
                    : "text-muted-foreground hover:bg-gold/5 hover:text-foreground border border-transparent"
                }`}
              >
                <item.icon className="size-4 shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>
        <div className="p-3 border-t border-gold/15 space-y-1">
          <button
            onClick={() => setCollapsed((c) => !c)}
            className="w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted-foreground hover:bg-gold/5 hover:text-foreground transition"
          >
            <ChevronLeft className={`size-4 transition ${collapsed ? "rotate-180" : ""}`} />
            {!collapsed && <span>Collapse</span>}
          </button>
          <button
            onClick={async () => { await signOut(); navigate({ to: "/login", replace: true }); }}
            className="w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition"
          >
            <LogOut className="size-4" />
            {!collapsed && <span>Sign out</span>}
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b border-gold/15 bg-surface/40 backdrop-blur-xl flex items-center justify-between px-6">
          <div className="flex items-center gap-3 flex-1 max-w-md">
            <Search className="size-4 text-muted-foreground" />
            <input
              placeholder="Search employees, departments, KPIs..."
              className="flex-1 bg-transparent text-sm focus:outline-none placeholder:text-muted-foreground/60"
            />
          </div>
          <div className="flex items-center gap-4">
            <button className="relative size-9 rounded-lg glass flex items-center justify-center hover:border-gold/40 transition">
              <Bell className="size-4 text-muted-foreground" />
              <span className="absolute top-2 right-2 size-1.5 rounded-full bg-gold" />
            </button>
            <button className="size-9 rounded-lg glass flex items-center justify-center hover:border-gold/40 transition">
              <Settings className="size-4 text-muted-foreground" />
            </button>
            <div className="flex items-center gap-3 pl-4 border-l border-gold/15">
              <div className="text-right hidden sm:block">
                <div className="text-sm text-foreground">{displayName}</div>
                <div className="text-xs text-gold">{roleLabels[role]}</div>
              </div>
              <div className="size-9 rounded-full bg-gradient-gold flex items-center justify-center text-primary-foreground text-sm font-medium">
                {displayName[0]?.toUpperCase()}
              </div>
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
