import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { generateText, Output } from "ai";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const generateMonthlySummary = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ user_id: z.string().uuid().optional() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { createLovableAiGatewayProvider } = await import("@/lib/ai-gateway.server");
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("Missing LOVABLE_API_KEY");

    const targetUserId = data.user_id ?? context.userId;
    const [{ data: profile }, { data: scores }, { data: tasks }] = await Promise.all([
      supabaseAdmin.from("profiles").select("full_name, job_title").eq("id", targetUserId).maybeSingle(),
      supabaseAdmin.from("performance_scores").select("*").eq("user_id", targetUserId).order("period_start", { ascending: false }).limit(6),
      supabaseAdmin.from("tasks").select("title, status, priority, weight, due_date, completed_at").eq("assignee_id", targetUserId).limit(40),
    ]);

    const gateway = createLovableAiGatewayProvider(key);
    const { output } = await generateText({
      model: gateway("google/gemini-3-flash-preview"),
      output: Output.object({
        schema: z.object({
          headline: z.string(),
          highlights: z.array(z.string()).max(5),
          risks: z.array(z.string()).max(5),
          recommendations: z.array(z.string()).max(5),
        }),
      }),
      prompt: `Generate a concise executive monthly performance summary for ${profile?.full_name ?? "this employee"} (${profile?.job_title ?? "team member"}).
Recent scores: ${JSON.stringify(scores ?? [])}
Tasks snapshot: ${JSON.stringify(tasks ?? [])}
Return crisp, actionable insights in luxury enterprise tone.`,
    });
    return output;
  });

export const detectBurnoutSignals = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    // Manager check
    const { data: roles } = await supabaseAdmin.from("user_roles").select("role").eq("user_id", context.userId);
    const allowed = (roles ?? []).some((r) => ["super_admin", "hod", "team_lead"].includes(r.role as string));
    if (!allowed) throw new Error("Forbidden");

    const since = new Date(); since.setDate(since.getDate() - 30);
    const { data: tasks } = await supabaseAdmin
      .from("tasks")
      .select("assignee_id, status, priority, due_date, created_at, completed_at, weight")
      .gte("created_at", since.toISOString());
    const { data: profiles } = await supabaseAdmin.from("profiles").select("id, full_name, job_title");

    const byUser = new Map<string, { load: number; overdue: number; high: number; completed: number }>();
    const now = Date.now();
    for (const t of tasks ?? []) {
      if (!t.assignee_id) continue;
      const s = byUser.get(t.assignee_id) ?? { load: 0, overdue: 0, high: 0, completed: 0 };
      s.load += Number(t.weight ?? 1);
      if (t.priority === "high" || t.priority === "critical") s.high += 1;
      if (t.status !== "done" && t.due_date && new Date(t.due_date).getTime() < now) s.overdue += 1;
      if (t.status === "done") s.completed += 1;
      byUser.set(t.assignee_id, s);
    }
    const signals = Array.from(byUser.entries())
      .map(([uid, s]) => {
        const prof = (profiles ?? []).find((p) => p.id === uid);
        const burnoutScore = Math.min(100, s.load * 0.6 + s.overdue * 12 + s.high * 4 - s.completed * 2);
        return {
          user_id: uid,
          name: prof?.full_name ?? "Unknown",
          job_title: prof?.job_title ?? "",
          load: s.load,
          overdue: s.overdue,
          high_priority: s.high,
          completed: s.completed,
          burnout_score: Math.max(0, Math.round(burnoutScore)),
          severity: burnoutScore > 70 ? "critical" : burnoutScore > 45 ? "elevated" : "normal",
        };
      })
      .sort((a, b) => b.burnout_score - a.burnout_score);
    return { signals };
  });
