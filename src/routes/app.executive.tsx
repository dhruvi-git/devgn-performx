import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  AreaChart, Area, BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip,
  RadialBarChart, RadialBar, PolarAngleAxis, PieChart, Pie, Cell, LineChart, Line,
} from "recharts";
import { Activity, Brain, TrendingUp, Users, Sparkles, Download } from "lucide-react";
import { PageHeader, KpiCard, Panel } from "@/components/app/Panels";
import { monthlyTrend, departmentScores, revenueTrend, employeeDistribution, aiInsights, topPerformers } from "@/lib/mock-data";

export const Route = createFileRoute("/app/executive")({
  head: () => ({ meta: [{ title: "Executive Dashboard · PerformX" }] }),
  component: Executive,
});

const COLORS = ["#D4AF37", "#E8C66B", "#9A7B22", "#B89030", "#6B5418"];

function Executive() {
  return (
    <div className="p-8">
      <PageHeader
        eyebrow="Executive Command"
        title="Company at a glance"
        subtitle="Real-time workforce, revenue and performance intelligence across Devgn Cinex."
        actions={
          <button className="inline-flex items-center gap-2 rounded-lg bg-gradient-gold px-4 py-2 text-sm font-medium text-primary-foreground gold-glow">
            <Download className="size-4" /> Export report
          </button>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard label="Company health" value="91.4" delta="+2.3 MoM" icon={Activity} accent />
        <KpiCard label="Active employees" value="1,284" delta="+18 this month" icon={Users} />
        <KpiCard label="Revenue (₹Cr)" value="2.7" delta="+14% MoM" icon={TrendingUp} />
        <KpiCard label="AI alerts" value="7" delta="3 critical" icon={Brain} />
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mb-6">
        <Panel title="Revenue vs target" className="lg:col-span-2">
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={revenueTrend}>
              <defs>
                <linearGradient id="rev" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#D4AF37" stopOpacity={0.6} />
                  <stop offset="100%" stopColor="#D4AF37" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="month" stroke="#666" fontSize={11} />
              <YAxis stroke="#666" fontSize={11} />
              <Tooltip contentStyle={{ background: "#0a0a0a", border: "1px solid #D4AF3755", borderRadius: 8 }} />
              <Area type="monotone" dataKey="revenue" stroke="#D4AF37" fill="url(#rev)" strokeWidth={2} />
              <Area type="monotone" dataKey="target" stroke="#9A7B22" fill="none" strokeDasharray="4 4" strokeWidth={1.5} />
            </AreaChart>
          </ResponsiveContainer>
        </Panel>

        <Panel title="Health score">
          <ResponsiveContainer width="100%" height={280}>
            <RadialBarChart innerRadius="65%" outerRadius="100%" data={[{ name: "score", value: 91 }]} startAngle={90} endAngle={-270}>
              <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
              <RadialBar dataKey="value" background={{ fill: "#1a1a1a" }} fill="#D4AF37" cornerRadius={20} />
            </RadialBarChart>
          </ResponsiveContainer>
          <div className="text-center -mt-40 mb-32 pointer-events-none">
            <div className="font-display text-4xl text-gradient-gold">91.4</div>
            <div className="text-xs text-muted-foreground mt-1">of 100</div>
          </div>
        </Panel>
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mb-6">
        <Panel title="Department performance" className="lg:col-span-2">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={departmentScores}>
              <XAxis dataKey="dept" stroke="#666" fontSize={11} />
              <YAxis stroke="#666" fontSize={11} domain={[0, 100]} />
              <Tooltip contentStyle={{ background: "#0a0a0a", border: "1px solid #D4AF3755", borderRadius: 8 }} />
              <Bar dataKey="score" fill="#D4AF37" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Panel>

        <Panel title="Employee distribution">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={employeeDistribution} dataKey="value" nameKey="name" innerRadius={60} outerRadius={100} paddingAngle={3}>
                {employeeDistribution.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ background: "#0a0a0a", border: "1px solid #D4AF3755", borderRadius: 8 }} />
            </PieChart>
          </ResponsiveContainer>
        </Panel>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <Panel title="Monthly trends" className="lg:col-span-2">
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={monthlyTrend}>
              <XAxis dataKey="month" stroke="#666" fontSize={11} />
              <YAxis stroke="#666" fontSize={11} />
              <Tooltip contentStyle={{ background: "#0a0a0a", border: "1px solid #D4AF3755", borderRadius: 8 }} />
              <Line type="monotone" dataKey="performance" stroke="#D4AF37" strokeWidth={2} dot={{ fill: "#D4AF37", r: 3 }} />
              <Line type="monotone" dataKey="productivity" stroke="#E8C66B" strokeWidth={2} dot={{ fill: "#E8C66B", r: 3 }} />
              <Line type="monotone" dataKey="attendance" stroke="#9A7B22" strokeWidth={2} dot={{ fill: "#9A7B22", r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </Panel>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-2xl p-5 border border-gold/30 gold-glow">
          <div className="flex items-center gap-2 text-xs text-gold mb-3">
            <Sparkles className="size-3" /> PerformX AI · monthly digest
          </div>
          <div className="space-y-3">
            {aiInsights.map((i, idx) => (
              <div key={idx} className="text-sm text-foreground/90 leading-relaxed flex gap-2">
                <span className="text-gold">·</span> {i}
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      <div className="mt-6">
        <Panel title="Top performers — August">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs uppercase tracking-widest text-muted-foreground border-b border-gold/15">
                  <th className="text-left py-3 font-normal">Rank</th>
                  <th className="text-left py-3 font-normal">Name</th>
                  <th className="text-left py-3 font-normal">Department</th>
                  <th className="text-right py-3 font-normal">Score</th>
                  <th className="text-right py-3 font-normal">MoM</th>
                </tr>
              </thead>
              <tbody>
                {topPerformers.map((p, i) => (
                  <tr key={p.name} className="border-b border-gold/10 hover:bg-gold/5 transition">
                    <td className="py-3 text-gold font-display">#{i + 1}</td>
                    <td className="py-3 text-foreground">{p.name}</td>
                    <td className="py-3 text-muted-foreground">{p.dept}</td>
                    <td className="py-3 text-right text-foreground font-display">{p.score}</td>
                    <td className={`py-3 text-right ${p.trend.startsWith("+") ? "text-gold" : "text-destructive"}`}>{p.trend}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      </div>
    </div>
  );
}
