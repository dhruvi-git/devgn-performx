import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import { Plane, CalendarDays, Check, X, Clock3, PlusCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { PageHeader, Panel, KpiCard } from "@/components/app/Panels";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { requestLeave, decideLeave, cancelLeave } from "@/lib/leave.functions";

export const Route = createFileRoute("/app/leave")({
  head: () => ({ meta: [{ title: "Leave · PerformX" }] }),
  component: LeavePage,
});

type LeaveType = "vacation" | "sick" | "personal" | "bereavement" | "other";
type LeaveStatus = "pending" | "approved" | "rejected" | "cancelled";
type LeaveRow = {
  id: string;
  user_id: string;
  leave_type: LeaveType;
  start_date: string;
  end_date: string;
  reason: string | null;
  status: LeaveStatus;
  approver_id: string | null;
  approver_notes: string | null;
  created_at: string;
};

const STATUS_COLOR: Record<LeaveStatus, string> = {
  pending: "text-amber-300 bg-amber-300/10 border-amber-300/30",
  approved: "text-emerald-300 bg-emerald-300/10 border-emerald-300/30",
  rejected: "text-rose-300 bg-rose-300/10 border-rose-300/30",
  cancelled: "text-muted-foreground bg-muted/20 border-muted/30",
};

function daysBetween(a: string, b: string) {
  const ms = new Date(b).getTime() - new Date(a).getTime();
  return Math.max(1, Math.round(ms / 86400000) + 1);
}

function LeavePage() {
  const { profile, role } = useAuth();
  const qc = useQueryClient();
  const isManager = role === "super_admin" || role === "hod" || role === "team_lead";

  const submit = useServerFn(requestLeave);
  const decide = useServerFn(decideLeave);
  const cancel = useServerFn(cancelLeave);

  const [showForm, setShowForm] = useState(false);
  const [leaveType, setLeaveType] = useState<LeaveType>("vacation");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");

  const { data: myLeave = [] } = useQuery({
    queryKey: ["leave", "mine", profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];
      const { data } = await supabase
        .from("leave_requests")
        .select("*")
        .eq("user_id", profile.id)
        .order("start_date", { ascending: false });
      return (data ?? []) as LeaveRow[];
    },
    enabled: !!profile?.id,
  });

  const { data: teamLeave = [] } = useQuery({
    queryKey: ["leave", "team"],
    queryFn: async () => {
      const { data } = await supabase
        .from("leave_requests")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);
      return (data ?? []) as LeaveRow[];
    },
    enabled: isManager,
  });

  const { data: directory = [] } = useQuery({
    queryKey: ["directory"],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("id, full_name");
      return (data ?? []) as { id: string; full_name: string }[];
    },
    enabled: isManager,
  });

  const nameOf = useMemo(() => {
    const m = new Map(directory.map((d) => [d.id, d.full_name] as const));
    return (id: string) => m.get(id) ?? "Team member";
  }, [directory]);

  const pendingMine = myLeave.filter((r) => r.status === "pending").length;
  const approvedDays = myLeave
    .filter((r) => r.status === "approved")
    .reduce((sum, r) => sum + daysBetween(r.start_date, r.end_date), 0);
  const pendingTeam = teamLeave.filter((r) => r.status === "pending").length;

  const submitMut = useMutation({
    mutationFn: async () =>
      submit({ data: { leave_type: leaveType, start_date: startDate, end_date: endDate, reason: reason || undefined } }),
    onSuccess: () => {
      toast.success("Leave request submitted");
      setShowForm(false);
      setStartDate(""); setEndDate(""); setReason("");
      qc.invalidateQueries({ queryKey: ["leave"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const decideMut = useMutation({
    mutationFn: async (p: { id: string; status: "approved" | "rejected" }) =>
      decide({ data: p }),
    onSuccess: (_d, v) => {
      toast.success(`Request ${v.status}`);
      qc.invalidateQueries({ queryKey: ["leave"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const cancelMut = useMutation({
    mutationFn: async (id: string) => cancel({ data: { id } }),
    onSuccess: () => {
      toast.success("Request cancelled");
      qc.invalidateQueries({ queryKey: ["leave"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="p-6 md:p-10">
      <PageHeader
        eyebrow="Time Off"
        title="Leave & Time Off"
        subtitle="Submit, track, and approve leave requests across the workforce."
        actions={
          <Button
            className="bg-gradient-gold text-primary-foreground"
            onClick={() => setShowForm((v) => !v)}
          >
            <PlusCircle className="size-4 mr-2" />
            {showForm ? "Close" : "Request Leave"}
          </Button>
        }
      />

      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <KpiCard label="My pending" value={String(pendingMine)} icon={Clock3} />
        <KpiCard label="Approved days (YTD)" value={String(approvedDays)} icon={CalendarDays} accent />
        {isManager && <KpiCard label="Team pending" value={String(pendingTeam)} icon={Plane} />}
      </div>

      {showForm && (
        <Panel title="New Leave Request" className="mb-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-xs uppercase tracking-widest text-muted-foreground">Type</label>
              <select
                value={leaveType}
                onChange={(e) => setLeaveType(e.target.value as LeaveType)}
                className="mt-1 w-full rounded-md bg-background/60 border border-gold/20 px-3 py-2 text-sm"
              >
                <option value="vacation">Vacation</option>
                <option value="sick">Sick</option>
                <option value="personal">Personal</option>
                <option value="bereavement">Bereavement</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs uppercase tracking-widest text-muted-foreground">Start</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="mt-1 w-full rounded-md bg-background/60 border border-gold/20 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-xs uppercase tracking-widest text-muted-foreground">End</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="mt-1 w-full rounded-md bg-background/60 border border-gold/20 px-3 py-2 text-sm"
                />
              </div>
            </div>
            <div className="md:col-span-2">
              <label className="text-xs uppercase tracking-widest text-muted-foreground">Reason (optional)</label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                className="mt-1 w-full rounded-md bg-background/60 border border-gold/20 px-3 py-2 text-sm"
              />
            </div>
            <div className="md:col-span-2 flex justify-end">
              <Button
                className="bg-gradient-gold text-primary-foreground"
                disabled={!startDate || !endDate || submitMut.isPending}
                onClick={() => submitMut.mutate()}
              >
                {submitMut.isPending ? "Submitting…" : "Submit Request"}
              </Button>
            </div>
          </div>
        </Panel>
      )}

      <div className={`grid gap-6 ${isManager ? "lg:grid-cols-2" : ""}`}>
        <Panel title="My Requests">
          {myLeave.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">No leave requests yet.</div>
          ) : (
            <div className="space-y-2">
              {myLeave.map((r) => (
                <div key={r.id} className="rounded-lg border border-gold/15 bg-surface/40 p-3 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-foreground capitalize">
                      {r.leave_type} · {daysBetween(r.start_date, r.end_date)}d
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {r.start_date} → {r.end_date}
                    </div>
                    {r.approver_notes && (
                      <div className="text-xs text-muted-foreground mt-1 italic">"{r.approver_notes}"</div>
                    )}
                  </div>
                  <span className={`text-[10px] uppercase tracking-widest px-2 py-1 rounded border ${STATUS_COLOR[r.status]}`}>
                    {r.status}
                  </span>
                  {r.status === "pending" && (
                    <button
                      onClick={() => cancelMut.mutate(r.id)}
                      className="text-xs text-muted-foreground hover:text-destructive"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </Panel>

        {isManager && (
          <Panel title="Team Requests">
            {teamLeave.length === 0 ? (
              <div className="py-10 text-center text-sm text-muted-foreground">No requests to review.</div>
            ) : (
              <div className="space-y-2">
                {teamLeave.map((r) => (
                  <div key={r.id} className="rounded-lg border border-gold/15 bg-surface/40 p-3">
                    <div className="flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="text-sm text-foreground">
                          {nameOf(r.user_id)}{" "}
                          <span className="text-muted-foreground capitalize">· {r.leave_type}</span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {r.start_date} → {r.end_date} · {daysBetween(r.start_date, r.end_date)}d
                        </div>
                      </div>
                      <span className={`text-[10px] uppercase tracking-widest px-2 py-1 rounded border ${STATUS_COLOR[r.status]}`}>
                        {r.status}
                      </span>
                    </div>
                    {r.reason && (
                      <div className="text-xs text-muted-foreground mt-2 italic">"{r.reason}"</div>
                    )}
                    {r.status === "pending" && (
                      <div className="mt-2 flex gap-2 justify-end">
                        <button
                          onClick={() => decideMut.mutate({ id: r.id, status: "rejected" })}
                          className="text-xs px-2 py-1 rounded border border-rose-300/30 text-rose-300 hover:bg-rose-300/10"
                        >
                          <X className="size-3 inline mr-1" />Reject
                        </button>
                        <button
                          onClick={() => decideMut.mutate({ id: r.id, status: "approved" })}
                          className="text-xs px-2 py-1 rounded border border-emerald-300/30 text-emerald-300 hover:bg-emerald-300/10"
                        >
                          <Check className="size-3 inline mr-1" />Approve
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Panel>
        )}
      </div>
    </div>
  );
}
