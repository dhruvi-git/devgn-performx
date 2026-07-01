import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import { Award, Sparkles, Heart, Users, Star, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { PageHeader, Panel, KpiCard } from "@/components/app/Panels";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { giveKudos } from "@/lib/kudos.functions";
import { motion } from "framer-motion";

export const Route = createFileRoute("/app/feedback")({
  head: () => ({ meta: [{ title: "Recognition · PerformX" }] }),
  component: FeedbackPage,
});

type KudosRow = {
  id: string;
  giver_id: string;
  receiver_id: string;
  category: "teamwork" | "innovation" | "excellence" | "leadership" | "customer_focus";
  message: string;
  created_at: string;
};

type Dir = { id: string; full_name: string; job_title: string | null };

const CATEGORY_META: Record<KudosRow["category"], { label: string; icon: typeof Award; color: string }> = {
  teamwork: { label: "Teamwork", icon: Users, color: "text-sky-300" },
  innovation: { label: "Innovation", icon: Sparkles, color: "text-purple-300" },
  excellence: { label: "Excellence", icon: Award, color: "text-gold" },
  leadership: { label: "Leadership", icon: Star, color: "text-amber-300" },
  customer_focus: { label: "Customer Focus", icon: Heart, color: "text-rose-300" },
};

function FeedbackPage() {
  const { profile } = useAuth();
  const qc = useQueryClient();
  const send = useServerFn(giveKudos);

  const [receiver, setReceiver] = useState<string>("");
  const [category, setCategory] = useState<KudosRow["category"]>("excellence");
  const [message, setMessage] = useState("");

  const { data: kudos = [] } = useQuery({
    queryKey: ["kudos"],
    queryFn: async () => {
      const { data } = await supabase
        .from("kudos")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      return (data ?? []) as KudosRow[];
    },
  });

  const { data: directory = [] } = useQuery({
    queryKey: ["directory"],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id, full_name, job_title")
        .order("full_name");
      return (data ?? []) as Dir[];
    },
  });

  const nameOf = useMemo(() => {
    const m = new Map<string, string>();
    for (const d of directory) m.set(d.id, d.full_name || "Member");
    return (id: string) => m.get(id) ?? "Team member";
  }, [directory]);

  const receivedCount = useMemo(
    () => kudos.filter((k) => k.receiver_id === profile?.id).length,
    [kudos, profile?.id],
  );
  const givenCount = useMemo(
    () => kudos.filter((k) => k.giver_id === profile?.id).length,
    [kudos, profile?.id],
  );

  const sendMut = useMutation({
    mutationFn: async () =>
      send({ data: { receiver_id: receiver, category, message } }),
    onSuccess: () => {
      toast.success("Kudos sent — thank you for recognizing greatness.");
      setMessage("");
      setReceiver("");
      qc.invalidateQueries({ queryKey: ["kudos"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="p-6 md:p-10">
      <PageHeader
        eyebrow="Culture · Recognition"
        title="Kudos & Feedback"
        subtitle="Celebrate excellence across Devgn Cinex. A single note of recognition can reshape a career."
      />

      <div className="grid gap-4 md:grid-cols-3 mb-8">
        <KpiCard label="Received" value={String(receivedCount)} icon={Award} accent />
        <KpiCard label="Given" value={String(givenCount)} icon={Sparkles} />
        <KpiCard label="Wall total" value={String(kudos.length)} icon={Heart} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <Panel title="Recognition Wall">
          {kudos.length === 0 ? (
            <div className="py-16 text-center text-sm text-muted-foreground">
              No kudos yet — be the first to recognize a teammate.
            </div>
          ) : (
            <div className="space-y-3">
              {kudos.map((k) => {
                const meta = CATEGORY_META[k.category];
                const Icon = meta.icon;
                return (
                  <motion.div
                    key={k.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-xl border border-gold/15 bg-surface/40 p-4"
                  >
                    <div className="flex items-start gap-3">
                      <div className="size-10 rounded-lg bg-gold/10 border border-gold/30 flex items-center justify-center shrink-0">
                        <Icon className={`size-5 ${meta.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm text-foreground">
                          <span className="text-gold">{nameOf(k.giver_id)}</span>
                          <span className="text-muted-foreground"> recognized </span>
                          <span className="text-foreground">{nameOf(k.receiver_id)}</span>
                        </div>
                        <div className="text-xs uppercase tracking-widest text-muted-foreground mt-1">
                          {meta.label} · {new Date(k.created_at).toLocaleDateString()}
                        </div>
                        <p className="mt-2 text-sm text-foreground/90">{k.message}</p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </Panel>

        <Panel title="Give Kudos">
          <div className="space-y-3">
            <div>
              <label className="text-xs uppercase tracking-widest text-muted-foreground">Recipient</label>
              <select
                value={receiver}
                onChange={(e) => setReceiver(e.target.value)}
                className="mt-1 w-full rounded-md bg-background/60 border border-gold/20 px-3 py-2 text-sm"
              >
                <option value="">Select a teammate…</option>
                {directory
                  .filter((d) => d.id !== profile?.id)
                  .map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.full_name}
                      {d.job_title ? ` · ${d.job_title}` : ""}
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label className="text-xs uppercase tracking-widest text-muted-foreground">Category</label>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {(Object.keys(CATEGORY_META) as KudosRow["category"][]).map((c) => {
                  const meta = CATEGORY_META[c];
                  const Icon = meta.icon;
                  const active = category === c;
                  return (
                    <button
                      key={c}
                      onClick={() => setCategory(c)}
                      className={`flex items-center gap-2 rounded-md border px-2.5 py-2 text-xs transition ${
                        active
                          ? "border-gold/50 bg-gold/10 text-gold"
                          : "border-gold/15 text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <Icon className="size-3.5" />
                      {meta.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="text-xs uppercase tracking-widest text-muted-foreground">Message</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
                maxLength={500}
                placeholder="Share what made their work exceptional…"
                className="mt-1 w-full rounded-md bg-background/60 border border-gold/20 px-3 py-2 text-sm"
              />
              <div className="text-right text-[10px] text-muted-foreground mt-1">
                {message.length}/500
              </div>
            </div>

            <Button
              className="w-full bg-gradient-gold text-primary-foreground"
              disabled={!receiver || message.trim().length < 3 || sendMut.isPending}
              onClick={() => sendMut.mutate()}
            >
              <Send className="size-4 mr-2" />
              {sendMut.isPending ? "Sending…" : "Send Kudos"}
            </Button>
          </div>
        </Panel>
      </div>
    </div>
  );
}
