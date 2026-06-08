import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { AlertTriangle, Sparkles, FileDown, Flame, TrendingDown, ShieldAlert } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { generateMonthlySummary, detectBurnoutSignals } from "@/lib/insights.functions";
import { PageHeader } from "@/components/app/Panels";

export const Route = createFileRoute("/app/insights")({
  head: () => ({ meta: [{ title: "AI Insights · PerformX" }] }),
  component: InsightsPage,
});

type Profile = { id: string; full_name: string };
type Summary = {
  headline: string;
  highlights: string[];
  risks: string[];
  recommendations: string[];
};

function InsightsPage() {
  const { profile, role } = useAuth();
  const isManager = role === "super_admin" || role === "hod" || role === "team_lead";
  const [selectedUser, setSelectedUser] = useState<string>(profile?.id ?? "");
  const [summary, setSummary] = useState<Summary | null>(null);
  const genSummary = useServerFn(generateMonthlySummary);
  const detectBurnout = useServerFn(detectBurnoutSignals);

  const { data: people = [] } = useQuery({
    queryKey: ["insights-people"],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("id, full_name");
      return (data ?? []) as Profile[];
    },
    enabled: isManager,
  });

  const target = isManager ? selectedUser || profile?.id : profile?.id;

  const summaryMutation = useMutation({
    mutationFn: async () => genSummary({ data: { user_id: target } }),
    onSuccess: (data) => { setSummary(data as Summary); toast.success("Summary generated"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const burnoutQuery = useQuery({
    queryKey: ["burnout-signals"],
    queryFn: async () => detectBurnout(),
    enabled: isManager,
  });

  const exportReport = () => {
    if (!summary) return;
    const lines = [
      `# PerformX Monthly Intelligence Report`,
      `Generated: ${new Date().toLocaleString()}`,
      ``,
      `## ${summary.headline}`,
      ``,
      `### Highlights`, ...summary.highlights.map((h) => `- ${h}`), ``,
      `### Risks`, ...summary.risks.map((h) => `- ${h}`), ``,
      `### Recommendations`, ...summary.recommendations.map((h) => `- ${h}`),
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `performx-report-${Date.now()}.md`; a.click();
    URL.revokeObjectURL(url);
  };

  const signals = (burnoutQuery.data?.signals ?? []) as Array<{
    user_id: string; name: string; job_title: string;
    burnout_score: number; severity: string;
    load: number; overdue: number; high_priority: number; completed: number;
  }>;

  return (
    <div className="p-8 space-y-8">
      <PageHeader
        eyebrow="AI Intelligence"
        title="Workforce Insights & Reports"
        subtitle="AI-generated monthly summaries, burnout signals, and exportable executive reports."
      />

      {/* Monthly Summary */}
      <section className="glass-elevated rounded-3xl p-6">
        <div className="flex items-start justify-between flex-wrap gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-gold/70">
              <Sparkles className="size-3" /> Monthly Performance Summary
            </div>
            <h2 className="text-xl font-serif mt-2">AI-Generated Executive Brief</h2>
          </div>
          <div className="flex items-center gap-3">
            {isManager && (
              <Select value={selectedUser} onValueChange={setSelectedUser}>
                <SelectTrigger className="w-56"><SelectValue placeholder="Select employee" /></SelectTrigger>
                <SelectContent>
                  {people.map((p) => <SelectItem key={p.id} value={p.id}>{p.full_name}</SelectItem>)}
                </SelectContent>
              </Select>
            )}
            <Button
              onClick={() => summaryMutation.mutate()}
              disabled={summaryMutation.isPending || !target}
              className="bg-gradient-gold text-primary-foreground hover:opacity-90"
            >
              <Sparkles className="size-4" />
              {summaryMutation.isPending ? "Generating…" : "Generate Summary"}
            </Button>
            {summary && (
              <Button variant="outline" onClick={exportReport} className="border-gold/40">
                <FileDown className="size-4" /> Export
              </Button>
            )}
          </div>
        </div>

        {!summary && !summaryMutation.isPending && (
          <div className="text-sm text-muted-foreground py-12 text-center">
            Click <span className="text-gold">Generate Summary</span> to produce an AI executive brief.
          </div>
        )}
        {summary && (
          <div className="space-y-6">
            <div className="text-lg font-serif text-gold border-l-2 border-gold/40 pl-4">
              {summary.headline}
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              <InsightColumn icon={<TrendingDown className="size-4 rotate-180" />} title="Highlights" items={summary.highlights} accent="text-emerald-400" />
              <InsightColumn icon={<AlertTriangle className="size-4" />} title="Risks" items={summary.risks} accent="text-amber-400" />
              <InsightColumn icon={<ShieldAlert className="size-4" />} title="Recommendations" items={summary.recommendations} accent="text-gold" />
            </div>
          </div>
        )}
      </section>

      {/* Burnout Detection */}
      {isManager && (
        <section className="glass-elevated rounded-3xl p-6">
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-gold/70 mb-2">
            <Flame className="size-3" /> Burnout Signal Detection
          </div>
          <h2 className="text-xl font-serif mb-1">Workforce Wellness Radar</h2>
          <p className="text-xs text-muted-foreground mb-6">
            Computed from 30-day task load, overdue rate, high-priority concentration, and completion velocity.
          </p>

          {burnoutQuery.isLoading && (
            <div className="text-sm text-muted-foreground py-8">Analyzing signals…</div>
          )}
          {signals.length === 0 && !burnoutQuery.isLoading && (
            <div className="text-sm text-muted-foreground py-8">No signals detected yet.</div>
          )}
          <div className="space-y-2">
            {signals.slice(0, 12).map((s) => (
              <div key={s.user_id} className="flex items-center justify-between gap-4 rounded-xl border border-gold/15 bg-surface/40 p-4">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{s.name}</div>
                  <div className="text-xs text-muted-foreground">{s.job_title || "—"}</div>
                </div>
                <div className="hidden md:flex items-center gap-6 text-xs text-muted-foreground">
                  <Stat label="Load" value={s.load.toFixed(0)} />
                  <Stat label="Overdue" value={s.overdue} />
                  <Stat label="High Pri" value={s.high_priority} />
                  <Stat label="Done" value={s.completed} />
                </div>
                <div className="flex items-center gap-3 min-w-[180px] justify-end">
                  <div className="w-24 h-1.5 rounded-full bg-surface overflow-hidden">
                    <div
                      className={`h-full ${
                        s.severity === "critical" ? "bg-destructive"
                        : s.severity === "elevated" ? "bg-amber-400"
                        : "bg-emerald-400"
                      }`}
                      style={{ width: `${s.burnout_score}%` }}
                    />
                  </div>
                  <div className={`text-xs uppercase tracking-wider ${
                    s.severity === "critical" ? "text-destructive"
                    : s.severity === "elevated" ? "text-amber-400"
                    : "text-emerald-400"
                  }`}>
                    {s.severity}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function InsightColumn({ icon, title, items, accent }: {
  icon: React.ReactNode; title: string; items: string[]; accent: string;
}) {
  return (
    <div className="rounded-2xl border border-gold/15 bg-surface/40 p-5">
      <div className={`flex items-center gap-2 text-xs uppercase tracking-wider ${accent} mb-3`}>
        {icon} {title}
      </div>
      <ul className="space-y-2 text-sm text-foreground/85">
        {items.map((it, i) => (
          <li key={i} className="flex gap-2">
            <span className="text-gold/60">›</span>
            <span>{it}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="text-center">
      <div className="text-foreground text-sm">{value}</div>
      <div className="text-[10px] uppercase tracking-wider">{label}</div>
    </div>
  );
}
