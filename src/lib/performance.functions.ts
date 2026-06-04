import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const recalculateScore = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        user_id: z.string().uuid(),
        period_start: z.string(),
        period_end: z.string(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    // Permission: only managers/admins, or self
    if (data.user_id !== context.userId) {
      const { data: roles } = await context.supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", context.userId);
      const allowed = (roles ?? []).some((r) =>
        ["super_admin", "hod", "team_lead"].includes(r.role as string),
      );
      if (!allowed) throw new Error("Forbidden");
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error } = await supabaseAdmin.rpc("recalculate_performance_score", {
      _user_id: data.user_id,
      _period_start: data.period_start,
      _period_end: data.period_end,
    });
    if (error) throw new Error(error.message);
    return row;
  });
