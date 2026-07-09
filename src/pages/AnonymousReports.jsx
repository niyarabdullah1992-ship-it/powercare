import React, { useState } from "react";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/PowerCareAuth";
import { updateCompany, getAnonUsage, addNotification } from "@/lib/store";
import { canReplyAnon } from "@/lib/permissions";
import { ShieldCheck, Send, Lock } from "lucide-react";

const TYPES = ["complaint", "suggestion", "risk_report", "incident"];
const PRIORITIES = ["high", "medium", "low"];

export default function AnonymousReports() {
  const { t } = useI18n();
  const { data, currentUser, company } = useAuth();
  const [type, setType] = useState("complaint");
  const [priority, setPriority] = useState("medium");
  const [message, setMessage] = useState("");
  const [replyText, setReplyText] = useState({});

  if (!data || !currentUser) return null;
  const isStaff = canReplyAnon(currentUser);
  const myAnon = data.anonymousReports.filter((a) => a.anonymousId === currentUser.anonymousId);
  const usage = getAnonUsage(company.id, currentUser.anonymousId);

  const submit = (e) => {
    e.preventDefault();
    if (!message.trim()) return;
    if (usage.day >= usage.dayLimit) return;
    updateCompany(company.id, (d) => {
      d.anonymousReports.unshift({
        id: "anr_" + Math.random().toString(36).slice(2, 9),
        anonymousId: currentUser.anonymousId,
        type,
        priority,
        message,
        status: "open",
        reply: "",
        createdAt: new Date().toISOString(),
      });
    });
    addNotification(company.id, data.directorId, `New ${t(type)} report (${t(priority)}).`);
    setMessage("");
  };

  const setStatus = (id, status) => {
    updateCompany(company.id, (d) => {
      const r = d.anonymousReports.find((x) => x.id === id);
      if (r) r.status = status;
    });
  };

  const reply = (id) => {
    const txt = replyText[id] || "";
    if (!txt.trim()) return;
    updateCompany(company.id, (d) => {
      const r = d.anonymousReports.find((x) => x.id === id);
      if (r) {
        r.reply = txt;
        r.status = r.status === "open" ? "in_review" : r.status;
      }
    });
    // notify the anonymous author's real user
    const rep = data.anonymousReports.find((x) => x.id === id);
    const author = data.employees.find((e) => e.anonymousId === rep?.anonymousId);
    if (author) addNotification(company.id, author.id, `Reply to your anonymous ${t(rep.type)}.`);
    setReplyText({ ...replyText, [id]: "" });
  };

  // stats
  const stats = {
    complaint: data.anonymousReports.filter((a) => a.type === "complaint").length,
    suggestion: data.anonymousReports.filter((a) => a.type === "suggestion").length,
    risk_report: data.anonymousReports.filter((a) => a.type === "risk_report").length,
    incident: data.anonymousReports.filter((a) => a.type === "incident").length,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-semibold">{t("anonymous")}</h1>
        <p className="text-muted-foreground font-body text-sm mt-1">{isStaff ? t("overview") : t("identityProtected")}</p>
      </div>

      {/* Employee: file report */}
      {!isStaff && (
        <>
          <div className="p-4 rounded-xl border border-accent/30 bg-accent/5 flex items-center gap-3">
            <ShieldCheck className="w-5 h-5 text-accent shrink-0" />
            <p className="text-sm font-body text-accent">{t("identityProtected")}</p>
            <Lock className="w-4 h-4 text-accent ms-auto" />
          </div>

          <form onSubmit={submit} className="p-5 rounded-xl border border-border bg-card space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-muted-foreground font-body mb-1">{t("type")}</label>
                <select value={type} onChange={(e) => setType(e.target.value)} className="w-full px-3 py-2 rounded-md border border-input text-sm font-body">
                  {TYPES.map((ty) => <option key={ty} value={ty}>{t(ty)}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-muted-foreground font-body mb-1">{t("priority")}</label>
                <select value={priority} onChange={(e) => setPriority(e.target.value)} className="w-full px-3 py-2 rounded-md border border-input text-sm font-body">
                  {PRIORITIES.map((p) => <option key={p} value={p}>{t(p)}</option>)}
                </select>
              </div>
            </div>
            <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={4} placeholder={t("fileReport")} required className="w-full px-3 py-2 rounded-md border border-input text-sm font-body resize-none" />
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground font-body">
                {usage.dayLimit - usage.day} {t("remaining")} · {usage.weekLimit - usage.week} {t("weekRemaining")}
              </p>
              <button type="submit" disabled={usage.day >= usage.dayLimit} className="flex items-center gap-2 px-4 py-2 rounded-md bg-foreground text-background text-sm font-body hover:bg-accent disabled:opacity-40">
                <Send className="w-4 h-4" /> {t("fileReport")}
              </button>
            </div>
          </form>

          <div>
            <h3 className="font-heading font-semibold mb-3">{t("yourReports")}</h3>
            {myAnon.length === 0 ? (
              <p className="text-sm text-muted-foreground font-body">{t("noReply")}</p>
            ) : (
              <div className="space-y-3">
                {myAnon.map((r) => (
                  <div key={r.id} className="p-4 rounded-xl border border-border bg-card">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-mono text-muted-foreground">{r.anonymousId}</span>
                      <div className="flex gap-2">
                        <Badge text={t(r.type)} />
                        <Badge text={t(r.priority)} tone={r.priority === "high" ? "destructive" : "muted"} />
                        <Badge text={t(r.status)} tone="accent" />
                      </div>
                    </div>
                    <p className="text-sm font-body mb-2">{r.message}</p>
                    {r.reply ? (
                      <div className="p-2 rounded bg-muted/50 text-sm font-body">
                        <p className="text-[10px] uppercase text-muted-foreground mb-1">{t("managementReply")}</p>
                        {r.reply}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground italic">{t("noReply")}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* Staff: manage reports */}
      {isStaff && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {TYPES.map((ty) => (
              <div key={ty} className="p-4 rounded-xl border border-border bg-card">
                <p className="text-2xl font-heading font-semibold">{stats[ty]}</p>
                <p className="text-xs text-muted-foreground font-body">{t(ty)}</p>
              </div>
            ))}
          </div>

          <div className="space-y-3">
            {data.anonymousReports.map((r) => (
              <div key={r.id} className="p-4 rounded-xl border border-border bg-card space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-mono text-muted-foreground">{r.anonymousId}</span>
                  <div className="flex gap-2">
                    <Badge text={t(r.type)} />
                    <Badge text={t(r.priority)} tone={r.priority === "high" ? "destructive" : "muted"} />
                    <select value={r.status} onChange={(e) => setStatus(r.id, e.target.value)} className="px-2 py-0.5 rounded-md border border-input text-xs font-body">
                      <option value="open">{t("open")}</option>
                      <option value="in_review">{t("inReview")}</option>
                      <option value="closed">{t("closed")}</option>
                    </select>
                  </div>
                </div>
                <p className="text-sm font-body">{r.message}</p>
                {r.reply && (
                  <div className="p-2 rounded bg-muted/50 text-sm font-body">
                    <p className="text-[10px] uppercase text-muted-foreground mb-1">{t("managementReply")}</p>
                    {r.reply}
                  </div>
                )}
                <div className="flex gap-2">
                  <input value={replyText[r.id] || ""} onChange={(e) => setReplyText({ ...replyText, [r.id]: e.target.value })} placeholder={t("reply")} className="flex-1 px-3 py-1.5 rounded-md border border-input text-sm font-body" />
                  <button onClick={() => reply(r.id)} className="px-4 py-1.5 rounded-md bg-foreground text-background text-sm font-body hover:bg-accent">{t("reply")}</button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function Badge({ text, tone = "muted" }) {
  const tones = {
    muted: "bg-muted text-muted-foreground",
    destructive: "bg-destructive/15 text-destructive",
    accent: "bg-accent/15 text-accent",
  };
  return <span className={`px-2 py-0.5 rounded-full text-[10px] font-body whitespace-nowrap ${tones[tone]}`}>{text}</span>;
}