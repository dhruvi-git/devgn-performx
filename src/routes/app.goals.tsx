import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Target, Plus, TrendingUp, AlertTriangle, CheckCircle2, Trash2, Edit3, MessageSquare } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

export const Route = createFileRoute("/app/goals")({
  component: GoalsPage,
});

type GoalStatus = "draft" | "active" | "at_risk" | "completed" | "cancelled";
type MetricType = "number" | "percent" | "boolean" | "currency";

type Goal = {
  id: string;
  title: string;
  description: string | null;
  owner_id: string | null;
  department_id: string | null;
  quarter: number;
  year: number;
  status: GoalStatus;
  progress: number;
  weight: number;
};

type KeyResult = {
  id: string;
  goal_id: string;
  title: string;
  metric_type: MetricType;
  start_value: number;
  target_value: number;
  current_value: number;
  progress: number;
  status: GoalStatus;
  due_date: string | null;
};

const STATUS_STYLES: Record<GoalStatus, string> = {
  draft: "text-zinc-300 border-zinc-500/30 bg-zinc-500/10",
  active: "text-blue-300 border-blue-500/30 bg-blue-500/10",
  at_risk: "text-amber-300 border-amber-500/30 bg-amber-500/10",
  completed: "text-emerald-300 border-emerald-500/30 bg-emerald-500/10",
  cancelled: "text-rose-300 border-rose-500/30 bg-rose-500/10",
};

const STATUS_LABEL: Record<GoalStatus, string> = {
  draft: "Draft",
  active: "Active",
  at_risk: "At Risk",
  completed: "Completed",
  cancelled: "Cancelled",
};

const QUARTERS = [1, 2, 3, 4];
const currentYear = new Date().getFullYear();
const currentQuarter = Math.floor(new Date().getMonth() / 3) + 1;

function GoalsPage() {
  const { profile, role } = useAuth();
  const qc = useQueryClient();
  const isManager = role === "super_admin" || role === "hod" || role === "team_lead";

  const [year, setYear] = useState<number>(currentYear);
  const [quarter, setQuarter] = useState<number>(currentQuarter);
  const [scope, setScope] = useState<"all" | "mine">("all");
  const [openCreate, setOpenCreate] = useState(false);
  const [activeGoal, setActiveGoal] = useState<Goal | null>(null);

  const goalsQ = useQuery({
    queryKey: ["goals", year, quarter, scope, profile?.id],
    queryFn: async () => {
      let q = supabase
        .from("goals")
        .select("*")
        .eq("year", year)
        .eq("quarter", quarter)
        .order("created_at", { ascending: false });
      if (scope === "mine" && profile?.id) q = q.eq("owner_id", profile.id);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as Goal[];
    },
  });

  const krQ = useQuery({
    queryKey: ["key_results", goalsQ.data?.map((g) => g.id).join(",")],
    enabled: !!goalsQ.data && goalsQ.data.length > 0,
    queryFn: async () => {
      const ids = (goalsQ.data ?? []).map((g) => g.id);
      if (ids.length === 0) return [] as KeyResult[];
      const { data, error } = await supabase
        .from("key_results")
        .select("*")
        .in("goal_id", ids)
        .order("created_at");
      if (error) throw error;
      return (data ?? []) as KeyResult[];
    },
  });

  const peopleQ = useQuery({
    queryKey: ["profiles-min"],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("id, full_name, email");
      if (error) throw error;
      return data ?? [];
    },
  });

  const krByGoal = useMemo(() => {
    const map = new Map<string, KeyResult[]>();
    (krQ.data ?? []).forEach((k) => {
      const list = map.get(k.goal_id) ?? [];
      list.push(k);
      map.set(k.goal_id, list);
    });
    return map;
  }, [krQ.data]);

  const summary = useMemo(() => {
    const goals = goalsQ.data ?? [];
    const avg = goals.length ? goals.reduce((a, g) => a + Number(g.progress || 0), 0) / goals.length : 0;
    return {
      total: goals.length,
      avg: Math.round(avg),
      atRisk: goals.filter((g) => g.status === "at_risk").length,
      completed: goals.filter((g) => g.status === "completed").length,
    };
  }, [goalsQ.data]);

  const deleteGoal = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("goals").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Goal removed");
      qc.invalidateQueries({ queryKey: ["goals"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="p-8 space-y-8">
      <header className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-gold/80">
            <Target className="size-3.5" />
            Objectives & Key Results
          </div>
          <h1 className="text-3xl font-semibold mt-2">Quarterly Goals</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Align ambitions, measure outcomes, ship on cadence.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Select value={String(year)} onValueChange={(v) => setYear(Number(v))}>
            <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
            <SelectContent>
              {[currentYear - 1, currentYear, currentYear + 1].map((y) => (
                <SelectItem key={y} value={String(y)}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={String(quarter)} onValueChange={(v) => setQuarter(Number(v))}>
            <SelectTrigger className="w-24"><SelectValue /></SelectTrigger>
            <SelectContent>
              {QUARTERS.map((q) => <SelectItem key={q} value={String(q)}>Q{q}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={scope} onValueChange={(v) => setScope(v as "all" | "mine")}>
            <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All goals</SelectItem>
              <SelectItem value="mine">My goals</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={() => setOpenCreate(true)} className="bg-gradient-gold text-primary-foreground">
            <Plus className="size-4 mr-1" /> New Goal
          </Button>
        </div>
      </header>

      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Goals" value={summary.total} icon={<Target className="size-4" />} />
        <StatCard label="Avg Progress" value={`${summary.avg}%`} icon={<TrendingUp className="size-4" />} accent />
        <StatCard label="At Risk" value={summary.atRisk} icon={<AlertTriangle className="size-4" />} tone="warn" />
        <StatCard label="Completed" value={summary.completed} icon={<CheckCircle2 className="size-4" />} tone="ok" />
      </section>

      <section className="space-y-4">
        {goalsQ.isLoading && (
          <div className="text-sm text-muted-foreground">Loading goals…</div>
        )}
        {goalsQ.data && goalsQ.data.length === 0 && (
          <div className="glass p-12 rounded-2xl text-center">
            <Target className="size-10 mx-auto text-gold/60 mb-3" />
            <h3 className="text-lg">No goals set for Q{quarter} {year}</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Define a north-star objective and break it into measurable key results.
            </p>
            <Button onClick={() => setOpenCreate(true)} className="mt-4 bg-gradient-gold text-primary-foreground">
              <Plus className="size-4 mr-1" /> Create your first goal
            </Button>
          </div>
        )}

        {(goalsQ.data ?? []).map((g) => {
          const krs = krByGoal.get(g.id) ?? [];
          const ownerName =
            peopleQ.data?.find((p) => p.id === g.owner_id)?.full_name ?? "Unassigned";
          const canEdit = isManager || g.owner_id === profile?.id;
          return (
            <article key={g.id} className="glass rounded-2xl p-6 border border-gold/15 hover:border-gold/30 transition">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-lg font-medium">{g.title}</h3>
                    <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full border ${STATUS_STYLES[g.status]}`}>
                      {STATUS_LABEL[g.status]}
                    </span>
                  </div>
                  {g.description && (
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{g.description}</p>
                  )}
                  <div className="text-xs text-muted-foreground mt-2 flex items-center gap-3">
                    <span>Owner: <span className="text-foreground">{ownerName}</span></span>
                    <span>Weight: {g.weight}×</span>
                    <span>Q{g.quarter} · {g.year}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {canEdit && (
                    <Button variant="ghost" size="sm" onClick={() => setActiveGoal(g)}>
                      <Edit3 className="size-4 mr-1" /> Manage
                    </Button>
                  )}
                  {isManager && (
                    <Button variant="ghost" size="sm" onClick={() => {
                      if (confirm(`Delete goal "${g.title}"?`)) deleteGoal.mutate(g.id);
                    }}>
                      <Trash2 className="size-4 text-rose-400" />
                    </Button>
                  )}
                </div>
              </div>

              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Overall progress</span>
                  <span className="text-foreground">{Math.round(Number(g.progress))}%</span>
                </div>
                <Progress value={Number(g.progress)} className="h-2" />
              </div>

              {krs.length > 0 && (
                <div className="mt-4 space-y-2">
                  {krs.map((k) => (
                    <KrRow key={k.id} kr={k} canEdit={canEdit} />
                  ))}
                </div>
              )}

              {krs.length === 0 && canEdit && (
                <p className="text-xs text-muted-foreground mt-3 italic">
                  No key results yet — open Manage to add measurable outcomes.
                </p>
              )}
            </article>
          );
        })}
      </section>

      <CreateGoalDialog
        open={openCreate}
        onOpenChange={setOpenCreate}
        defaultYear={year}
        defaultQuarter={quarter}
        people={peopleQ.data ?? []}
        ownerId={profile?.id ?? null}
      />

      {activeGoal && (
        <ManageGoalDialog
          goal={activeGoal}
          krs={krByGoal.get(activeGoal.id) ?? []}
          onClose={() => setActiveGoal(null)}
        />
      )}
    </div>
  );
}

function StatCard({
  label, value, icon, tone = "default", accent = false,
}: {
  label: string; value: string | number; icon: React.ReactNode;
  tone?: "default" | "ok" | "warn"; accent?: boolean;
}) {
  const toneCls =
    tone === "warn" ? "text-amber-300" : tone === "ok" ? "text-emerald-300" : accent ? "text-gold" : "text-foreground";
  return (
    <div className="glass rounded-2xl p-5 border border-gold/15">
      <div className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-2">
        {icon} {label}
      </div>
      <div className={`text-2xl font-semibold mt-2 ${toneCls}`}>{value}</div>
    </div>
  );
}

function KrRow({ kr, canEdit }: { kr: KeyResult; canEdit: boolean }) {
  const qc = useQueryClient();
  const [val, setVal] = useState(String(kr.current_value));
  const [editing, setEditing] = useState(false);

  const update = useMutation({
    mutationFn: async (current: number) => {
      const { error } = await supabase.from("key_results").update({ current_value: current }).eq("id", kr.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Key result updated");
      qc.invalidateQueries({ queryKey: ["key_results"] });
      qc.invalidateQueries({ queryKey: ["goals"] });
      setEditing(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const unit = kr.metric_type === "percent" ? "%" : kr.metric_type === "currency" ? "$" : "";

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-surface/40 border border-gold/10">
      <div className="flex-1 min-w-0">
        <div className="text-sm truncate">{kr.title}</div>
        <div className="text-xs text-muted-foreground mt-1">
          {unit && kr.metric_type === "currency" ? `${unit}${kr.current_value}` : `${kr.current_value}${unit}`}
          {" / "}
          {unit && kr.metric_type === "currency" ? `${unit}${kr.target_value}` : `${kr.target_value}${unit}`}
        </div>
      </div>
      <div className="w-32">
        <Progress value={Number(kr.progress)} className="h-1.5" />
        <div className="text-[10px] text-right text-muted-foreground mt-1">{Math.round(Number(kr.progress))}%</div>
      </div>
      {canEdit && !editing && (
        <Button size="sm" variant="ghost" onClick={() => setEditing(true)}>Update</Button>
      )}
      {canEdit && editing && (
        <div className="flex items-center gap-1">
          <Input
            type="number"
            className="w-24 h-8"
            value={val}
            onChange={(e) => setVal(e.target.value)}
          />
          <Button size="sm" onClick={() => update.mutate(Number(val))} disabled={update.isPending}>
            Save
          </Button>
        </div>
      )}
    </div>
  );
}

function CreateGoalDialog({
  open, onOpenChange, defaultYear, defaultQuarter, people, ownerId,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  defaultYear: number;
  defaultQuarter: number;
  people: { id: string; full_name: string | null; email: string | null }[];
  ownerId: string | null;
}) {
  const qc = useQueryClient();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [owner, setOwner] = useState<string>(ownerId ?? "");
  const [weight, setWeight] = useState("1");

  const create = useMutation({
    mutationFn: async () => {
      if (!title.trim()) throw new Error("Title is required");
      const { error } = await supabase.from("goals").insert({
        title: title.trim(),
        description: description.trim() || null,
        owner_id: owner || null,
        quarter: defaultQuarter,
        year: defaultYear,
        weight: Number(weight) || 1,
        status: "active",
        created_by: ownerId,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Goal created");
      qc.invalidateQueries({ queryKey: ["goals"] });
      setTitle(""); setDescription(""); setWeight("1");
      onOpenChange(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Create a Goal for Q{defaultQuarter} {defaultYear}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Objective</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Launch v2 platform in EMEA" />
          </div>
          <div>
            <Label>Description</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Owner</Label>
              <Select value={owner} onValueChange={setOwner}>
                <SelectTrigger><SelectValue placeholder="Select owner" /></SelectTrigger>
                <SelectContent>
                  {people.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.full_name || p.email}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Weight</Label>
              <Input type="number" step="0.5" min="0.5" max="5" value={weight} onChange={(e) => setWeight(e.target.value)} />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => create.mutate()} disabled={create.isPending} className="bg-gradient-gold text-primary-foreground">
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ManageGoalDialog({
  goal, krs, onClose,
}: {
  goal: Goal;
  krs: KeyResult[];
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const [krTitle, setKrTitle] = useState("");
  const [metric, setMetric] = useState<MetricType>("number");
  const [target, setTarget] = useState("100");
  const [start, setStart] = useState("0");
  const [note, setNote] = useState("");
  const [status, setStatus] = useState<GoalStatus>(goal.status);

  const addKr = useMutation({
    mutationFn: async () => {
      if (!krTitle.trim()) throw new Error("Key result title required");
      const { error } = await supabase.from("key_results").insert({
        goal_id: goal.id,
        title: krTitle.trim(),
        metric_type: metric,
        start_value: Number(start) || 0,
        target_value: Number(target) || 100,
        current_value: Number(start) || 0,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Key result added");
      qc.invalidateQueries({ queryKey: ["key_results"] });
      qc.invalidateQueries({ queryKey: ["goals"] });
      setKrTitle(""); setStart("0"); setTarget("100");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteKr = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("key_results").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["key_results"] });
      qc.invalidateQueries({ queryKey: ["goals"] });
    },
  });

  const setGoalStatus = useMutation({
    mutationFn: async (s: GoalStatus) => {
      const { error } = await supabase.from("goals").update({ status: s }).eq("id", goal.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Status updated");
      qc.invalidateQueries({ queryKey: ["goals"] });
    },
  });

  const addCheckin = useMutation({
    mutationFn: async () => {
      if (!note.trim()) throw new Error("Note required");
      const { data: u } = await supabase.auth.getUser();
      const { error } = await supabase.from("goal_updates").insert({
        goal_id: goal.id,
        author_id: u.user?.id ?? null,
        note: note.trim(),
        progress_snapshot: goal.progress,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Check-in posted");
      setNote("");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{goal.title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Status</Label>
            <Select value={status} onValueChange={(v) => { setStatus(v as GoalStatus); setGoalStatus.mutate(v as GoalStatus); }}>
              <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
              <SelectContent>
                {(Object.keys(STATUS_LABEL) as GoalStatus[]).map((s) => (
                  <SelectItem key={s} value={s}>{STATUS_LABEL[s]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <section>
            <h4 className="text-sm font-medium mb-2">Key Results</h4>
            <div className="space-y-2">
              {krs.map((k) => (
                <div key={k.id} className="flex items-center gap-3 p-3 rounded-lg bg-surface/40 border border-gold/10">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm truncate">{k.title}</div>
                    <div className="text-xs text-muted-foreground">{k.current_value} / {k.target_value} ({k.metric_type})</div>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => deleteKr.mutate(k.id)}>
                    <Trash2 className="size-4 text-rose-400" />
                  </Button>
                </div>
              ))}
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 p-4 rounded-lg border border-dashed border-gold/20">
              <div className="col-span-2">
                <Label>Add a Key Result</Label>
                <Input value={krTitle} onChange={(e) => setKrTitle(e.target.value)} placeholder="e.g. Ship 3 onboarding flows" />
              </div>
              <div>
                <Label>Metric</Label>
                <Select value={metric} onValueChange={(v) => setMetric(v as MetricType)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="number">Number</SelectItem>
                    <SelectItem value="percent">Percent</SelectItem>
                    <SelectItem value="currency">Currency</SelectItem>
                    <SelectItem value="boolean">Done / Not done</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label>Start</Label>
                  <Input type="number" value={start} onChange={(e) => setStart(e.target.value)} />
                </div>
                <div>
                  <Label>Target</Label>
                  <Input type="number" value={target} onChange={(e) => setTarget(e.target.value)} />
                </div>
              </div>
              <div className="col-span-2 flex justify-end">
                <Button onClick={() => addKr.mutate()} disabled={addKr.isPending} className="bg-gradient-gold text-primary-foreground">
                  <Plus className="size-4 mr-1" /> Add Key Result
                </Button>
              </div>
            </div>
          </section>

          <section>
            <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
              <MessageSquare className="size-4" /> Post a check-in
            </h4>
            <Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} placeholder="What changed this week?" />
            <div className="flex justify-end mt-2">
              <Button size="sm" onClick={() => addCheckin.mutate()} disabled={addCheckin.isPending}>
                Post update
              </Button>
            </div>
          </section>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
