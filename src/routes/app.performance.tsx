import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import { TrendingUp, Sparkles, Target, Clock, Award } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
} from "recharts";
import { recalculateScore } from "@/lib/performance.functions";

export const Route = createFileRoute("/app/performance")({
  component: PerformancePage,
});

type Profile = { id: string; full_name: string; department_id: string | null };
type Score = {
  id: string;
  user_id: string;
  period_start: string;
  period_end: string;
  tasks_completed: number;
  total_weight: number;
  on_time_rate: number;
  quality_score: number;
  final_score: number;
};

function monthRange(date = new Date()) {
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  return { start: fmt(start), end: fmt(end) };
}

function PerformancePage() {
  const { profile, role } = useAuth();
  const qc = useQueryClient();
  const isManager = role === "super_admin" || role === "hod" || role === "team_lead";
  const [selectedUser, setSelectedUser] = useState<string>(profile?.id ?? "");
  const recalc = useServerFn(recalculateScore);

  const { data: people = [] } = useQuery({
    queryKey: ["perf-people"],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("id, full_name, department_id");
      return (data ?? []) as Profile[];
    },
    enabled: isManager,
  });

  const targetUser = isManager ? selectedUser || profile?.id : profile?.id;

  const { data: scores = [] } = useQuery({
    queryKey: ["perf-scores", targetUser],
    queryFn: async () => {
      if (!targetUser) return [];
      const { data } = await supabase
        .from("performance_scores")
        .select("*")
        .eq("user_id", targetUser)
        .order("period_start", { ascending: true });
      return (data ?? []) as Score[];
    },
    enabled: !!targetUser,
  });

  const recalcMutation = useMutation({
    mutationFn: async () => {
      if (!targetUser) throw new Error("No user");
      const { start, end } = monthRange();
      return recalc({ data: { user_id: targetUser, period_start: start, period_end: end } });
    },
    onSuccess: () => {
      toast.success("Score recalculated");
      qc.invalidateQueries({ queryKey: ["perf-scores"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const latest = scores[scores.length - 1];
  const chartData = useMemo(
    () => scores.map((s) => ({
      month: new Date(s.period_start).toLocaleDateString(undefined, { month: "short" }),
      score: Number(s.final_score),
    })),
    [scores],
  );

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <div className="text-xs uppercase tracking-[0.3em] text-gold/70 mb-2">
            Performance Intelligence
          </div>
          <h1 className="text-3xl font-serif">Weighted Scoring Engine</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Composite scoring across task weight, on-time delivery, and quality —
            adjusted by departmental KPI weight.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {isManager && (
            <Select value={selectedUser} onValueChange={setSelectedUser}>
              <SelectTrigger className="w-56"><SelectValue placeholder="Select employee" /></SelectTrigger>
              <SelectContent>
                {people.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.full_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Button
            onClick={() => recalcMutation.mutate()}
            disabled={recalcMutation.isPending || !targetUser}
            className="bg-gradient-gold text-primary-foreground hover:opacity-90"
          >
            <Sparkles className="size-4" />
            {recalcMutation.isPending ? "Computing…" : "Recompute Score"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <MetricCard icon={<Award className="size-4" />} label="Final Score"
          value={latest ? latest.final_score.toFixed(1) : "—"} accent />
        <MetricCard icon={<Target className="size-4" />} label="Tasks Completed"
          value={latest ? String(latest.tasks_completed) : "—"} />
        <MetricCard icon={<Clock className="size-4" />} label="On-Time Rate"
          value={latest ? `${Math.round(latest.on_time_rate * 100)}%` : "—"} />
        <MetricCard icon={<TrendingUp className="size-4" />} label="Quality Avg"
          value={latest ? latest.quality_score.toFixed(0) : "—"} />
      </div>

      <div className="glass rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-sm font-medium">Score Trajectory</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Monthly weighted performance over time
            </p>
          </div>
        </div>
        <div className="h-72">
          {chartData.length === 0 ? (
            <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
              No score history yet. Click "Recompute Score" to generate this period.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="perfGold" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--gold))" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="hsl(var(--gold))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--surface))",
                    border: "1px solid hsl(var(--gold) / 0.3)",
                    borderRadius: 8,
                  }}
                />
                <Area
                  type="monotone" dataKey="score"
                  stroke="hsl(var(--gold))" strokeWidth={2}
                  fill="url(#perfGold)"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="glass rounded-2xl p-6">
        <h3 className="text-sm font-medium mb-4">Scoring Formula</h3>
        <div className="grid md:grid-cols-3 gap-4 text-sm">
          <FormulaCard weight="50%" label="Task Weight" desc="Sum of completed task weights" />
          <FormulaCard weight="30%" label="On-Time Delivery" desc="Tasks delivered before due date" />
          <FormulaCard weight="20%" label="Quality" desc="Average progress quality marker" />
        </div>
        <div className="mt-4 text-xs text-muted-foreground">
          Final score is multiplied by the assignee's department KPI weight.
        </div>
      </div>
    </div>
  );
}

function MetricCard({
  icon, label, value, accent,
}: { icon: React.ReactNode; label: string; value: string; accent?: boolean }) {
  return (
    <div className="glass rounded-2xl p-5">
      <div className={`inline-flex items-center gap-2 text-xs ${accent ? "text-gold" : "text-muted-foreground"}`}>
        {icon}
        <span className="uppercase tracking-wider">{label}</span>
      </div>
      <div className={`text-3xl font-serif mt-2 ${accent ? "text-gold" : ""}`}>{value}</div>
    </div>
  );
}

function FormulaCard({ weight, label, desc }: { weight: string; label: string; desc: string }) {
  return (
    <div className="rounded-xl border border-gold/15 bg-surface/40 p-4">
      <div className="text-2xl font-serif text-gold">{weight}</div>
      <div className="text-sm font-medium mt-1">{label}</div>
      <div className="text-xs text-muted-foreground mt-1">{desc}</div>
    </div>
  );
}
