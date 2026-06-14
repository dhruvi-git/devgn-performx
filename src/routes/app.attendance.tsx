import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo } from "react";
import { Clock, LogIn, LogOut, Calendar, TrendingUp, Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { PageHeader } from "@/components/app/Panels";
import { checkIn, checkOut } from "@/lib/attendance.functions";
import { downloadCSV } from "@/lib/export";

export const Route = createFileRoute("/app/attendance")({
  head: () => ({ meta: [{ title: "Attendance · PerformX" }] }),
  component: AttendancePage,
});

type Att = {
  id: string;
  work_date: string;
  check_in: string | null;
  check_out: string | null;
  status: "present" | "late" | "absent" | "remote" | "leave";
  hours_worked: number | null;
  notes: string | null;
};

function AttendancePage() {
  const { profile } = useAuth();
  const qc = useQueryClient();
  const doCheckIn = useServerFn(checkIn);
  const doCheckOut = useServerFn(checkOut);

  const { data: records = [] } = useQuery({
    queryKey: ["attendance", profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];
      const since = new Date();
      since.setDate(since.getDate() - 30);
      const { data } = await supabase
        .from("attendance")
        .select("*")
        .eq("user_id", profile.id)
        .gte("work_date", since.toISOString().slice(0, 10))
        .order("work_date", { ascending: false });
      return (data ?? []) as Att[];
    },
    enabled: !!profile?.id,
  });

  const today = new Date().toISOString().slice(0, 10);
  const todayRow = records.find((r) => r.work_date === today);

  const checkInMut = useMutation({
    mutationFn: async () => doCheckIn({ data: {} }),
    onSuccess: () => { toast.success("Checked in"); qc.invalidateQueries({ queryKey: ["attendance"] }); },
    onError: (e: Error) => toast.error(e.message),
  });
  const checkOutMut = useMutation({
    mutationFn: async () => doCheckOut(),
    onSuccess: () => { toast.success("Checked out"); qc.invalidateQueries({ queryKey: ["attendance"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  const stats = useMemo(() => {
    const total = records.length;
    const present = records.filter((r) => r.status === "present").length;
    const late = records.filter((r) => r.status === "late").length;
    const hours = records.reduce((s, r) => s + Number(r.hours_worked ?? 0), 0);
    const rate = total ? Math.round((present / total) * 100) : 0;
    return { total, present, late, hours: hours.toFixed(1), rate };
  }, [records]);

  const exportCsv = () => {
    downloadCSV(
      `attendance-${today}.csv`,
      records.map((r) => ({
        Date: r.work_date,
        Status: r.status,
        "Check In": r.check_in ?? "",
        "Check Out": r.check_out ?? "",
        "Hours Worked": r.hours_worked ?? "",
        Notes: r.notes ?? "",
      })),
    );
  };

  return (
    <div className="p-8 space-y-6">
      <PageHeader
        eyebrow="Time Intelligence"
        title="Attendance & Time Tracking"
        subtitle="Daily check-ins, hours worked, and 30-day history."
      />

      {/* Today card */}
      <div className="glass-elevated rounded-3xl p-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className="text-xs uppercase tracking-[0.3em] text-gold/70">Today</div>
            <div className="text-2xl font-serif mt-1">
              {new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {todayRow?.check_in ? `Checked in at ${new Date(todayRow.check_in).toLocaleTimeString()}` : "Not checked in yet"}
              {todayRow?.check_out && ` · Out at ${new Date(todayRow.check_out).toLocaleTimeString()}`}
              {todayRow?.hours_worked && ` · ${todayRow.hours_worked}h worked`}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              onClick={() => checkInMut.mutate()}
              disabled={!!todayRow?.check_in || checkInMut.isPending}
              className="bg-gradient-gold text-primary-foreground hover:opacity-90"
            >
              <LogIn className="size-4" /> Check In
            </Button>
            <Button
              onClick={() => checkOutMut.mutate()}
              disabled={!todayRow?.check_in || !!todayRow?.check_out || checkOutMut.isPending}
              variant="outline"
              className="border-gold/40"
            >
              <LogOut className="size-4" /> Check Out
            </Button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={<Calendar className="size-4" />} label="Days Tracked" value={stats.total} />
        <StatCard icon={<TrendingUp className="size-4" />} label="Present Rate" value={`${stats.rate}%`} accent />
        <StatCard icon={<Clock className="size-4" />} label="Hours (30d)" value={stats.hours} />
        <StatCard icon={<Clock className="size-4" />} label="Late Days" value={stats.late} />
      </div>

      {/* History */}
      <div className="glass rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-medium">30-Day History</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Most recent records first</p>
          </div>
          <Button variant="outline" size="sm" onClick={exportCsv} className="border-gold/40">
            <Download className="size-3" /> Export CSV
          </Button>
        </div>
        <div className="space-y-1">
          {records.length === 0 && (
            <div className="text-sm text-muted-foreground py-8 text-center">No attendance recorded yet.</div>
          )}
          {records.map((r) => (
            <div key={r.id} className="flex items-center justify-between gap-4 rounded-lg border border-gold/10 bg-surface/40 px-4 py-3">
              <div className="flex items-center gap-4 flex-1 min-w-0">
                <div className="text-sm font-medium w-28">
                  {new Date(r.work_date).toLocaleDateString(undefined, { month: "short", day: "numeric", weekday: "short" })}
                </div>
                <StatusBadge status={r.status} />
              </div>
              <div className="hidden md:flex items-center gap-6 text-xs text-muted-foreground">
                <span>In: {r.check_in ? new Date(r.check_in).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—"}</span>
                <span>Out: {r.check_out ? new Date(r.check_out).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—"}</span>
                <span className="text-gold/80 w-12 text-right">{r.hours_worked ? `${r.hours_worked}h` : "—"}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, accent }: { icon: React.ReactNode; label: string; value: string | number; accent?: boolean }) {
  return (
    <div className="glass rounded-2xl p-5">
      <div className={`inline-flex items-center gap-2 text-xs ${accent ? "text-gold" : "text-muted-foreground"}`}>
        {icon}<span className="uppercase tracking-wider">{label}</span>
      </div>
      <div className={`text-3xl font-serif mt-2 ${accent ? "text-gold" : ""}`}>{value}</div>
    </div>
  );
}

function StatusBadge({ status }: { status: Att["status"] }) {
  const styles: Record<Att["status"], string> = {
    present: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    late: "bg-amber-500/15 text-amber-400 border-amber-500/30",
    absent: "bg-destructive/15 text-destructive border-destructive/30",
    remote: "bg-sky-500/15 text-sky-400 border-sky-500/30",
    leave: "bg-muted/30 text-muted-foreground border-muted/30",
  };
  return (
    <span className={`text-[10px] uppercase tracking-wider px-2 py-1 rounded-full border ${styles[status]}`}>
      {status}
    </span>
  );
}
