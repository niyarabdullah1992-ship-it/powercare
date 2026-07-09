import React, { useState } from "react";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/PowerCareAuth";
import { updateCompany, getAnonUsage, addNotification, getAnonymousCode, setAnonRateLimits } from "@/lib/store";
import { canReplyAnon, visibleStations } from "@/lib/permissions";
import { ShieldCheck, Send, Lock, ArrowUpCircle, Building2, CheckCircle2, ChevronRight, ArrowLeft } from "lucide-react";
import CommentFiles, { CommentAttachments } from "@/components/tasks/CommentFiles";
import VoiceRecorder from "@/components/tasks/VoiceRecorder";

const TYPES = ["complaint", "suggestion"];
const PRIORITIES = ["high", "medium", "low"];

// Escalation chain: station_manager → pgm → ops_manager → director
const ESCALATION_CHAIN = ["station_manager", "pgm", "ops_manager", "director"];
const ROLE_LABEL_KEY = {
  station_manager: "stationManager",
  pgm: "pgm",
  ops_manager: "opsManager",
  director: "director",
};

export default function AnonymousReports() {
  const { t, dir } = useI18n();
  const { data, currentUser, company } = useAuth();
  const [type, setType] = useState("complaint");
  const [priority, setPriority] = useState("medium");
  const [message, setMessage] = useState("");
  const [replyText, setReplyText] = useState({});
  const [files, setFiles] = useState([]);
  const [replyFiles, setReplyFiles] = useState({});
  const [selectedStation, setSelectedStation] = useState(null);
  const [monthlyLimitInput, setMonthlyLimitInput] = useState("");

  if (!data || !currentUser) return null;
  const isStaff = canReplyAnon(currentUser);
  const myAnon = data.anonymousReports.filter((a) => (a.authorId ? a.authorId === currentUser.id : a.anonymousId === currentUser.anonymousId));
  const usage = getAnonUsage(company.id, currentUser.id, currentUser.anonymousId);

  const stationName = (id) => data.stations.find((s) => s.id === id)?.name || "—";
  const roleLabel = (role) => t(ROLE_LABEL_KEY[role] || role);
  const displayCode = (r) => (r.authorId ? getAnonymousCode(r.authorId, new Date(r.createdAt)) : r.anonymousId);
  const saveMonthlyLimit = () => {
    const val = Number(monthlyLimitInput);
    if (!val || val < 1) return;
    setAnonRateLimits(company.id, { monthly: val });
    setMonthlyLimitInput("");
  };

  // Reports visible to a staff member based on station scope
  const visibleReports = data.anonymousReports.filter((r) => {
    if (currentUser.role === "director" || currentUser.role === "ops_manager") return true;
    if (currentUser.role === "pgm") return (currentUser.managedStations || []).includes(r.stationId);
    if (currentUser.role === "station_manager") return r.stationId === currentUser.stationId;
    return false;
  });

  const currentHandlerRole = (r) => ESCALATION_CHAIN[r.escalationLevel || 0];
  const canReplyTo = (r) => isStaff && currentUser.role === currentHandlerRole(r);
  const isAtTop = (r) => (r.escalationLevel || 0) >= ESCALATION_CHAIN.length - 1;

  const submit = (e) => {
    e.preventDefault();
    if (!message.trim()) return;
    if (usage.day >= usage.dayLimit || usage.month >= usage.monthLimit) return;
    updateCompany(company.id, (d) => {
      d.anonymousReports.unshift({
        id: "anr_" + Math.random().toString(36).slice(2, 9),
        authorId: currentUser.id,
        stationId: currentUser.stationId || null,
        type, priority, message,
        files,
        status: "open",
        escalationLevel: 0,
        replies: [],
        createdAt: new Date().toISOString(),
      });
    });
    const station = data.stations.find((s) => s.id === currentUser.stationId);
    if (station?.managerId) addNotification(company.id, station.managerId, `New ${t(type)} report at ${station.name} (${t(priority)}).`);
    setMessage("");
    setFiles([]);
  };

  const setStatus = (id, status) => {
    updateCompany(company.id, (d) => {
      const r = d.anonymousReports.find((x) => x.id === id);
      if (r) r.status = status;
    });
  };

  const reply = (id) => {
    const txt = (replyText[id] || "").trim();
    if (!txt) return;
    const rep = data.anonymousReports.find((x) => x.id === id);
    if (!rep) return;
    updateCompany(company.id, (d) => {
      const r = d.anonymousReports.find((x) => x.id === id);
      if (r) {
        r.replies = r.replies || [];
        r.replies.push({ level: r.escalationLevel || 0, role: currentUser.role, authorName: currentUser.name, text: txt, files: replyFiles[id] || [], createdAt: new Date().toISOString() });
        r.status = r.status === "open" ? "in_review" : r.status;
      }
    });
    const author = rep.authorId ? data.employees.find((e) => e.id === rep.authorId) : data.employees.find((e) => e.anonymousId === rep.anonymousId);
    if (author) addNotification(company.id, author.id, `Reply to your anonymous ${t(rep.type)} from ${currentUser.name}.`);
    setReplyText({ ...replyText, [id]: "" });
    setReplyFiles({ ...replyFiles, [id]: [] });
  };

  const escalate = (id) => {
    const rep = data.anonymousReports.find((x) => x.id === id);
    if (!rep) return;
    const nextLevel = (rep.escalationLevel || 0) + 1;
    if (nextLevel >= ESCALATION_CHAIN.length) return;
    updateCompany(company.id, (d) => {
      const r = d.anonymousReports.find((x) => x.id === id);
      if (r) { r.escalationLevel = nextLevel; r.status = "open"; }
    });
    const nextRole = ESCALATION_CHAIN[nextLevel];
    const nextHandlers = data.employees.filter((e) => e.role === nextRole);
    for (const h of nextHandlers) addNotification(company.id, h.id, `Escalated anonymous report at ${stationName(rep.stationId)} — now requires your attention.`);
  };

  // Escalation timeline showing each level and its reply
  const renderTimeline = (r) => (
    <div className="space-y-2 pt-2 border-t border-border">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{t("escalationChain")}</p>
      {ESCALATION_CHAIN.map((role, idx) => {
        const replyAtLevel = (r.replies || []).find((rp) => rp.level === idx);
        const isCurrent = (r.escalationLevel || 0) === idx;
        const isPast = (r.escalationLevel || 0) > idx;
        return (
          <div key={role} className={`flex items-start gap-2 text-xs font-body ${isPast ? "opacity-50" : ""}`}>
            <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${replyAtLevel ? "bg-accent text-accent-foreground" : isCurrent ? "bg-amber-100 text-amber-700 border border-amber-300" : "bg-muted text-muted-foreground"}`}>
              {replyAtLevel ? <CheckCircle2 className="w-3 h-3" /> : <span className="text-[9px]">{idx + 1}</span>}
            </div>
            <div className="flex-1">
              <p className={`font-medium ${isCurrent ? "text-foreground" : "text-muted-foreground"}`}>
                {roleLabel(role)} {isCurrent && !replyAtLevel && <span className="text-amber-600 font-normal">— {t("waitingReply")}</span>}
              </p>
              {replyAtLevel && (
                <div className="mt-0.5 p-2 rounded bg-muted/50">
                  <p className="text-[10px] text-muted-foreground">{replyAtLevel.authorName} · {new Date(replyAtLevel.createdAt).toLocaleString()}</p>
                  <p className="text-foreground mt-0.5">{replyAtLevel.text}</p>
                  <CommentAttachments files={replyAtLevel.files} />
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );

  const stats = {
    complaint: visibleReports.filter((a) => a.type === "complaint").length,
    suggestion: visibleReports.filter((a) => a.type === "suggestion").length,
  };

  // Station grouping for staff navigation
  const myStations = visibleStations(currentUser, data);
  const stationGroups = myStations.map((s) => ({
    key: s.id,
    name: s.name,
    count: visibleReports.filter((r) => r.stationId === s.id).length,
  }));
  const stationReports = selectedStation ? visibleReports.filter((r) => r.stationId === selectedStation) : [];
  const selectedStationName = selectedStation ? stationName(selectedStation) : "";

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
            {currentUser.stationId && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-body">
                <Building2 className="w-3.5 h-3.5" /> {t("station")}: {stationName(currentUser.stationId)}
              </div>
            )}
            <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={4} placeholder={t("fileReport")} required className="w-full px-3 py-2 rounded-md border border-input text-sm font-body resize-none" />
            <div className="flex flex-wrap items-end gap-2">
              <CommentFiles files={files} setFiles={setFiles} />
              <VoiceRecorder files={files} setFiles={setFiles} />
            </div>
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground font-body">
                {usage.dayLimit - usage.day} {t("remaining")} · {usage.weekLimit - usage.week} {t("weekRemaining")} · {usage.monthLimit - usage.month} {t("monthRemaining")}
              </p>
              <button type="submit" disabled={usage.day >= usage.dayLimit || usage.month >= usage.monthLimit} className="flex items-center gap-2 px-4 py-2 rounded-md bg-foreground text-background text-sm font-body hover:bg-accent disabled:opacity-40">
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
                  <div key={r.id} className="p-4 rounded-xl border border-border bg-card space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-muted-foreground">{displayCode(r)}</span>
                        {r.stationId && (
                          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground font-body">
                            <Building2 className="w-3 h-3" /> {stationName(r.stationId)}
                          </span>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Badge text={t(r.type)} />
                        <Badge text={t(r.priority)} tone={r.priority === "high" ? "destructive" : "muted"} />
                        <Badge text={roleLabel(currentHandlerRole(r))} tone="accent" />
                      </div>
                    </div>
                    <p className="text-sm font-body">{r.message}</p>
                    <CommentAttachments files={r.files} />
                    {renderTimeline(r)}
                    {!isAtTop(r) && r.status !== "closed" && (
                      <button onClick={() => escalate(r.id)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-amber-300 text-amber-700 text-xs font-body hover:bg-amber-50">
                        <ArrowUpCircle className="w-3.5 h-3.5" /> {t("notConvinced")}
                      </button>
                    )}
                    {isAtTop(r) && r.status !== "closed" && (
                      <p className="text-xs text-muted-foreground font-body italic">{t("finalLevel")}</p>
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
          {currentUser.role === "director" && (
            <div className="p-4 rounded-xl border border-border bg-card flex flex-wrap items-center gap-3">
              <label className="text-xs text-muted-foreground font-body">{t("monthlyLimit")}</label>
              <input
                type="number"
                min="1"
                placeholder={String(data.settings?.rateLimitMonthly ?? 30)}
                value={monthlyLimitInput}
                onChange={(e) => setMonthlyLimitInput(e.target.value)}
                className="w-24 px-2 py-1.5 rounded-md border border-input text-sm font-body"
              />
              <button onClick={saveMonthlyLimit} className="px-3 py-1.5 rounded-md bg-foreground text-background text-xs font-body">{t("save")}</button>
            </div>
          )}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {TYPES.map((ty) => (
              <div key={ty} className="p-4 rounded-xl border border-border bg-card">
                <p className="text-2xl font-heading font-semibold">{stats[ty]}</p>
                <p className="text-xs text-muted-foreground font-body">{t(ty)}</p>
              </div>
            ))}
          </div>

          {!selectedStation ? (
            <div className="space-y-3">
              <h2 className="font-heading text-lg font-semibold flex items-center gap-2">
                <Building2 className="w-4 h-4" /> {t("stations")}
              </h2>
              {stationGroups.length === 0 ? (
                <p className="text-sm text-muted-foreground font-body">{t("noReply")}</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {stationGroups.map((g) => (
                    <button
                      key={g.key}
                      onClick={() => setSelectedStation(g.key)}
                      className="flex items-center justify-between p-4 rounded-lg border border-border bg-card hover:bg-muted transition text-start"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-md bg-foreground/5 flex items-center justify-center">
                          <Building2 className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-sm font-medium font-body">{g.name}</p>
                          <p className="text-xs text-muted-foreground font-body">{g.count} {t("anonymous")}</p>
                        </div>
                      </div>
                      <ChevronRight className={`w-4 h-4 text-muted-foreground ${dir === "rtl" ? "rotate-180" : ""}`} />
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <button onClick={() => setSelectedStation(null)} className="flex items-center gap-1.5 text-sm text-muted-foreground font-body hover:text-foreground">
                <ArrowLeft className={`w-4 h-4 ${dir === "rtl" ? "rotate-180" : ""}`} /> {t("back")}
              </button>
              <p className="font-heading text-base font-semibold flex items-center gap-1.5">
                <Building2 className="w-4 h-4" /> {selectedStationName}
              </p>
              {stationReports.length === 0 ? (
                <p className="text-sm text-muted-foreground font-body">{t("noReply")}</p>
              ) : (
                stationReports.map((r) => (
              <div key={r.id} className="p-4 rounded-xl border border-border bg-card space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-muted-foreground">{displayCode(r)}</span>
                    {r.stationId && (
                      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground font-body">
                        <Building2 className="w-3 h-3" /> {stationName(r.stationId)}
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Badge text={t(r.type)} />
                    <Badge text={t(r.priority)} tone={r.priority === "high" ? "destructive" : "muted"} />
                    <Badge text={roleLabel(currentHandlerRole(r))} tone="accent" />
                    <select value={r.status} onChange={(e) => setStatus(r.id, e.target.value)} className="px-2 py-0.5 rounded-md border border-input text-xs font-body">
                      <option value="open">{t("open")}</option>
                      <option value="in_review">{t("inReview")}</option>
                      <option value="closed">{t("closed")}</option>
                    </select>
                  </div>
                </div>
                <p className="text-sm font-body">{r.message}</p>
                <CommentAttachments files={r.files} />
                {renderTimeline(r)}
                {canReplyTo(r) && r.status !== "closed" && (
                  <div className="space-y-2 pt-1 border-t border-border">
                    <div className="flex flex-wrap items-end gap-2">
                      <CommentFiles files={replyFiles[r.id] || []} setFiles={(f) => setReplyFiles({ ...replyFiles, [r.id]: f })} />
                      <VoiceRecorder files={replyFiles[r.id] || []} setFiles={(f) => setReplyFiles({ ...replyFiles, [r.id]: f })} />
                    </div>
                    <div className="flex gap-2">
                      <input value={replyText[r.id] || ""} onChange={(e) => setReplyText({ ...replyText, [r.id]: e.target.value })} placeholder={t("reply")} className="flex-1 px-3 py-1.5 rounded-md border border-input text-sm font-body" />
                      <button onClick={() => reply(r.id)} className="px-4 py-1.5 rounded-md bg-foreground text-background text-sm font-body hover:bg-accent">{t("reply")}</button>
                    </div>
                  </div>
                )}
                {!canReplyTo(r) && r.status !== "closed" && (
                  <p className="text-xs text-muted-foreground font-body italic">
                    {t("escalatedTo")} {roleLabel(currentHandlerRole(r))}
                  </p>
                )}
              </div>
            ))
              )}
            </div>
          )}
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