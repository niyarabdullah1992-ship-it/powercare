import React, { useState, useRef, useEffect } from "react";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/PowerCareAuth";
import { base44 } from "@/api/base44Client";
import { buildAssistantContext } from "@/lib/assistantContext";
import { executeAssistantAction } from "@/lib/assistantActions";
import AssistantMessage from "@/components/assistant/AssistantMessage";
import SuggestedQuestions from "@/components/assistant/SuggestedQuestions";
import { Sparkles, Send, Loader2 } from "lucide-react";

export default function Assistant() {
  const { t } = useI18n();
  const { data, currentUser, company } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  if (!data || !currentUser) return null;

  const ask = async (question) => {
    const q = question.trim();
    if (!q || loading) return;
    setInput("");
    const nextMessages = [...messages, { role: "user", text: q }];
    setMessages(nextMessages);
    setLoading(true);
    try {
      const context = buildAssistantContext(data, currentUser);
      const history = nextMessages.slice(-8).map((m) => `${m.role === "user" ? "User" : "Assistant"}: ${m.text}`).join("\n");
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `You are PowerCare's smart operations assistant for power/water station management.
You answer questions from "${currentUser.name}" (role: ${currentUser.role}) about their company's stations, employees, tasks, daily reports and safety — and you can EXECUTE real actions.

AVAILABLE ACTIONS (include them in "actions" when the user asks you to do something):
- {"type":"export_data","dataset":"employees"|"tasks"|"reports"|"stations"|"safety"} — downloads the data as an Excel-compatible file. If the user asks for Excel/export of data, USE THIS.
- {"type":"create_task","title":"...","description":"...","station":"<station name>","assignee":"<employee name>","dailyTarget":1} — creates a new task.
- {"type":"update_task_status","taskTitle":"<existing task title>","newStatus":"pending"|"in_progress"|"completed"|"stopped"} — changes a task's status.

Rules:
- When the user asks you to DO something covered by an action, include it in "actions" and confirm briefly in "answer". Never say you can't export or execute — you can.
- Answer ONLY based on the company data below. If the data doesn't contain the answer, say so briefly.
- ALWAYS answer in the same language as the user's question (Arabic questions get Arabic answers).
- Be concise and practical. Use short bullet points, bold key numbers/names. Use markdown in "answer".
- When asked for a summary, group by station and call out problems (stopped tasks, pending reports, red safety levels, low performance).

COMPANY DATA (JSON):
${JSON.stringify(context)}

CONVERSATION SO FAR:
${history}

Answer the last user question.`,
        response_json_schema: {
          type: "object",
          properties: {
            answer: { type: "string" },
            actions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  type: { type: "string" },
                  dataset: { type: "string" },
                  title: { type: "string" },
                  description: { type: "string" },
                  station: { type: "string" },
                  assignee: { type: "string" },
                  dailyTarget: { type: "number" },
                  taskTitle: { type: "string" },
                  newStatus: { type: "string" },
                },
              },
            },
          },
          required: ["answer"],
        },
      });
      let text = res?.answer || "";
      for (const action of res?.actions || []) {
        const result = executeAssistantAction(action, { data, company, currentUser, t });
        text += `\n\n${result.ok ? "✅" : "⚠️"} ${result.message}`;
      }
      setMessages((prev) => [...prev, { role: "assistant", text }]);
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", text: t("aiError") }]);
    }
    setLoading(false);
  };

  return (
    <div className="max-w-3xl mx-auto flex flex-col h-[calc(100vh-8rem)]">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-9 h-9 rounded-full bg-accent/15 flex items-center justify-center">
          <Sparkles className="w-5 h-5 text-accent" />
        </div>
        <div>
          <h1 className="font-heading text-2xl font-semibold">{t("aiAssistant")}</h1>
          <p className="text-xs text-muted-foreground font-body">{t("aiAssistantDesc")}</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 pb-4">
        {messages.length === 0 && (
          <div className="p-5 rounded-xl border border-border bg-card space-y-3">
            <p className="text-sm font-body text-muted-foreground">{t("aiIntro")}</p>
            <SuggestedQuestions onPick={ask} disabled={loading} />
          </div>
        )}
        {messages.map((m, i) => (
          <AssistantMessage key={i} message={m} />
        ))}
        {loading && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground font-body px-2">
            <Loader2 className="w-4 h-4 animate-spin text-accent" /> {t("aiThinking")}
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <form
        onSubmit={(e) => { e.preventDefault(); ask(input); }}
        className="flex items-center gap-2 pt-3 border-t border-border"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t("aiPlaceholder")}
          dir="auto"
          className="flex-1 px-4 py-2.5 rounded-md border border-input bg-card text-sm font-body focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="p-2.5 rounded-md bg-foreground text-background hover:bg-accent disabled:opacity-50"
          aria-label={t("send")}
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}