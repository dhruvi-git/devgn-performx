import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Loader2, Users, Target, TrendingUp, Crown } from "lucide-react";
import {
  Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid,
} from "recharts";
import { PageHeader, KpiCard, Panel } from "@/components/app/Panels";
import { supabase } from "@/integrations/supabase/client";
import { monthlyTrend } from "@/lib/mock-data";

export const Route = createFileRoute("/app/departments/$slug")({
  head: ({ params }) => ({ meta: [{ title: `${params.slug} · Department` }] }),
  component: DepartmentDetail,
  errorComponent: ({ error }) => (
    <div className="p-8 text-sm text-destructive">Failed to load: {error.message}</div>
  ),
  notFoundComponent: () => (
    <div className="p-8 text-sm text-muted-foreground">Department not found.</div>
  ),
});

function DepartmentDetail() {
  const { slug } = Route.useParams();

  const { data, isLoading, error } = useQuery({
    queryKey: ["department", slug],
    queryFn: async () => {
      const { data: dept, error: e1 } = await supabase
        .from("departments")
        .select("id, slug, name, description, kpi_weight")
        .eq("slug", slug)
        .maybeSingle();
      if (e1) throw new Error(e1.message);
      if (!dept) throw notFound();

      const { data: employees } = await supabase
        .from("profiles")
        .select("id, full_name, email, job_title, avatar_url")
        .eq("department_id", dept.id)
        .order("full_name");

      return { dept, employees: employees ?? [] };
    },
  });

  if (isLoading) {
    return (
      <div className="p-8 flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin text-gold" /> Loading…
      </div>
    );
  }
  if (error || !data) return null;

  const { dept, employees } = data;
  const baseScore = Math.round(70 + dept.kpi_weight * 18);

  return (
    <div className="p-8">
      <Link
        to="/app/departments"
        className="inline-flex items-center gap-1.5 text-xs uppercase tracking-widest text-muted-foreground hover:text-gold transition mb-4"
      >
        <ArrowLeft className="size-3" /> All departments
      </Link>
      <PageHeader
        eyebrow={`Weight ${dept.kpi_weight.toFixed(1)}`}
        title={dept.name}
        subtitle={
          dept.description ??
          "Weighted KPI performance, headcount and live activity for this department."
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard label="KPI Score" value={String(baseScore)} delta="+3 MoM" icon={Target} accent />
        <KpiCard label="Headcount" value={String(employees.length)} icon={Users} />
        <KpiCard label="Productivity" value={`${Math.min(99, baseScore + 4)}%`} delta="+2.1%" icon={TrendingUp} />
        <KpiCard label="Top Performers" value={String(Math.max(1, Math.floor(employees.length / 4)))} icon={Crown} />
      </div>

      <div className="grid lg:grid-cols-3 gap-4 mb-6">
        <Panel title="8-month performance trend" className="lg:col-span-2">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyTrend}>
                <defs>
                  <linearGradient id="dg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--gold))" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="hsl(var(--gold))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--surface))",
                    border: "1px solid hsl(var(--gold) / 0.3)",
                    borderRadius: 12,
                    fontSize: 12,
                  }}
                />
                <Area type="monotone" dataKey="performance" stroke="hsl(var(--gold))" fill="url(#dg)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Panel>
        <Panel title="Highlights">
          <ul className="space-y-3 text-sm">
            <li className="flex justify-between">
              <span className="text-muted-foreground">Weight</span>
              <span className="text-gold font-medium">{dept.kpi_weight.toFixed(1)}×</span>
            </li>
            <li className="flex justify-between">
              <span className="text-muted-foreground">Avg. KPI</span>
              <span className="text-foreground">{baseScore}</span>
            </li>
            <li className="flex justify-between">
              <span className="text-muted-foreground">Active members</span>
              <span className="text-foreground">{employees.length}</span>
            </li>
            <li className="flex justify-between">
              <span className="text-muted-foreground">Status</span>
              <span className="text-emerald-400">On track</span>
            </li>
          </ul>
        </Panel>
      </div>

      <Panel title={`Team members (${employees.length})`}>
        {employees.length === 0 ? (
          <div className="text-sm text-muted-foreground py-6 text-center">
            No employees assigned to this department yet.
          </div>
        ) : (
          <div className="divide-y divide-gold/10">
            {employees.map((e) => (
              <div key={e.id} className="flex items-center gap-4 py-3">
                <div className="size-10 rounded-full bg-gradient-gold flex items-center justify-center text-primary-foreground text-sm font-medium">
                  {(e.full_name || e.email || "?")[0]?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-foreground truncate">{e.full_name || "Unnamed"}</div>
                  <div className="text-xs text-muted-foreground truncate">
                    {e.job_title || "Team member"} · {e.email}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Panel>
    </div>
  );
}
