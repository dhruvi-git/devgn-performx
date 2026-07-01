import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const CATEGORY = z.enum(["teamwork", "innovation", "excellence", "leadership", "customer_focus"]);

export const giveKudos = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({
      receiver_id: z.string().uuid(),
      category: CATEGORY.default("excellence"),
      message: z.string().min(3).max(500),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    if (data.receiver_id === context.userId) {
      throw new Error("You cannot give kudos to yourself.");
    }
    const { data: row, error } = await context.supabase
      .from("kudos")
      .insert({
        giver_id: context.userId,
        receiver_id: data.receiver_id,
        category: data.category,
        message: data.message,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return row;
  });
