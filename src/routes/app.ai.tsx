import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Sparkles, Send, Loader2 } from "lucide-react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { PageHeader } from "@/components/app/Panels";

export const Route = createFileRoute("/app/ai")({
  head: () => ({ meta: [{ title: "AI Assistant · PerformX" }] }),
  component: AI,
});

const SUGGESTED = [
  "Who are the top performers this month?",
  "Which departments are at risk?",
  "Summarize task completion trends.",
  "Recommend workforce optimizations.",
];

function AI() {
  const [input, setInput] = useState("");
  const { messages, sendMessage, status, error } = useChat({
    transport: new DefaultChatTransport({ api: "/api/chat" }),
  });
  const isLoading = status === "submitted" || status === "streaming";

  const send = async (text: string) => {
    if (!text.trim() || isLoading) return;
    setInput("");
    await sendMessage({ text: text.trim() });
  };

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <PageHeader
        eyebrow="AI Co-Pilot"
        title="Workforce Intelligence Assistant"
        subtitle="Powered by PerformX AI — grounded in live workforce data."
      />

      <div className="glass-elevated rounded-3xl p-6 gold-glow min-h-[560px] flex flex-col">
        <div className="flex-1 space-y-4 overflow-y-auto pr-2">
          {messages.length === 0 && (
            <div className="flex justify-start">
              <div className="max-w-xl rounded-2xl px-4 py-3 text-sm border border-gold/30 bg-gold/5 text-foreground/90">
                <div className="flex items-center gap-2 text-xs text-gold mb-1">
                  <Sparkles className="size-3" /> PerformX AI
                </div>
                Welcome. Ask me about performance trends, burnout signals, or department KPIs.
              </div>
            </div>
          )}
          {messages.map((m) => {
            const text = m.parts.map((p) => (p.type === "text" ? p.text : "")).join("");
            const isUser = m.role === "user";
            return (
              <div key={m.id} className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-xl rounded-2xl px-4 py-3 text-sm whitespace-pre-wrap ${
                    isUser
                      ? "bg-gradient-gold text-primary-foreground"
                      : "border border-gold/30 bg-gold/5 text-foreground/90"
                  }`}
                >
                  {!isUser && (
                    <div className="flex items-center gap-2 text-xs text-gold mb-1">
                      <Sparkles className="size-3" /> PerformX AI
                    </div>
                  )}
                  {text || (isLoading && !isUser ? "…" : "")}
                </div>
              </div>
            );
          })}
          {isLoading && (
            <div className="flex justify-start">
              <div className="rounded-2xl px-4 py-3 text-sm border border-gold/30 bg-gold/5 text-gold/80 flex items-center gap-2">
                <Loader2 className="size-3 animate-spin" /> Thinking…
              </div>
            </div>
          )}
          {error && (
            <div className="text-xs text-destructive">
              {error.message.includes("429")
                ? "Rate limit reached. Please wait a moment."
                : error.message.includes("402")
                ? "AI credits exhausted. Add credits to continue."
                : "AI request failed. Please retry."}
            </div>
          )}
        </div>

        <div className="mt-6">
          <div className="flex flex-wrap gap-2 mb-3">
            {SUGGESTED.map((s) => (
              <button
                key={s}
                onClick={() => send(s)}
                disabled={isLoading}
                className="text-xs rounded-full glass px-3 py-1.5 hover:border-gold/40 transition disabled:opacity-50"
              >
                {s}
              </button>
            ))}
          </div>
          <form
            onSubmit={(e) => { e.preventDefault(); void send(input); }}
            className="flex items-center gap-2 glass rounded-2xl p-2"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about your workforce…"
              className="flex-1 bg-transparent px-3 py-2 text-sm focus:outline-none placeholder:text-muted-foreground/60"
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="size-9 rounded-xl bg-gradient-gold flex items-center justify-center text-primary-foreground disabled:opacity-40"
            >
              {isLoading ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
