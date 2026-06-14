import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const checkIn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ notes: z.string().optional() }).parse(d))
  .handler(async ({ data, context }) => {
    const today = new Date().toISOString().slice(0, 10);
    const now = new Date();
    const lateCutoff = new Date(now);
    lateCutoff.setHours(9, 30, 0, 0);
    const status = now > lateCutoff ? "late" : "present";
    const { data: row, error } = await context.supabase
      .from("attendance")
      .upsert(
        { user_id: context.userId, work_date: today, check_in: now.toISOString(), status, notes: data.notes ?? null },
        { onConflict: "user_id,work_date" },
      )
      .select()
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const checkOut = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const today = new Date().toISOString().slice(0, 10);
    const { data: row, error } = await context.supabase
      .from("attendance")
      .update({ check_out: new Date().toISOString() })
      .eq("user_id", context.userId)
      .eq("work_date", today)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return row;
  });
