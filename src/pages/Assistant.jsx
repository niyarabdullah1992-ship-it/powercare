import React, { useState, useRef, useEffect } from "react";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/PowerCareAuth";
import { base44 } from "@/api/base44Client";
import { buildAssistantContext } from "@/lib/assistantContext";
import { enrichAssistantContext } from "@/lib/assistantLiveContext";
import { getCompanyToken } from "@/lib/store";
import AssistantMessage from "@/components/assistant/AssistantMessage";
import SuggestedQuestions from "@/components/assistant/SuggestedQuestions";
import VoiceControl from "@/components/assistant/VoiceControl";
import AutomationApprovalCard from "@/components/assistant/AutomationApprovalCard";
import { Sparkles, Send, Loader2 } from "lucide-react";
import speak from "@/components/assistant/speak";

export default function Assistant() {
  const { t, lang } = useI18n();
  const { session, data, currentUser, company } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState(() => new URLSearchParams(window.location.search).get("prompt") || "");
  const [loading, setLoading] = useState(false);
  const [pendingActions, setPendingActions] = useState([]);
  const [approvalLoading, setApprovalLoading] = useState(false);
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

  const ask = async (question, fromVoice = false) => {
    const q = question.trim();
    if (!q || loading || pendingActions.length) return;
    setInput("");
    const nextMessages = [...messages, { role: "user", text: q }];
    setMessages(nextMessages);
    setLoading(true);
    try {
      const context = buildAssistantContext(data, currentUser);
      await enrichAssistantContext(context, { session, data });
      try {
        const employeeIds = context.employees.map((e) => e.id);
        if (employeeIds.length) {
          const attendanceRes = await base44.functions.invoke("supabaseAttendance", {
            action: "listDaily", employeeIds,
            companyId: company.id,
            sessionToken: getCompanyToken(company.id),
          });
          context.attendanceToday = attendanceRes?.data?.rows || [];
        }
      } catch {
        context.attendanceToday = [];
      }
      // Targets/tasks live in the cloud (supabaseTargets) — the ONLY source of
      // truth. Local/demo task lists are discarded up-front so they can never
      // leak into the context, even if the cloud fetch below fails.
      context.targets = [];
      context.tasks = [];
      try {
        const targetsRes = await base44.functions.invoke("supabaseTargets", {
          action: "listTargets",
          companyId: company.id,
          sessionToken: getCompanyToken(company.id),
        });
        const cloudTargets = (targetsRes?.data?.targets || []).map((x) => ({
          title: x.title,
          description: x.description || undefined,
          assignee: data.employees.find((e) => e.id === (x.assignment_id || x.employee_id))?.name || "—",
          station: data.stations.find((s) => s.id === x.station_id)?.name || undefined,
          target: x.task_target,
          completed: x.completed_tasks || 0,
          priority: x.priority,
          startDate: x.start_date,
          deadline: x.end_date,
          status: x.status,
          issues: (Array.isArray(x.comments) ? x.comments : []).filter((c) => c.is_issue).length,
        }));
        // The cloud task system is the ONLY source of truth — old local/demo
        // tasks and targets are discarded so Niro never reports fake tasks.
        context.targets = cloudTargets;
        context.tasks = cloudTargets.map((x) => ({
          title: x.title, status: x.status, progress: x.completed, target: x.target,
          station: x.station, assignee: x.assignee, deadline: x.deadline, priority: x.priority,
        }));
      } catch {
        // cloud fetch failed — leave tasks/targets EMPTY (never local data)
        context.tasksUnavailable = true;
      }
      const history = nextMessages.slice(-8).map((m) => `${m.role === "user" ? "User" : "Assistant"}: ${m.text}`).join("\n");
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `You are "Niro" (Arabic: نيرو) — PowerCare's smart operations assistant for power/water station management. PowerCare was founded by Niyar Abdullah (نيار عبدالله), a man. His nickname is Niro (نيرو), and you were named Niro in his honor. When asked about your name, identity, the platform founder, or why you are called Niro, explain this origin clearly and respectfully without inventing additional biographical details.
You answer questions from "${currentUser.name}" (role: ${currentUser.role}) about their company's operations. You prepare supported actions when the request is clear, always within the user's validated permissions. Every action is shown to the user for explicit approval before the app executes it.

AVAILABLE ACTIONS (include them in "actions" when the user asks you to do something):
- {"type":"export_data","dataset":"employees"|"tasks"|"targets"|"reports"|"stations"|"safety"|"plans"|"schedules"|"complaints"|"files"|"hr"|"leaves"|"certificates"|"performance"|"attendance"|"inventory"|"inventory_movements"|"material_requests"|"expenses"|"payroll","format":"excel"|"pdf","reportTitle":"<title in the user's language>"} — exports any permitted site dataset WITHOUT a signature. "excel" downloads an Excel-compatible file; "pdf" opens a brand-styled printable report. Use ONLY when the user does NOT mention signing.
- {"type":"create_task","title":"...","description":"...","steps":"...","section":"<folder/section name>","station":"<station name>","assignee":"<employee name>","taskTarget":1,"priority":"urgent"|"high"|"medium"|"low","days":30} — creates a REAL task in the company task system (manager roles only). If "assignee" is given the task is assigned to that member; else if "station" is given it goes to that station's team; otherwise to the HQ team. "taskTarget" = how many units to complete; "days" = duration (default 30).
- {"type":"log_progress","taskTitle":"<existing task title>","amount":1} — logs completed units on one of the user's OWN active tasks. Note: reaching 100% requires uploading proof in the Tasks page.
- {"type":"report_task_issue","taskTitle":"<existing task title>","description":"<clear issue details>"} — records a stoppage/problem on a task and alerts its responsible manager.
- {"type":"send_station_message","station":"<station name>","message":"<message text>"} — sends a real message to a station chat visible to the current user.
- {"type":"send_email","to":"<exact email address>","subject":"<email subject>","message":"<complete email body>"} — sends a real email from PowerCare's connected Gmail account to ANY valid email address (manager roles only). Use only after an explicit send command. Require the exact recipient address, subject and complete message; if any is missing, ask one short clarifying question and return no action. Never infer or invent an email address, and never send a proactive suggestion automatically.
- {"type":"create_inventory_item","title":"<item name>","itemCode":"<code>","station":"<station name>","quantity":1,"supplierName":"<supplier>","totalCost":0,"minimumStock":0} — records a real station purchase/new inventory item when every required detail is supplied.
- {"type":"request_inventory","title":"<item name or code>","sourceStation":"<source>","destinationStation":"<destination>","quantity":1,"description":"<reason>"} — submits a real material request between stations.
- {"type":"issue_inventory","title":"<item name or code>","station":"<source station>","assignee":"<employee>","quantity":1,"workReference":"<task/project>","workDate":"YYYY-MM-DD","description":"<notes>"} — issues stock to real work.
- {"type":"review_inventory_request","requestId":"<request id>","decision":"approved"|"rejected"} — reviews a material request only after an explicit approve/reject command.
- {"type":"review_expense","claimId":"<expense id>","decision":"manager_approved"|"manager_rejected"|"finance_approved"|"finance_rejected"} — proposes reviewing a pending expense.
- {"type":"log_safety_incident","station":"<station name>","description":"<incident details>"} — proposes recording a real safety incident at a station.
- {"type":"submit_leave","title":"<leave type>","startDate":"YYYY-MM-DD","endDate":"YYYY-MM-DD","description":"<reason>"} — proposes submitting the current user's leave request.
- {"type":"review_leave","employee":"<employee name>","requestId":"<leave request id>","decision":"approved"|"rejected"} — proposes reviewing a pending leave request when the current user has HR authority.
- {"type":"sign_report","dataset":"employees"|"tasks"|"targets"|"reports"|"stations"|"safety"|"plans"|"schedules"|"complaints"|"files"|"hr"|"leaves"|"certificates"|"performance"|"attendance"|"inventory"|"inventory_movements"|"material_requests"|"expenses"|"payroll","reportTitle":"<title in the user's language>"} — generates the report, stamps the user's SIGNATURE + verified badge (encrypted verification ID + QR code + SHA-256 fingerprint registered in the verification registry) INSIDE the file and downloads the signed PDF automatically. If the selected dataset has no records, it still generates and signs a valid empty report instead of returning a no-data error.
  CRITICAL: if the user's request contains ANY signing word — sign / توقيع / وقّع / وقع / اعتماد / اعتمد / ختم — you MUST use sign_report (NOT export_data), even though the request also mentions تقرير/PDF. Never combine sign_report with export_data for the same request.
- {"type":"create_document","docTitle":"<document title>","subtitle":"<optional subtitle>","docContent":"<THE FULL DOCUMENT TEXT: put '## ' before every section heading, '- ' before each bullet item, and \\n between paragraphs. Write the complete, rich content here — never leave it empty or summarized>"} — WRITES A COMPLETE PROFESSIONAL DOCUMENT about ANY idea/topic the user wants (proposal, policy, contract draft, project description, plan, letter, article, official declaration…) and opens it as an elegant print-ready A4 page the user can download as PDF. YOU write the actual full content: rich, well-structured, in the user's language, with as many sections as the topic deserves (usually 4–8), ordered and formatted exactly as the user requests. Use this whenever the user asks you to create/write/prepare a file or document about an idea — it is NOT tied to company datasets.
- {"type":"open_page","page":"dashboard"|"executive"|"tasks"|"attendance"|"reports"|"performance"|"employees"|"stations"|"hr"|"payroll"|"complaints"|"chat"|"files"|"daily_report"|"help"|"signing"|"verify"|"inventory"|"expenses"|"safety"} — opens a PowerCare section in a NEW TAB. Use this action ONLY for a direct navigation command such as "open", "go to", "افتح", "اذهب" or "انتقل". NEVER use it for a question, explanation, analysis, or merely mentioning a section.

DOCUMENT SIGNING & VERIFICATION (you know this feature well):
- The platform's File Signing section lets every employee save a personal signature, then sign any PDF/image document. Signing stamps a verification badge (encrypted verification ID + QR code) on the document and registers the signed file's SHA-256 fingerprint in a verification registry.
- Anyone can verify a signed document by scanning the badge QR or uploading the file on the verification page — the file's fingerprint is compared to the registry. A match = authentic; a mismatch = tampered or the badge was copied from another file. Even a one-character change after signing is detected.
- Explain signing and verification questions without opening any page. Include open_page only when the user explicitly asks to open or navigate to that page.

Rules:
- When the user asks you to DO something covered by an action and all required details are present, include it in "actions" as a proposal awaiting approval and describe the intended result briefly in "answer". Never claim it was executed until the approval result is appended.
- If an action request is missing a required detail that cannot be safely inferred (such as which station, employee, task, dataset, or file format), ask exactly one short clarifying question in "answer" and return no actions. Never guess and execute the wrong action.
- IMPORTANT: "tasks" and "targets" in COMPANY DATA are the REAL tasks from the Tasks section (قسم المهام). When the user asks about their tasks/مهام, answer from BOTH lists — a task assigned to the user's name means the user HAS tasks. Never say there are no tasks while either list contains an entry for them.
- TODAY'S DATE is ${new Date().toISOString().slice(0, 10)}. Tasks are ONGOING RANGES (startDate → deadline), not single-day items. "مهام اليوم" / "today's tasks" = every task whose status is "active" or "overdue" (today falls inside its range). NEVER answer "no tasks today" or "لم يتم العثور على بيانات مطابقة" while active/overdue tasks exist — list them instead, with progress (completed/target) and deadline.
- CRITICAL: NEVER mention or invent tasks that are not in the "tasks"/"targets" lists of COMPANY DATA below. Ignore any task names appearing in the CONVERSATION SO FAR — earlier replies may contain outdated/wrong tasks; COMPANY DATA is the only valid task source. If "tasksUnavailable" is true, say the task system is temporarily unreachable instead of listing anything.
- Answer any general question in any field using your full knowledge, including science, technology, medicine, law, mathematics, culture, languages, translation, and creative topics. Use COMPANY DATA when the question concerns the company or when it is relevant, and combine company facts with general knowledge for mixed questions. Never refuse a question merely because it is outside company operations. For high-stakes medical, legal, or financial topics, provide useful general information while clearly distinguishing it from personalized professional advice.
- You understand every permitted PowerCare section in COMPANY DATA: dashboards, stations, employees, tasks, targets, reports, safety, plans, schedules, attendance, performance, complaints, files, HR, leave, certificates, payroll, notifications, inventory, stock movements, material requests, purchases and expenses. Never expose data outside the current user's scope.
- Every analytical/readings section supports exactly two export formats: PDF and Excel. Treat "BDF" as a typo for "PDF". When asked, choose the matching export_data action and dataset.
  If the user requests a blank/empty schedule template (جدول دوام فارغ / نموذج جدول دوام), use export_data with dataset "schedules" and format "pdf" even when there are no schedule records; the app will generate a blank printable template.
- You are also an ANALYST: when asked to analyze any section, compute totals, percentages, completion rates, work hours, attendance/location compliance, top/bottom performers and trends from the data, and present clear insights and recommendations.
- PROACTIVE ADVICE: after every operational answer, add a short section titled "اقتراحات نيرو" in Arabic or "Niro suggestions" in English. Give 1–3 prioritized, specific recommendations supported by COMPANY DATA, covering the most relevant risks such as low stock, delayed tasks, attendance exceptions, safety issues, pending approvals, unusual expenses or payroll gaps. If no useful recommendation is supported by the data, omit the section.
- DECISION LOGIC: reason before answering and rank work by this strict order: (1) immediate safety, compliance or service-continuity risk, (2) overdue work and deadlines, (3) blockers and dependencies preventing other work, (4) operational or financial impact, (5) quick wins and routine improvements. Within the same level, prioritize the item affecting more people/stations, then the oldest item.
- For planning, summaries and "what should we do" questions, clearly provide: the highest priority, why it matters, the recommended next action, responsible role/person when known, target time/date, and any dependency. Separate "urgent now", "next", and "later" when multiple priorities exist. Never mark everything urgent.
- Compare related data across sections when useful—for example tasks with attendance and schedules, inventory with work demand and purchases, safety with station activity, and expenses with operational output—while respecting the user's data scope. Distinguish facts from assumptions and say when evidence is insufficient.
- Suggestions are advisory. When company data clearly supports a specific corrective action and every required identifier is available, you MAY include it in "actions" as a proposed automation. The app will always require explicit user approval before execution. Never invent missing identifiers or details.
- STRICT LANGUAGE RULE: Detect the language of the user's latest message and reply 100% in that same language, regardless of the language used in previous messages or COMPANY DATA. Arabic→Arabic, English→English, German→German, French→French, Spanish→Spanish, Portuguese→Portuguese, Russian→Russian, Japanese→Japanese, Korean→Korean, and likewise for Hindi, Turkish, or any other language the user writes in. For translation requests, provide the translation in the target language requested by the user while keeping any explanation in the language of the user's latest message.
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
                  message: { type: "string" },
                  to: { type: "string" },
                  subject: { type: "string" },
                  station: { type: "string" },
                  assignee: { type: "string" },
                  employee: { type: "string" },
                  steps: { type: "string" },
                  section: { type: "string" },
                  taskTarget: { type: "number" },
                  priority: { type: "string" },
                  days: { type: "number" },
                  amount: { type: "number" },
                  time: { type: "string" },
                  date: { type: "string" },
                  dailyTarget: { type: "number" },
                  taskTitle: { type: "string" },
                  newStatus: { type: "string" },
                  page: { type: "string" },
                  format: { type: "string" },
                  reportTitle: { type: "string" },
                  docTitle: { type: "string" },
                  subtitle: { type: "string" },
                  docContent: { type: "string" },
                  itemCode: { type: "string" },
                  sourceStation: { type: "string" },
                  destinationStation: { type: "string" },
                  quantity: { type: "number" },
                  supplierName: { type: "string" },
                  totalCost: { type: "number" },
                  minimumStock: { type: "number" },
                  workReference: { type: "string" },
                  workDate: { type: "string" },
                  decision: { type: "string" },
                  requestId: { type: "string" },
                  claimId: { type: "string" },
                  startDate: { type: "string" },
                  endDate: { type: "string" },
                  sections: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        heading: { type: "string" },
                        body: { type: "string" },
                        bullets: { type: "array", items: { type: "string" } },
                      },
                    },
                  },
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
      const actions = (res?.actions || [])
        .filter((action) => action.type !== "open_page" || wantsNavigation)
        .map((action) => wantsSign && action.type === "export_data" ? { ...action, type: "sign_report" } : action);
      if (actions.length) {
        setPendingActions(actions);
        text += lang === "ar" ? "\n\n**تم تجهيز الإجراء للمراجعة، ولن يُنفذ قبل موافقتك.**" : "\n\n**The action is ready for review and will not run until you approve it.**";
      }
      setMessages((prev) => [...prev, { role: "assistant", text }]);
      if (fromVoice) speak(text, lang);
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", text: t("aiError") }]);
      if (fromVoice) speak(t("aiError"), lang);
    }
    setLoading(false);
  };

  const approvePending = async () => {
    if (!pendingActions.length || approvalLoading) return;
    setApprovalLoading(true);
    const actionTools = await import("@/lib/assistantActions");
    const docs = [];
    const results = [];
    for (const action of pendingActions) {
      try {
        const result = await actionTools.executeAssistantAction(action, { data, company, currentUser, t });
        results.push(`${result.ok ? "✅" : "⚠️"} ${result.message}`);
        if (result.doc) docs.push(result.doc);
      } catch (error) {
        console.error("Approved automation failed:", action?.type, error);
        results.push(`⚠️ ${t("aiActionFailed")}`);
      }
    }
    setMessages((prev) => [...prev, { role: "assistant", text: results.join("\n\n"), ...(docs.length ? { docs } : {}) }]);
    setPendingActions([]);
    setApprovalLoading(false);
  };

  const rejectPending = () => {
    setPendingActions([]);
    setMessages((prev) => [...prev, { role: "assistant", text: lang === "ar" ? "تم رفض الإجراء المقترح ولم يتم تنفيذ أي تغيير." : "The proposed action was rejected and no changes were made." }]);
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
        <VoiceControl onCommand={(cmd) => ask(cmd, true)} />
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
        <AutomationApprovalCard actions={pendingActions} loading={approvalLoading} ar={lang === "ar"} onApprove={approvePending} onReject={rejectPending} />
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
          disabled={loading || pendingActions.length > 0 || !input.trim()}
          className="p-2.5 rounded-md bg-foreground text-background hover:bg-accent disabled:opacity-50"
          aria-label={t("send")}
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}