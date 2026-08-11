import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Loader2, Sparkles } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/PowerCareAuth";
import { getCompanyToken } from "@/lib/store";
import { allowedNavFor } from "@/lib/navVisibility";
import { checkAskGate } from "@/lib/assistantDerivations";
import { toast } from "@/components/ui/use-toast";

async function assistantApi(payload) {
  const res = await base44.functions.invoke("assistant", payload);
  return res?.data ?? res;
}

function sectionsFromNav(user, data, company) {
  const routes = [...allowedNavFor(user, data, company)];
  const keys = new Set(["assistant"]);
  routes.forEach((r) => {
    if (r === "/app/assistant") keys.add("assistant");
    if (r === "/app/tasks") keys.add("tasks");
    if (r === "/app/attendance") keys.add("attendance");
    if (r === "/app/safety") keys.add("safety");
    if (r === "/app/daily-report") keys.add("reports");
    if (r === "/app/performance") keys.add("performance");
    if (r === "/app/payroll") keys.add("payroll");
    if (r === "/app/hr") keys.add("hr");
  });
  return [...keys];
}

export default function AssistantBoard({ lang = "ar", onPickPrompt }) {
  const ar = lang === "ar";
  const { company, currentUser, data } = useAuth();
  const [answer, setAnswer] = useState(null);
  const [prompts, setPrompts] = useState([]);
  const [busy, setBusy] = useState(false);
  const [gateHint, setGateHint] = useState(null);
  const [empty, setEmpty] = useState(false);

  const actor = currentUser
    ? {
      role: currentUser.role,
      owner: currentUser.role === "owner" || data?.ownerId === currentUser.id,
      admin: currentUser.role === "admin",
      stationId: currentUser.stationId || null,
      allStations: ["owner", "director", "ops_manager", "pgm", "hr_manager", "hr", "admin"].includes(currentUser.role)
        || data?.ownerId === currentUser.id,
      stationIds: currentUser.stationId ? [currentUser.stationId] : [],
    }
    : null;

  const basePayload = () => ({
    companyId: company?.id,
    sessionToken: company?.id ? getCompanyToken(company.id) : undefined,
    planConfig: company?.planConfig || null,
    allowedSections: sectionsFromNav(currentUser, data, company),
    stationIds: actor?.stationIds || [],
  });

  const applyRemote = (remote) => {
    if (remote?.answer) setAnswer(remote.answer);
    if (Array.isArray(remote?.prompts)) setPrompts(remote.prompts);
    setEmpty(!!remote?.empty);
  };

  const load = async (promptId) => {
    if (!company?.id) return;
    setBusy(true);
    try {
      let remote = await assistantApi({ ...basePayload(), action: "board", promptId });
      if (remote?.empty || !remote?.answer) {
        remote = await assistantApi({ ...basePayload(), action: "seedDemo" });
      }
      if (promptId && remote?.ok !== false) {
        remote = await assistantApi({ ...basePayload(), action: "ask", promptId });
      }
      if (remote?.error) {
        setGateHint(ar ? remote.reason : (remote.reasonEn || remote.error));
        applyRemote({ answer: null, prompts: [] });
      } else {
        setGateHint(null);
        applyRemote(remote);
      }
    } catch {
      setAnswer(null);
      setPrompts([]);
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => { load(); }, [company?.id, currentUser?.id]);

  const pickPrompt = async (p) => {
    const preview = checkAskGate({
      promptId: p.id,
      question: ar ? p.textAr : p.textEn,
      plan: company?.planConfig,
      actor,
      allowedSections: sectionsFromNav(currentUser, data, company),
    });
    if (!preview.ok) {
      setGateHint(ar ? preview.reason : preview.reasonEn);
      toast({ title: ar ? preview.reason : preview.reasonEn, variant: "destructive" });
      return;
    }
    if (typeof onPickPrompt === "function") {
      onPickPrompt(ar ? p.textAr : p.textEn);
    }
    await load(p.id);
  };

  if (!company?.id) return null;

  return (
    <div className="mb-4 space-y-3" dir={ar ? "rtl" : "ltr"}>
      <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
        <div className="flex items-center gap-2">
          <span className="w-7 h-7 rounded-lg bg-accent/15 border border-accent/30 flex items-center justify-center text-accent">
            <Sparkles className="w-4 h-4" />
          </span>
          <span className="text-sm font-semibold font-heading">
            {ar ? "سؤالك" : "Your question"}
          </span>
          {busy && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground ms-auto" />}
        </div>

        {gateHint && (
          <p className="text-xs text-destructive font-body border border-destructive/30 bg-destructive/5 rounded-lg px-3 py-2">
            {gateHint}
          </p>
        )}

        {empty && !answer && (
          <p className="text-sm text-muted-foreground font-body">
            {ar ? "لا بيانات مشتقة بعد في نطاق شركتك." : "No derived facts in your company scope yet."}
          </p>
        )}

        {answer && (
          <>
            <p className="text-sm text-foreground font-body leading-relaxed">
              {ar ? answer.questionAr : answer.questionEn}
            </p>
            <div className="h-px bg-border" />
            <p className="text-sm text-foreground/85 font-body leading-relaxed">
              {ar ? answer.answerAr : answer.answerEn}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {(answer.evidence || []).map((e, i) => (
                <div key={i} className="rounded-xl border border-border bg-muted/40 px-3 py-2.5">
                  <div className="text-[10px] tracking-wide text-muted-foreground uppercase">
                    {ar ? e.sourceAr : e.sourceEn}
                  </div>
                  <div className="text-lg font-semibold font-heading mt-1" dir="ltr" style={{ textAlign: ar ? "right" : "left" }}>
                    {e.value}
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">
                    {ar ? e.labelAr : e.labelEn}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap gap-2 pt-1">
              {(answer.goOps || answer.goSafety) && (
                <Link
                  to={answer.goSafety || answer.goOps}
                  className="inline-flex items-center px-3.5 py-2 rounded-lg bg-accent text-accent-foreground text-xs font-medium hover:opacity-90"
                >
                  {ar ? answer.primaryActionAr : answer.primaryActionEn}
                </Link>
              )}
              <button
                type="button"
                className="inline-flex items-center px-3.5 py-2 rounded-lg border border-border bg-background text-muted-foreground text-xs font-medium hover:border-foreground/40"
                onClick={() => toast({
                  description: ar ? answer.secondaryActionAr : answer.secondaryActionEn,
                })}
              >
                {ar ? answer.secondaryActionAr : answer.secondaryActionEn}
              </button>
            </div>
          </>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {prompts.map((p) => (
          <button
            key={p.id}
            type="button"
            disabled={busy || p.allowed === false}
            onClick={() => pickPrompt(p)}
            title={p.allowed === false ? (ar ? "لا صلاحية" : "Not allowed") : undefined}
            className={`px-3.5 py-2 rounded-full border text-xs font-body disabled:opacity-45 ${
              answer?.promptId === p.id
                ? "border-accent bg-accent/10 text-accent"
                : "border-border bg-card text-muted-foreground hover:border-foreground/30"
            }`}
          >
            {ar ? p.textAr : p.textEn}
          </button>
        ))}
      </div>
    </div>
  );
}
