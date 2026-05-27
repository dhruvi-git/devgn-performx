import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Sparkles, Send } from "lucide-react";
import { PageHeader } from "@/components/app/Panels";

export const Route = createFileRoute("/app/ai")({
  head: () => ({ meta: [{ title: "AI Assistant · PerformX" }] }),
  component: AI,
});

const SUGGESTED = [
  "Who are the top performers this month?",
  "Which employees missed deadlines?",
  "Which department has low productivity?",
  "Show attendance anomalies.",
];

type Msg = { role: "user" | "ai"; text: string };

const CANNED: Record<string, string> = {
  "top performers": "Aarav Mehta (Projects · 96), Priya Singh (Sales · 94) and Rohan Kapoor (IT · 93) are the top three performers in August.",
  "missed deadlines": "4 employees missed deadlines this week — Dev P. (2), Meera N. (1), Karan R. (1), Sneha M. (1).",
  "low productivity": "Legal is trailing at 82. Recommend redistributing 2 active matters and a wellness check-in.",
  "attendance": "Hospitality dipped 4% in week 2. Three employees show early burnout signals — recommend wellness check-ins.",
};

function reply(q: string) {
  const lq = q.toLowerCase();
  const hit = Object.entries(CANNED).find(([k]) => lq.includes(k));
  return hit ? hit[1] : "I've analyzed the latest workforce signals. Productivity is up 12% MoM with IT and Sales leading; Legal needs attention.";
}

function AI() {
  const [msgs, setMsgs] = useState<Msg[]>([
    { role: "ai", text: "I'm your PerformX AI co-pilot. Ask me anything about your workforce, KPIs or departments." },
  ]);
  const [input, setInput] = useState("");

  const send = (text: string) => {
    if (!text.trim()) return;
    setMsgs((m) => [...m, { role: "user", text }, { role: "ai", text: reply(text) }]);
    setInput("");
  };

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <PageHeader eyebrow="AI Assistant" title="Ask the workforce co-pilot" subtitle="Powered by PerformX intelligence." />

      <div className="glass-elevated rounded-3xl p-6 gold-glow min-h-[500px] flex flex-col">
        <div className="flex-1 space-y-4 overflow-y-auto">
          {msgs.map((m, i) => (
            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-xl rounded-2xl px-4 py-3 text-sm ${
                m.role === "user"
                  ? "glass text-foreground"
                  : "border border-gold/30 bg-gold/5 text-foreground/90"
              }`}>
                {m.role === "ai" && (
                  <div className="flex items-center gap-2 text-xs text-gold mb-1">
                    <Sparkles className="size-3" /> PerformX AI
                  </div>
                )}
                {m.text}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6">
          <div className="flex flex-wrap gap-2 mb-3">
            {SUGGESTED.map((s) => (
              <button
                key={s}
                onClick={() => send(s)}
                className="text-xs rounded-full glass px-3 py-1.5 hover:border-gold/40 transition"
              >
                {s}
              </button>
            ))}
          </div>
          <form
            onSubmit={(e) => { e.preventDefault(); send(input); }}
            className="flex gap-2"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about performance, KPIs, departments..."
              className="flex-1 rounded-lg bg-surface/60 border border-gold/20 px-4 py-3 text-sm focus:outline-none focus:border-gold/60 focus:ring-2 focus:ring-gold/20"
            />
            <button type="submit" className="rounded-lg bg-gradient-gold px-5 text-primary-foreground gold-glow">
              <Send className="size-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
