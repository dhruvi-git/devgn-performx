import { createFileRoute } from "@tanstack/react-router";
import {
  LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip,
  RadialBarChart, RadialBar, PolarAngleAxis,
} from "recharts";
import { Target, Calendar, CheckCircle2, MessageSquare, Sparkles } from "lucide-react";
import { PageHeader, KpiCard, Panel } from "@/components/app/Panels";
import { monthlyTrend, tasks } from "@/lib/mock-data";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/app/employee")({
  head: () => ({ meta: [{ title: "My Workspace · PerformX" }] }),
  component: Employee,
});

function Employee() {
  const { profile } = useAuth();
  const name = profile?.full_name?.split(" ")[0] || "You";


  return (
    <div className="p-8">
      <PageHeader
        eyebrow="My Workspace"
        title={`Good to see you, ${name}`}
        subtitle="Your KPI, tasks, attendance and growth insights."
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard label="Personal KPI" value="88.7" delta="+2.4 MoM" icon={Target} accent />
        <KpiCard label="Tasks open" value="12" delta="3 due this week" icon={CheckCircle2} />
        <KpiCard label="Attendance" value="96%" delta="22/23 days" icon={Calendar} />
        <KpiCard label="Feedback" value="4.6" delta="of 5.0" icon={MessageSquare} />
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mb-6">
        <Panel title="My performance trend" className="lg:col-span-2">
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={monthlyTrend}>
              <XAxis dataKey="month" stroke="#666" fontSize={11} />
              <YAxis stroke="#666" fontSize={11} />
              <Tooltip contentStyle={{ background: "#0a0a0a", border: "1px solid #D4AF3755", borderRadius: 8 }} />
              <Line type="monotone" dataKey="performance" stroke="#D4AF37" strokeWidth={2.5} dot={{ fill: "#D4AF37", r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </Panel>

        <Panel title="KPI score">
          <div className="relative">
            <ResponsiveContainer width="100%" height={240}>
              <RadialBarChart innerRadius="65%" outerRadius="100%" data={[{ value: 88 }]} startAngle={90} endAngle={-270}>
                <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
                <RadialBar dataKey="value" background={{ fill: "#1a1a1a" }} fill="#D4AF37" cornerRadius={20} />
              </RadialBarChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <div className="font-display text-4xl text-gradient-gold">88.7</div>
              <div className="text-xs text-muted-foreground mt-1">of 100</div>
            </div>
          </div>
        </Panel>
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mb-6">
        <Panel title="My tasks" className="lg:col-span-2">
          <div className="space-y-3">
            {tasks.map((t) => (
              <div key={t.id} className="p-3 rounded-lg border border-gold/15 hover:border-gold/30 transition">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm text-foreground">{t.title}</div>
                  <span className="text-xs text-muted-foreground">{t.due}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-1.5 rounded-full bg-surface-elevated overflow-hidden">
                    <div className="h-full bg-gradient-gold" style={{ width: `${t.progress}%` }} />
                  </div>
                  <div className="text-xs text-gold w-10 text-right">{t.progress}%</div>
                </div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Goals">
          <div className="space-y-4">
            {[
              { g: "Close 5 enterprise deals", p: 60 },
              { g: "Complete leadership module", p: 80 },
              { g: "Mentor 2 juniors", p: 50 },
              { g: "Achieve 95% attendance", p: 96 },
            ].map((x, i) => (
              <div key={i}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="text-sm text-foreground">{x.g}</div>
                  <div className="text-xs text-gold">{x.p}%</div>
                </div>
                <div className="h-1.5 rounded-full bg-surface-elevated overflow-hidden">
                  <div className="h-full bg-gradient-gold" style={{ width: `${x.p}%` }} />
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <div className="glass rounded-2xl p-6 border border-gold/30 gold-glow">
        <div className="flex items-center gap-2 text-xs text-gold mb-3">
          <Sparkles className="size-3" /> AI insight · monthly report
        </div>
        <div className="font-display text-xl text-gradient-gold mb-2">You're trending up.</div>
        <p className="text-sm text-foreground/90 leading-relaxed max-w-3xl">
          Your performance is up 2.4 points MoM driven by consistent task delivery and strong collaboration.
          Focus area for September: complete the leadership module and lead one cross-team initiative
          to push into the top decile of performers.
        </p>
      </div>
    </div>
  );
}
