import { createFileRoute } from "@tanstack/react-router";
import {
  AreaChart, Area, BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip,
} from "recharts";
import { CheckCircle2, Clock, Users, TrendingUp, Bell } from "lucide-react";
import { PageHeader, KpiCard, Panel } from "@/components/app/Panels";
import { monthlyTrend, topPerformers, tasks } from "@/lib/mock-data";

export const Route = createFileRoute("/app/hod")({
  head: () => ({ meta: [{ title: "HOD Dashboard · PerformX" }] }),
  component: HOD,
});

function HOD() {
  return (
    <div className="p-8">
      <PageHeader
        eyebrow="Head of Department"
        title="Your team, intelligently"
        subtitle="Performance, attendance, approvals and notifications — your command center."
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard label="Team size" value="32" icon={Users} />
        <KpiCard label="Avg KPI" value="87.4" delta="+1.8" icon={TrendingUp} accent />
        <KpiCard label="Pending approvals" value="9" delta="3 urgent" icon={Clock} />
        <KpiCard label="Tasks this week" value="148" delta="92% on-time" icon={CheckCircle2} />
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mb-6">
        <Panel title="Team productivity" className="lg:col-span-2">
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={monthlyTrend}>
              <defs>
                <linearGradient id="hp" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#D4AF37" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="#D4AF37" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="month" stroke="#666" fontSize={11} />
              <YAxis stroke="#666" fontSize={11} />
              <Tooltip contentStyle={{ background: "#0a0a0a", border: "1px solid #D4AF3755", borderRadius: 8 }} />
              <Area type="monotone" dataKey="productivity" stroke="#D4AF37" fill="url(#hp)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </Panel>

        <Panel title="Notifications">
          <div className="space-y-3">
            {[
              { t: "Leave request — Priya S.", s: "Awaiting approval", c: "gold" },
              { t: "KPI review due — 4 employees", s: "By Friday", c: "gold" },
              { t: "Attendance anomaly", s: "Rohan K. · 3 late marks", c: "destructive" },
              { t: "New task assigned", s: "Q3 audit prep", c: "muted" },
            ].map((n, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-lg border border-gold/15 hover:border-gold/30 transition">
                <Bell className={`size-4 mt-0.5 ${n.c === "destructive" ? "text-destructive" : "text-gold"}`} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-foreground truncate">{n.t}</div>
                  <div className="text-xs text-muted-foreground">{n.s}</div>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <Panel title="Employee rankings">
          <div className="space-y-2">
            {topPerformers.slice(0, 6).map((p, i) => (
              <div key={p.name} className="flex items-center gap-4 p-3 rounded-lg hover:bg-gold/5 transition">
                <div className="font-display text-gold text-lg w-8">#{i + 1}</div>
                <div className="size-9 rounded-full bg-gradient-gold/20 border border-gold/30 flex items-center justify-center text-gold text-sm font-medium">
                  {p.name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-foreground truncate">{p.name}</div>
                  <div className="text-xs text-muted-foreground">{p.dept}</div>
                </div>
                <div className="font-display text-foreground">{p.score}</div>
                <div className={`text-xs ${p.trend.startsWith("+") ? "text-gold" : "text-destructive"} w-10 text-right`}>{p.trend}</div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Attendance — last 8 months">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyTrend}>
              <XAxis dataKey="month" stroke="#666" fontSize={11} />
              <YAxis stroke="#666" fontSize={11} domain={[80, 100]} />
              <Tooltip contentStyle={{ background: "#0a0a0a", border: "1px solid #D4AF3755", borderRadius: 8 }} />
              <Bar dataKey="attendance" fill="#D4AF37" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Panel>
      </div>

      <Panel title="Active tasks · monitoring">
        <div className="space-y-3">
          {tasks.map((t) => (
            <div key={t.id} className="p-4 rounded-lg border border-gold/15 hover:border-gold/30 transition">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm text-foreground">{t.title}</div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full border ${
                    t.priority === "High" ? "border-destructive/40 text-destructive bg-destructive/10"
                    : t.priority === "Medium" ? "border-gold/40 text-gold bg-gold/10"
                    : "border-muted-foreground/30 text-muted-foreground"
                  }`}>{t.priority}</span>
                  <span className="text-xs text-muted-foreground">{t.due}</span>
                </div>
              </div>
              <div className="h-1.5 rounded-full bg-surface-elevated overflow-hidden">
                <div className="h-full bg-gradient-gold" style={{ width: `${t.progress}%` }} />
              </div>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}
