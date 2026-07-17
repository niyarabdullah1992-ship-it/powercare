import React, { useState } from "react";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/PowerCareAuth";
import { updateCompany, addNotification } from "@/lib/store";
import { visibleStations, hasHRPermission, hrScopeStations } from "@/lib/permissions";
import { handlersForLevel, hasHandlerAtLevel, levelLabel, escalationStageCount } from "@/lib/escalation";
import { formatDateTime } from "@/lib/dateFormat";
import { Megaphone, Send, Building2, CheckCircle2, ChevronRight, ArrowLeft, Check, X as XIcon, ArrowUpCircle } from "lucide-react";
import CommentFiles, { CommentAttachments } from "@/components/tasks/CommentFiles";
import VoiceRecorder from "@/components/tasks/VoiceRecorder";
import MobileSelect from "@/components/mobile/MobileSelect";

const TYPES = ["complaint", "suggestion"];
const PRIORITIES = ["high", "medium", "low"];

// Identical idea to the anonymous complaints section above, except every report
// here carries the employee's real identity — same submission form, same
// station-by-station escalation chain and staff review flow, just not hidden.
export default function PublicComplaints() {
  const { t, dir, lang } = useI18n();
  const { data, currentUser, company } = useAuth();
  const [type, setType] = useState("complaint");
  const [priority, setPriority] = useState("medium");
  const [message, setMessage] = useState("");
  const [files, setFiles] = useState([]);
  const [replyText, setReplyText] = useState({});
  const [replyFiles, setReplyFiles] = useState({});
  const [selectedStation, setSelectedStation] = useState(null);

  if (!data || !currentUser) return null;
  const reportsList = data.publicReports || [];
  const STAGE_COUNT = escalationStageCount(data);
  const canAct = hasHRPermission(currentUser, data, "manage_anonymous_reports");
  const canView = hasHRPermission(currentUser, data, "view_anonymous_reports");
  const isHRStaff = canAct || canView;
  const hrStations = isHRStaff ? hrScopeStations(currentUser, data) : [];
  const isOwner = currentUser.id === data.ownerId;
  const isStaff = isHRStaff || currentUser.role === "director" || currentUser.role === "ops_manager" || currentUser.role === "station_manager" || isOwner;
  const myReports = reportsList.filter((r) => r.authorId === currentUser.id);

  const stationName = (id) => data.stations.find((s) => s.id === id)?.name || "—";
  const authorName = (r) => data.employees.find((e) => e.id === r.authorId)?.name || "—";

  const visibleReports = reportsList.filter((r) => {
    if (currentUser.role === "director" || currentUser.role === "ops_manager" || isOwner) return true;
    if (currentUser.role === "station_manager") {
      const managed = currentUser.managedStations?.length ? currentUser.managedStations : [currentUser.stationId];
      return managed.includes(r.stationId);
    }
    if (isHRStaff) return hrStations === null || hrStations.includes(r.stationId);
    return false;
  });

  const currentHandlerLabel = (r) => levelLabel(r.escalationLevel || 0, data, t, lang);
  const canReplyTo = (r) => {
    const level = r.escalationLevel || 0;
    if (!handlersForLevel(level, r, data).some((h) => h.id === currentUser.id)) return false;
    return level === 0 ? true : canAct;
  };
  const isAtTop = (r) => (r.escalationLevel || 0) >= STAGE_COUNT - 1;

  const submit = (e) => {
    e.preventDefault();
    if (!message.trim()) return;
    const draft = { stationId: currentUser.stationId || null };
    const initialLevel = Array.from({ length: STAGE_COUNT }).findIndex((_, level) => handlersForLevel(level, draft, data).length > 0);
    if (initialLevel < 0) {
      alert(t("noHandlerAssigned"));
      return;
    }
    updateCompany(company.id, (d) => {
      d.publicReports = d.publicReports || [];
      d.publicReports.unshift({
        id: "pub_" + Math.random().toString(36).slice(2, 9),
        authorId: currentUser.id,
        stationId: currentUser.stationId || null,
        type, priority, message, files,
        status: "open",
        escalationLevel: initialLevel,
        replies: [],
        createdAt: new Date().toISOString(),
      });
    });
    const station = data.stations.find((s) => s.id === currentUser.stationId);
    const initialHandlers = handlersForLevel(initialLevel, draft, data);
    for (const handler of initialHandlers) addNotification(company.id, handler.id, `${currentUser.name} filed a new ${t(type)} at ${station?.name || ""} (${t(priority)}).`);
    setMessage("");
    setFiles([]);
  };

  const decide = (id, decision) => {
    const txt = (replyText[id] || "").trim();
    const rep = reportsList.find((x) => x.id === id);
    if (!rep || rep.status !== "open" || !canReplyTo(rep) || !txt) return;
    updateCompany(company.id, (d) => {
      const r = (d.publicReports || []).find((x) => x.id === id);
      if (!r) return;
      if (txt) {
        r.replies = r.replies || [];
        r.replies.push({ level: r.escalationLevel || 0, role: currentUser.role, authorName: currentUser.name, text: txt, files: replyFiles[id] || [], createdAt: new Date().toISOString() });
      }
      r.status = decision === "approved" || isAtTop(rep) ? "closed" : "rejected";
      r.resolution = decision;
    });
    if (rep.authorId) addNotification(company.id, rep.authorId, `Your ${t(rep.type)} was ${t(decision)}.`);
    setReplyText({ ...replyText, [id]: "" });
    setReplyFiles({ ...replyFiles, [id]: [] });
  };

  const escalate = (id) => {
    const rep = reportsList.find((x) => x.id === id);
    if (!rep) return;
    const isAuthorAppeal = rep.authorId === currentUser.id && !isStaff;
    if (isAuthorAppeal && rep.status !== "rejected") return;
    if (!isAuthorAppeal && (rep.status !== "open" || !canReplyTo(rep))) return;
    const nextLevel = (rep.escalationLevel || 0) + 1;
    if (nextLevel >= STAGE_COUNT) return;
    if (!hasHandlerAtLevel(nextLevel, rep, data)) {
      alert(t("noHandlerAssigned"));
      return;
    }
    const nextHandlers = handlersForLevel(nextLevel, rep, data);
    updateCompany(company.id, (d) => {
      const r = (d.publicReports || []).find((x) => x.id === id);
      if (r) { r.escalationLevel = nextLevel; r.status = "open"; r.resolution = null; }
    });
    for (const h of nextHandlers) addNotification(company.id, h.id, `Escalated public complaint at ${stationName(rep.stationId)} — now requires your attention.`);
  };

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

  const hrStationList = isHRStaff ? (hrStations === null ? data.stations : data.stations.filter((s) => hrStations.includes(s.id))) : [];
  const stationMap = new Map();
  [...visibleStations(currentUser, data), ...hrStationList].forEach((s) => stationMap.set(s.id, s));
  const myStations = Array.from(stationMap.values());
  const stationGroups = myStations.map((s) => ({ key: s.id, name: s.name, count: visibleReports.filter((r) => r.stationId === s.id).length }));
  const stationReports = selectedStation ? visibleReports.filter((r) => r.stationId === selectedStation) : [];
  const selectedStationName = selectedStation ? stationName(selectedStation) : "";

  const reportCard = (r, showAuthor) => (
    <div key={r.id} className="p-4 rounded-xl border border-border bg-card space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-body font-medium">{showAuthor ? authorName(r) : currentUser.name}</span>
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
          {showAuthor && <Badge text={t(r.status)} tone={r.status === "closed" ? (r.resolution === "approved" ? "accent" : "destructive") : "muted"} />}
        </div>
      </div>
      <p className="text-sm font-body">{r.message}</p>
      <CommentAttachments files={r.files} />
      {renderTimeline(r)}
      {!showAuthor && !isAtTop(r) && r.status === "rejected" && (
        <button onClick={() => escalate(r.id)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-amber-300 text-amber-700 text-xs font-body hover:bg-amber-50">
          <ArrowUpCircle className="w-3.5 h-3.5" /> {t("notConvinced")}
        </button>
      )}
      {!showAuthor && isAtTop(r) && r.status === "rejected" && (
        <p className="text-xs text-muted-foreground font-body italic">{t("finalLevel")}</p>
      )}
      {showAuthor && canReplyTo(r) && r.status === "open" && (
        <div className="space-y-2 pt-1 border-t border-border">
          <div className="flex flex-wrap items-end gap-2">
            <CommentFiles files={replyFiles[r.id] || []} setFiles={(f) => setReplyFiles({ ...replyFiles, [r.id]: f })} />
            <VoiceRecorder files={replyFiles[r.id] || []} setFiles={(f) => setReplyFiles({ ...replyFiles, [r.id]: f })} />
          </div>
          <input value={replyText[r.id] || ""} onChange={(e) => setReplyText({ ...replyText, [r.id]: e.target.value })} placeholder={t("reply")} className="w-full px-3 py-1.5 rounded-md border border-input text-sm font-body" />
          <div className="flex flex-wrap gap-2">
            <button disabled={!(replyText[r.id] || "").trim()} onClick={() => decide(r.id, "approved")} className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-emerald-600 text-white text-xs font-body hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed">
              <Check className="w-3.5 h-3.5" /> {t("approveReport")}
            </button>
            <button disabled={!(replyText[r.id] || "").trim()} onClick={() => decide(r.id, "rejected")} className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-destructive text-destructive-foreground text-xs font-body hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed">
              <XIcon className="w-3.5 h-3.5" /> {t("rejectReport")}
            </button>
            {!isAtTop(r) && (
              <button onClick={() => escalate(r.id)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-amber-300 text-amber-700 text-xs font-body hover:bg-amber-50">
                <ArrowUpCircle className="w-3.5 h-3.5" /> {t("escalateNextTier")}
              </button>
            )}
          </div>
        </div>
      )}
      {showAuthor && !canReplyTo(r) && r.status !== "closed" && (
        <p className="text-xs text-muted-foreground font-body italic">
          {isHRStaff && !canAct ? t("auditTrail") : `${t("escalatedTo")} ${currentHandlerLabel(r)}`}
        </p>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Megaphone className="w-5 h-5 text-accent" />
        <h2 className="font-heading text-2xl font-semibold">{t("publicComplaints")}</h2>
      </div>

      {!isStaff && (
        <>
          <form onSubmit={submit} className="p-5 rounded-xl border border-border bg-card space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-muted-foreground font-body mb-1">{t("type")}</label>
                <MobileSelect
                  value={type}
                  onChange={setType}
                  placeholder={t("type")}
                  className="w-full"
                  options={TYPES.map((ty) => ({ value: ty, label: t(ty) }))}
                />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground font-body mb-1">{t("priority")}</label>
                <MobileSelect
                  value={priority}
                  onChange={setPriority}
                  placeholder={t("priority")}
                  className="w-full"
                  options={PRIORITIES.map((p) => ({ value: p, label: t(p) }))}
                />
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
              <p className="text-xs text-muted-foreground font-body">{t("identityVisible")}</p>
              <button type="submit" className="flex items-center gap-2 px-4 py-2 rounded-md bg-foreground text-background text-sm font-body hover:bg-accent">
                <Send className="w-4 h-4" /> {t("fileReport")}
              </button>
            </div>
          </form>

          <div>
            <h3 className="font-heading font-semibold mb-3">{t("yourPublicReports")}</h3>
            {myReports.length === 0 ? (
              <p className="text-sm text-muted-foreground font-body">{t("noPublicReports")}</p>
            ) : (
              <div className="space-y-3">{myReports.map((r) => reportCard(r, false))}</div>
            )}
          </div>
        </>
      )}

      {isStaff && (
        <>
          {!selectedStation ? (
            <div className="space-y-3">
              <h2 className="font-heading text-lg font-semibold flex items-center gap-2">
                <Building2 className="w-4 h-4" /> {t("stations")}
              </h2>
              {stationGroups.length === 0 ? (
                <p className="text-sm text-muted-foreground font-body">{t("noPublicReports")}</p>
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
                          <p className="text-xs text-muted-foreground font-body">{g.count} {t("publicComplaints")}</p>
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
                <p className="text-sm text-muted-foreground font-body">{t("noPublicReports")}</p>
              ) : (
                <div className="space-y-3">{stationReports.map((r) => reportCard(r, true))}</div>
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