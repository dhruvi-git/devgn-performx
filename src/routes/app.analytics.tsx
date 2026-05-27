import { createFileRoute } from "@tanstack/react-router";
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip,
} from "recharts";
import { PageHeader, Panel } from "@/components/app/Panels";
import { monthlyTrend, departmentScores, revenueTrend } from "@/lib/mock-data";

export const Route = createFileRoute("/app/analytics")({
  head: () => ({ meta: [{ title: "Analytics · PerformX" }] }),
  component: Analytics,
});

function Analytics() {
  return (
    <div className="p-8">
      <PageHeader eyebrow="Analytics" title="Workforce intelligence" subtitle="Trends, heatmaps and comparisons across the enterprise." />
      <div className="grid lg:grid-cols-2 gap-6">
        <Panel title="Performance trend">
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={monthlyTrend}>
              <defs>
                <linearGradient id="a1" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#D4AF37" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="#D4AF37" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="month" stroke="#666" fontSize={11} />
              <YAxis stroke="#666" fontSize={11} />
              <Tooltip contentStyle={{ background: "#0a0a0a", border: "1px solid #D4AF3755", borderRadius: 8 }} />
              <Area type="monotone" dataKey="performance" stroke="#D4AF37" fill="url(#a1)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </Panel>
        <Panel title="Revenue trajectory">
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={revenueTrend}>
              <XAxis dataKey="month" stroke="#666" fontSize={11} />
              <YAxis stroke="#666" fontSize={11} />
              <Tooltip contentStyle={{ background: "#0a0a0a", border: "1px solid #D4AF3755", borderRadius: 8 }} />
              <Line type="monotone" dataKey="revenue" stroke="#D4AF37" strokeWidth={2.5} />
              <Line type="monotone" dataKey="target" stroke="#9A7B22" strokeDasharray="4 4" />
            </LineChart>
          </ResponsiveContainer>
        </Panel>
        <Panel title="Department comparison" className="lg:col-span-2">
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={departmentScores}>
              <XAxis dataKey="dept" stroke="#666" fontSize={11} />
              <YAxis stroke="#666" fontSize={11} />
              <Tooltip contentStyle={{ background: "#0a0a0a", border: "1px solid #D4AF3755", borderRadius: 8 }} />
              <Bar dataKey="score" fill="#D4AF37" radius={[6, 6, 0, 0]} />
              <Bar dataKey="employees" fill="#9A7B22" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Panel>
      </div>
    </div>
  );
}
