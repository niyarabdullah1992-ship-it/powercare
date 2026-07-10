import React, { useState } from "react";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/PowerCareAuth";
import { updateCompany, getAnonUsage, addNotification, getAnonymousCode, setAnonRateLimits } from "@/lib/store";
import { visibleStations, hasHRPermission, hrScopeStations } from "@/lib/permissions";
import { groupLevelsByOrder, levelName } from "@/lib/hrLevels";
import { formatDateTime } from "@/lib/dateFormat";
import { ShieldCheck, Send, Lock, LockOpen, ArrowUpCircle, Building2, CheckCircle2, ChevronRight, ArrowLeft, Check, X as XIcon } from "lucide-react";
import CommentFiles, { CommentAttachments } from "@/components/tasks/CommentFiles";
import VoiceRecorder from "@/components/tasks/VoiceRecorder";

const TYPES = ["complaint", "suggestion"];
const PRIORITIES = ["high", "medium", "low"];

// Escalation chain: level 0 = the station manager, then straight up the company's
// customizable HR tiers (see the HR page), lowest to highest authority.
function handlersForLevel(levelIdx, r, data) {
  if (levelIdx === 0) {
    return data.employees.filter((e) => e.role === "station_manager" && e.stationId === r.stationId);
  }
  const groups = groupLevelsByOrder(data.hrLevels || []);
  const group = groups[levelIdx - 1];
  if (!group || !group.manager) return [];
  return data.employees.filter((e) => {
    if (e.hrLevelId !== group.manager.id) return false;
    if (group.scope === "station") return e.hrStationId === r.stationId;
    if (group.scope === "cluster") {
      const cluster = (data.hrClusters || []).find((c) => (c.stationIds || []).includes(r.stationId));
      return cluster ? e.hrClusterId === cluster.id : false;
    }
    return true;
  });
}

function levelLabel(levelIdx, data, t, lang) {
  if (levelIdx === 0) return t("stationManager");
  const groups = groupLevelsByOrder(data.hrLevels || []);
  const group = groups[levelIdx - 1];
  if (!group) return "";
  return levelName(group.manager || group.assistant, lang);
}

export default function AnonymousReports() {
  const { t, dir, lang } = useI18n();
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
  const STAGE_COUNT = groupLevelsByOrder(data.hrLevels || []).length + 1;
  const canAct = hasHRPermission(currentUser, data, "manage_anonymous_reports");
  const canView = hasHRPermission(currentUser, data, "view_anonymous_reports");
  const isHRAnon = canAct || canView;
  const hrStations = isHRAnon ? hrScopeStations(currentUser, data) : [];
  const isOwner = currentUser.id === data.ownerId;
  const isStaff = isHRAnon || currentUser.role === "director" || currentUser.role === "ops_manager" || currentUser.role === "station_manager" || isOwner;
  const myAnon = data.anonymousReports.filter((a) => (a.authorId ? a.authorId === currentUser.id : a.anonymousId === currentUser.anonymousId));
  const usage = getAnonUsage(company.id, currentUser.id, currentUser.anonymousId);

  const stationName = (id) => data.stations.find((s) => s.id === id)?.name || "—";
  const displayCode = (r) => (r.authorId ? getAnonymousCode(r.authorId, new Date(r.createdAt)) : r.anonymousId);
  const saveMonthlyLimit = () => {
    const val = Number(monthlyLimitInput);
    if (!val || val < 1) return;
    setAnonRateLimits(company.id, { monthly: val });
    setMonthlyLimitInput("");
  };

  // Reports visible to a staff member based on HR scope (or full oversight for director/owner/ops manager)
  const visibleReports = data.anonymousReports.filter((r) => {
    if (currentUser.role === "director" || currentUser.role === "ops_manager" || isOwner) return true;
    if (currentUser.role === "station_manager") return r.stationId === currentUser.stationId;
    if (isHRAnon) return hrStations === null || hrStations.includes(r.stationId);
    return false;
  });

  const currentHandlerLabel = (r) => levelLabel(r.escalationLevel || 0, data, t, lang);
  const canReplyTo = (r) => {
    const level = r.escalationLevel || 0;
    if (!handlersForLevel(level, r, data).some((h) => h.id === currentUser.id)) return false;
    return level === 0 ? true : canAct;
  };
  const isAtTop = (r) => (r.escalationLevel || 0) >= STAGE_COUNT - 1;
  const isConfidentialHidden = (r) => r.confidential && r.confidentialBy !== currentUser.id;
  const toggleConfidential = (id) => {
    updateCompany(company.id, (d) => {
      const r = d.anonymousReports.find((x) => x.id === id);
      if (!r) return;
      if (r.confidential && r.confidentialBy === currentUser.id) {
        r.confidential = false;
        r.confidentialBy = null;
      } else if (!r.confidential) {
        r.confidential = true;
        r.confidentialBy = currentUser.id;
      }
    });
  };

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
    const stationManagers = data.employees.filter((e) => e.role === "station_manager" && e.stationId === currentUser.stationId);
    for (const h of stationManagers) addNotification(company.id, h.id, `New ${t(type)} report at ${station?.name || ""} (${t(priority)}).`);
    setMessage("");
    setFiles([]);
  };

  const decide = (id, decision) => {
    const txt = (replyText[id] || "").trim();
    const rep = data.anonymousReports.find((x) => x.id === id);
    if (!rep) return;
    updateCompany(company.id, (d) => {
      const r = d.anonymousReports.find((x) => x.id === id);
      if (!r) return;
      if (txt) {
        r.replies = r.replies || [];
        r.replies.push({ level: r.escalationLevel || 0, role: currentUser.role, authorName: currentUser.name, text: txt, files: replyFiles[id] || [], createdAt: new Date().toISOString() });
      }
      r.status = "closed";
      r.resolution = decision;
    });
    const author = rep.authorId ? data.employees.find((e) => e.id === rep.authorId) : data.employees.find((e) => e.anonymousId === rep.anonymousId);
    if (author) addNotification(company.id, author.id, `Your anonymous ${t(rep.type)} was ${t(decision)}.`);
    setReplyText({ ...replyText, [id]: "" });
    setReplyFiles({ ...replyFiles, [id]: [] });
  };

  const escalate = (id) => {
    const rep = data.anonymousReports.find((x) => x.id === id);
    if (!rep) return;
    const nextLevel = (rep.escalationLevel || 0) + 1;
    if (nextLevel >= STAGE_COUNT) return;
    updateCompany(company.id, (d) => {
      const r = d.anonymousReports.find((x) => x.id === id);
      if (r) { r.escalationLevel = nextLevel; r.status = "open"; }
    });
    const nextHandlers = handlersForLevel(nextLevel, rep, data);
    for (const h of nextHandlers) addNotification(company.id, h.id, `Escalated anonymous report at ${stationName(rep.stationId)} — now requires your attention.`);
  };

  // Escalation timeline showing each level and its reply
  const renderTimeline = (r) => (
    <div className="space-y-2 pt-2 border-t border-border">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{t("escalationChain")}</p>
      {Array.from({ length: STAGE_COUNT }).map((_, idx) => {
        const replyAtLevel = (r.replies || []).find((rp) => rp.level === idx);
        const isCurrent = (r.escalationLevel || 0) === idx;
        const isPast = (r.escalationLevel || 0) > idx;
        const label = levelLabel(idx, data, t, lang);
        return (
          <div key={idx} className={`flex items-start gap-2 text-xs font-body ${isPast ? "opacity-50" : ""}`}>
            <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${replyAtLevel ? "bg-accent text-accent-foreground" : isCurrent ? "bg-amber-100 text-amber-700 border border-amber-300" : "bg-muted text-muted-foreground"}`}>
              {replyAtLevel ? <CheckCircle2 className="w-3 h-3" /> : <span className="text-[9px]">{idx + 1}</span>}
            </div>
            <div className="flex-1">
              <p className={`font-medium ${isCurrent ? "text-foreground" : "text-muted-foreground"}`}>
                {label} {isCurrent && !replyAtLevel && <span className="text-amber-600 font-normal">— {t("waitingReply")}</span>}
              </p>
              {replyAtLevel && (
                <div className="mt-0.5 p-2 rounded bg-muted/50">
                  <p className="text-[10px] text-muted-foreground">{replyAtLevel.authorName} · {formatDateTime(replyAtLevel.createdAt, lang)}</p>
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

  // Station grouping for staff navigation — merges role-based scope with HR scope
  const hrStationList = isHRAnon ? (hrStations === null ? data.stations : data.stations.filter((s) => hrStations.includes(s.id))) : [];
  const stationMap = new Map();
  [...visibleStations(currentUser, data), ...hrStationList].forEach((s) => stationMap.set(s.id, s));
  const myStations = Array.from(stationMap.values());
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
                        <Badge text={currentHandlerLabel(r)} tone="accent" />
                        {r.confidential && <Badge text={t("confidential")} tone="destructive" />}
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
                    <Badge text={currentHandlerLabel(r)} tone="accent" />
                    <Badge text={t(r.status)} tone={r.status === "closed" ? (r.resolution === "approved" ? "accent" : "destructive") : "muted"} />
                    {r.confidential && <Badge text={t("confidential")} tone="destructive" />}
                  </div>
                </div>
                {isConfidentialHidden(r) ? (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground font-body italic p-3 rounded-md bg-muted/40">
                    <Lock className="w-3.5 h-3.5" /> {t("confidentialHidden")}
                  </div>
                ) : (
                  <>
                    <p className="text-sm font-body">{r.message}</p>
                    <CommentAttachments files={r.files} />
                    {renderTimeline(r)}
                  </>
                )}
                {canReplyTo(r) && !isConfidentialHidden(r) && r.status !== "closed" && (
                  <div className="space-y-2 pt-1 border-t border-border">
                    <div className="flex flex-wrap items-end gap-2">
                      <CommentFiles files={replyFiles[r.id] || []} setFiles={(f) => setReplyFiles({ ...replyFiles, [r.id]: f })} />
                      <VoiceRecorder files={replyFiles[r.id] || []} setFiles={(f) => setReplyFiles({ ...replyFiles, [r.id]: f })} />
                    </div>
                    <input value={replyText[r.id] || ""} onChange={(e) => setReplyText({ ...replyText, [r.id]: e.target.value })} placeholder={t("reply")} className="w-full px-3 py-1.5 rounded-md border border-input text-sm font-body" />
                    <div className="flex flex-wrap gap-2">
                      <button onClick={() => decide(r.id, "approved")} className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-emerald-600 text-white text-xs font-body hover:bg-emerald-700">
                        <Check className="w-3.5 h-3.5" /> {t("approveReport")}
                      </button>
                      <button onClick={() => decide(r.id, "rejected")} className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-destructive text-destructive-foreground text-xs font-body hover:opacity-90">
                        <XIcon className="w-3.5 h-3.5" /> {t("rejectReport")}
                      </button>
                      {!isAtTop(r) && (
                        <button onClick={() => escalate(r.id)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-amber-300 text-amber-700 text-xs font-body hover:bg-amber-50">
                          <ArrowUpCircle className="w-3.5 h-3.5" /> {t("escalateNextTier")}
                        </button>
                      )}
                      {(!r.confidential || r.confidentialBy === currentUser.id) && (
                        <button onClick={() => toggleConfidential(r.id)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border text-xs font-body hover:bg-muted">
                          {r.confidential ? <LockOpen className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                          {r.confidential ? t("removeConfidential") : t("makeConfidential")}
                        </button>
                      )}
                    </div>
                  </div>
                )}
                {!canReplyTo(r) && r.status !== "closed" && !isConfidentialHidden(r) && (
                  <p className="text-xs text-muted-foreground font-body italic">
                    {isHRAnon && !canAct ? t("auditTrail") : `${t("escalatedTo")} ${currentHandlerLabel(r)}`}
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