import React, { useState, useRef, useEffect } from "react";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/PowerCareAuth";
import { base44 } from "@/api/base44Client";
import { buildAssistantContext } from "@/lib/assistantContext";
import { executeAssistantAction } from "@/lib/assistantActions";
import AssistantMessage from "@/components/assistant/AssistantMessage";
import SuggestedQuestions from "@/components/assistant/SuggestedQuestions";
import VoiceControl from "@/components/assistant/VoiceControl";
import { Sparkles, Send, Loader2 } from "lucide-react";

export default function Assistant() {
  const { t } = useI18n();
  const { data, currentUser, company } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);
  const loadedConversationRef = useRef("");
  const conversationKey = company?.id && currentUser?.id
    ? `powercare_niro_${company.id}_${currentUser.id}`
    : "";

  useEffect(() => {
    if (!conversationKey) return;
    try {
      const saved = JSON.parse(localStorage.getItem(conversationKey) || "[]");
      setMessages(Array.isArray(saved) ? saved.slice(-20) : []);
    } catch {
      setMessages([]);
    }
    loadedConversationRef.current = conversationKey;
  }, [conversationKey]);

  useEffect(() => {
    if (!conversationKey || loadedConversationRef.current !== conversationKey) return;
    localStorage.setItem(conversationKey, JSON.stringify(messages.slice(-20)));
  }, [messages, conversationKey]);

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
      try {
        const employeeIds = context.employees.map((e) => e.id);
        if (employeeIds.length) {
          const attendanceRes = await base44.functions.invoke("supabaseAttendance", { action: "listDaily", employeeIds });
          context.attendanceToday = attendanceRes?.data?.rows || [];
        }
      } catch {
        context.attendanceToday = [];
      }
      const history = nextMessages.slice(-8).map((m) => `${m.role === "user" ? "User" : "Assistant"}: ${m.text}`).join("\n");
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `You are "Niro" (Arabic: نيرو) — PowerCare's smart operations assistant for power/water station management. When asked about your name or identity, you are Niro (نيرو).
You answer questions from "${currentUser.name}" (role: ${currentUser.role}) about their company's stations, employees, tasks, daily reports and safety — and you can EXECUTE real actions.

AVAILABLE ACTIONS (include them in "actions" when the user asks you to do something):
- {"type":"export_data","dataset":"employees"|"tasks"|"targets"|"reports"|"stations"|"safety"|"plans"|"schedules"|"complaints"|"files"|"hr"|"leaves"|"certificates"|"performance"|"attendance","format":"excel"|"pdf","reportTitle":"<title in the user's language>"} — exports any permitted site dataset WITHOUT a signature. "excel" downloads an Excel-compatible file; "pdf" opens a brand-styled printable report. Use ONLY when the user does NOT mention signing.
- {"type":"create_task","title":"...","description":"...","station":"<station name>","assignee":"<employee name>","dailyTarget":1} — creates a new task.
- {"type":"update_task_status","taskTitle":"<existing task title>","newStatus":"pending"|"in_progress"|"completed"|"stopped"} — changes a task's status.
- {"type":"sign_report","dataset":"employees"|"tasks"|"targets"|"reports"|"stations"|"safety"|"plans"|"schedules"|"complaints"|"files"|"hr"|"leaves"|"certificates"|"performance"|"attendance","reportTitle":"<title in the user's language>"} — generates the report, stamps the user's SIGNATURE + verified badge (encrypted verification ID + QR code + SHA-256 fingerprint registered in the verification registry) INSIDE the file and downloads the signed PDF automatically.
  CRITICAL: if the user's request contains ANY signing word — sign / توقيع / وقّع / وقع / اعتماد / اعتمد / ختم — you MUST use sign_report (NOT export_data), even though the request also mentions تقرير/PDF. Never combine sign_report with export_data for the same request.
- {"type":"open_page","page":"dashboard"|"tasks"|"attendance"|"reports"|"performance"|"employees"|"stations"|"hr"|"complaints"|"chat"|"files"|"daily_report"|"help"|"signing"|"verify"} — opens a PowerCare section in a NEW TAB. Use this action ONLY for a direct navigation command such as "open", "go to", "افتح", "اذهب" or "انتقل". NEVER use it for a question, explanation, analysis, or merely mentioning a section.

DOCUMENT SIGNING & VERIFICATION (you know this feature well):
- The platform's File Signing section lets every employee save a personal signature, then sign any PDF/image document. Signing stamps a verification badge (encrypted verification ID + QR code) on the document and registers the signed file's SHA-256 fingerprint in a verification registry.
- Anyone can verify a signed document by scanning the badge QR or uploading the file on the verification page — the file's fingerprint is compared to the registry. A match = authentic; a mismatch = tampered or the badge was copied from another file. Even a one-character change after signing is detected.
- Explain signing and verification questions without opening any page. Include open_page only when the user explicitly asks to open or navigate to that page.

Rules:
- When the user asks you to DO something covered by an action, include it in "actions" and confirm briefly in "answer". Never say you can't export or execute — you can.
- If an action request is missing a required detail that cannot be safely inferred (such as which station, employee, task, dataset, or file format), ask exactly one short clarifying question in "answer" and return no actions. Never guess and execute the wrong action.
- Answer ONLY based on the company data below. If the data doesn't contain the answer, say so briefly.
- You understand the complete PowerCare site and all permitted sections in COMPANY DATA: stations, employees, tasks, targets, reports, safety, plans, schedules, attendance, performance, complaints, files, HR, leave and certificates.
- Every analytical/readings section supports exactly two export formats: PDF and Excel. Treat "BDF" as a typo for "PDF". When asked, choose the matching export_data action and dataset.
  If the user requests a blank/empty schedule template (جدول دوام فارغ / نموذج جدول دوام), use export_data with dataset "schedules" and format "pdf" even when there are no schedule records; the app will generate a blank printable template.
- You are also an ANALYST: when asked to analyze any section, compute totals, percentages, completion rates, work hours, attendance/location compliance, top/bottom performers and trends from the data, and present clear insights and recommendations.
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
                  page: { type: "string" },
                  format: { type: "string" },
                  reportTitle: { type: "string" },
                },
              },
            },
          },
          required: ["answer"],
        },
      });
      let text = res?.answer || "";
      // Guaranteed signing: if the user's message contains a signing word, any
      // plain export action is upgraded to a signed report — never rely on the
      // model alone to pick the right action.
      const wantsSign = /توقيع|توقيعي|وق[ّ]?ع|اعتماد|اعتمد|ختم|sign/i.test(q);
      const wantsNavigation = /افتح|اذهب|انتقل|ودني|خذني|روح|open|go to|navigate|take me|öffne|gehe|ouvre|aller à|abre|ve a|abrir|ir para|открой|перейди|開いて|移動して|열어|이동해/i.test(q);
      for (const rawAction of res?.actions || []) {
        if (rawAction.type === "open_page" && !wantsNavigation) continue;
        const action = wantsSign && rawAction.type === "export_data"
          ? { ...rawAction, type: "sign_report" }
          : rawAction;
        let result;
        try {
          result = await executeAssistantAction(action, { data, company, currentUser, t });
        } catch (err) {
          console.error("Assistant action failed:", action?.type, err);
          result = { ok: false, message: t("aiActionFailed") };
        }
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
        <VoiceControl onCommand={ask} />
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