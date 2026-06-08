import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

async function buildContext() {
  try {
    const [{ data: depts }, { data: scores }, { data: tasks }] = await Promise.all([
      supabaseAdmin.from("departments").select("name, kpi_weight"),
      supabaseAdmin.from("performance_scores").select("user_id, final_score, on_time_rate, tasks_completed, period_start").order("period_start", { ascending: false }).limit(50),
      supabaseAdmin.from("tasks").select("status, priority, due_date").limit(200),
    ]);
    const taskCounts = (tasks ?? []).reduce<Record<string, number>>((acc, t) => {
      acc[t.status as string] = (acc[t.status as string] ?? 0) + 1;
      return acc;
    }, {});
    return JSON.stringify({
      departments: depts ?? [],
      recent_scores: scores ?? [],
      task_status_counts: taskCounts,
    });
  } catch {
    return "{}";
  }
}

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = (await request.json()) as { messages?: UIMessage[] };
        if (!Array.isArray(body.messages)) {
          return new Response("messages required", { status: 400 });
        }
        const key = process.env.LOVABLE_API_KEY;
        if (!key) return new Response("Missing LOVABLE_API_KEY", { status: 500 });

        const ctx = await buildContext();
        const gateway = createLovableAiGatewayProvider(key);
        const result = streamText({
          model: gateway("google/gemini-3-flash-preview"),
          system: `You are PerformX AI, the workforce intelligence co-pilot for Devgn Cinex.
You analyze employee performance, department KPIs, task completion, and workforce trends.
Speak with executive precision — concise, data-driven, premium tone. Use bullet lists for findings.
When asked about specific data, ground answers in this live workforce snapshot:
${ctx}`,
          messages: await convertToModelMessages(body.messages),
        });
        return result.toUIMessageStreamResponse();
      },
    },
  },
});
