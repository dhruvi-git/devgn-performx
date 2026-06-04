import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { Plus, Calendar, Flag, GripVertical, Trash2, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

export const Route = createFileRoute("/app/tasks")({
  component: TasksPage,
});

type TaskStatus = "todo" | "in_progress" | "review" | "done";
type TaskPriority = "low" | "medium" | "high" | "critical";

type Task = {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  weight: number;
  progress: number;
  assignee_id: string | null;
  created_by: string | null;
  department_id: string | null;
  due_date: string | null;
  completed_at: string | null;
};

const COLUMNS: { id: TaskStatus; label: string; tint: string }[] = [
  { id: "todo", label: "Backlog", tint: "from-zinc-500/20" },
  { id: "in_progress", label: "In Progress", tint: "from-blue-500/20" },
  { id: "review", label: "In Review", tint: "from-amber-500/20" },
  { id: "done", label: "Completed", tint: "from-emerald-500/20" },
];

const PRIORITY_COLORS: Record<TaskPriority, string> = {
  low: "text-zinc-400 border-zinc-500/30 bg-zinc-500/10",
  medium: "text-blue-300 border-blue-500/30 bg-blue-500/10",
  high: "text-amber-300 border-amber-500/30 bg-amber-500/10",
  critical: "text-rose-300 border-rose-500/30 bg-rose-500/10",
};

function TasksPage() {
  const { profile, role } = useAuth();
  const qc = useQueryClient();
  const [dragId, setDragId] = useState<string | null>(null);
  const [openCreate, setOpenCreate] = useState(false);

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ["tasks"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Task[];
    },
  });

  const { data: people = [] } = useQuery({
    queryKey: ["task-people"],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("id, full_name, email");
      return (data ?? []) as { id: string; full_name: string; email: string | null }[];
    },
  });

  const { data: departments = [] } = useQuery({
    queryKey: ["task-departments"],
    queryFn: async () => {
      const { data } = await supabase.from("departments").select("id, name, slug");
      return (data ?? []) as { id: string; name: string; slug: string }[];
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: TaskStatus }) => {
      const { error } = await supabase.from("tasks").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onMutate: async ({ id, status }) => {
      await qc.cancelQueries({ queryKey: ["tasks"] });
      const prev = qc.getQueryData<Task[]>(["tasks"]);
      qc.setQueryData<Task[]>(["tasks"], (old) =>
        (old ?? []).map((t) => (t.id === id ? { ...t, status } : t)),
      );
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(["tasks"], ctx.prev);
      toast.error("Failed to move task");
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ["tasks"] }),
  });

  const deleteTask = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("tasks").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Task deleted");
      qc.invalidateQueries({ queryKey: ["tasks"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const grouped = useMemo(() => {
    const map: Record<TaskStatus, Task[]> = { todo: [], in_progress: [], review: [], done: [] };
    for (const t of tasks) map[t.status].push(t);
    return map;
  }, [tasks]);

  const canCreate = role !== "employee" || true; // employees can create own
  const peopleById = useMemo(
    () => Object.fromEntries(people.map((p) => [p.id, p])),
    [people],
  );

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs uppercase tracking-[0.3em] text-gold/70 mb-2">
            Workforce Operations
          </div>
          <h1 className="text-3xl font-serif">Task Command Board</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Kanban-style task orchestration with weighted performance signal.
          </p>
        </div>
        {canCreate && (
          <Dialog open={openCreate} onOpenChange={setOpenCreate}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-gold text-primary-foreground hover:opacity-90">
                <Plus className="size-4" /> New Task
              </Button>
            </DialogTrigger>
            <CreateTaskDialog
              people={people}
              departments={departments}
              defaultAssignee={profile?.id}
              defaultDepartment={profile?.department_id ?? null}
              onClose={() => setOpenCreate(false)}
              onCreated={() => qc.invalidateQueries({ queryKey: ["tasks"] })}
            />
          </Dialog>
        )}
      </div>

      {isLoading ? (
        <div className="text-sm text-muted-foreground animate-pulse">Loading board…</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
          {COLUMNS.map((col) => (
            <div
              key={col.id}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => {
                if (dragId) updateStatus.mutate({ id: dragId, status: col.id });
                setDragId(null);
              }}
              className={`glass rounded-2xl p-4 min-h-[400px] bg-gradient-to-b ${col.tint} to-transparent`}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium tracking-wide">{col.label}</h3>
                <span className="text-xs text-muted-foreground bg-surface/60 px-2 py-0.5 rounded-full">
                  {grouped[col.id].length}
                </span>
              </div>
              <div className="space-y-3">
                {grouped[col.id].map((task) => {
                  const assignee = task.assignee_id ? peopleById[task.assignee_id] : null;
                  return (
                    <div
                      key={task.id}
                      draggable
                      onDragStart={() => setDragId(task.id)}
                      onDragEnd={() => setDragId(null)}
                      className="glass rounded-xl p-3 border border-gold/10 hover:border-gold/30 transition cursor-grab active:cursor-grabbing group"
                    >
                      <div className="flex items-start gap-2">
                        <GripVertical className="size-3.5 text-muted-foreground/40 mt-0.5 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium leading-snug">{task.title}</div>
                          {task.description && (
                            <div className="text-xs text-muted-foreground mt-1 line-clamp-2">
                              {task.description}
                            </div>
                          )}
                          <div className="flex flex-wrap items-center gap-2 mt-3">
                            <span
                              className={`text-[10px] uppercase tracking-wider border px-1.5 py-0.5 rounded ${PRIORITY_COLORS[task.priority]}`}
                            >
                              <Flag className="size-2.5 inline -mt-0.5 mr-1" />
                              {task.priority}
                            </span>
                            <span className="text-[10px] text-gold/80 border border-gold/20 bg-gold/5 px-1.5 py-0.5 rounded">
                              ×{task.weight}
                            </span>
                            {task.due_date && (
                              <span className="text-[10px] text-muted-foreground inline-flex items-center gap-1">
                                <Calendar className="size-2.5" />
                                {new Date(task.due_date).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center justify-between mt-3">
                            <div className="text-[10px] text-muted-foreground inline-flex items-center gap-1">
                              <User className="size-2.5" />
                              {assignee?.full_name ?? "Unassigned"}
                            </div>
                            <button
                              onClick={() => deleteTask.mutate(task.id)}
                              className="opacity-0 group-hover:opacity-100 transition text-muted-foreground hover:text-destructive"
                            >
                              <Trash2 className="size-3.5" />
                            </button>
                          </div>
                          {task.progress > 0 && task.status !== "done" && (
                            <div className="mt-2 h-1 rounded-full bg-surface overflow-hidden">
                              <div
                                className="h-full bg-gradient-gold"
                                style={{ width: `${task.progress}%` }}
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
                {grouped[col.id].length === 0 && (
                  <div className="text-xs text-muted-foreground/50 text-center py-8 border border-dashed border-gold/10 rounded-xl">
                    Drop tasks here
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function CreateTaskDialog({
  people, departments, defaultAssignee, defaultDepartment, onClose, onCreated,
}: {
  people: { id: string; full_name: string }[];
  departments: { id: string; name: string }[];
  defaultAssignee?: string;
  defaultDepartment: string | null;
  onClose: () => void;
  onCreated: () => void;
}) {
  const { profile } = useAuth();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("medium");
  const [weight, setWeight] = useState("1");
  const [assignee, setAssignee] = useState(defaultAssignee ?? "");
  const [department, setDepartment] = useState(defaultDepartment ?? "");
  const [dueDate, setDueDate] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (!title.trim()) return toast.error("Title required");
    setSubmitting(true);
    const { error } = await supabase.from("tasks").insert({
      title: title.trim(),
      description: description.trim() || null,
      priority,
      weight: Number(weight) || 1,
      assignee_id: assignee || null,
      created_by: profile?.id ?? null,
      department_id: department || null,
      due_date: dueDate ? new Date(dueDate).toISOString() : null,
    });
    setSubmitting(false);
    if (error) return toast.error(error.message);
    toast.success("Task created");
    onCreated();
    onClose();
  };

  return (
    <DialogContent className="bg-surface border-gold/20 max-w-lg">
      <DialogHeader>
        <DialogTitle className="font-serif text-xl">Create Task</DialogTitle>
      </DialogHeader>
      <div className="space-y-4">
        <div>
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">Title</Label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Task name" />
        </div>
        <div>
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">Description</Label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="Optional context…"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Priority</Label>
            <Select value={priority} onValueChange={(v) => setPriority(v as TaskPriority)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Weight</Label>
            <Input
              type="number" min="0.1" step="0.1" value={weight}
              onChange={(e) => setWeight(e.target.value)}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Assignee</Label>
            <Select value={assignee} onValueChange={setAssignee}>
              <SelectTrigger><SelectValue placeholder="Unassigned" /></SelectTrigger>
              <SelectContent>
                {people.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.full_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Department</Label>
            <Select value={department} onValueChange={setDepartment}>
              <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
              <SelectContent>
                {departments.map((d) => (
                  <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div>
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">Due Date</Label>
          <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
        </div>
      </div>
      <DialogFooter>
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button
          onClick={submit}
          disabled={submitting}
          className="bg-gradient-gold text-primary-foreground hover:opacity-90"
        >
          {submitting ? "Creating…" : "Create Task"}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}
