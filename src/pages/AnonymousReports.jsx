import React, { useEffect, useState } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/PowerCareAuth";
import { base44 } from "@/api/base44Client";
import { updateCompany, addNotification, getCompanyToken, setAnonRateLimits } from "@/lib/store";
import { visibleStations, hasHRPermission, hrScopeStations, canManageStations } from "@/lib/permissions";
import { handlersForLevel, hasHandlerAtLevel, levelLabel, buildEscalationSteps, escalationStageCount } from "@/lib/escalation";
import { ShieldCheck, Send, Lock, LockOpen, ArrowUpCircle, Building2, ChevronRight, ArrowLeft, X as XIcon } from "lucide-react";
import CommentFiles, { CommentAttachments } from "@/components/tasks/CommentFiles";
import FlowSwipeAction from "@/components/flow/FlowSwipeAction";
import VoiceRecorder from "@/components/tasks/VoiceRecorder";
import EscalationSteps from "@/components/escalation/EscalationSteps";
import EscalationInfoBox from "@/components/escalation/EscalationInfoBox";

const TYPES = ["complaint", "suggestion"];
const PRIORITIES = ["high", "medium", "low"];

export default function AnonymousReports() {
  const { t, dir, lang } = useI18n();
  const { data, currentUser, company } = useAuth();
  const [type, setType] = useState("complaint");
  const [priority, setPriority] = useState("medium");
  const [message, setMessage] = useState("");
  const [replyText, setReplyText] = useState({});
  const [files, setFiles] = useState([]);
  const [replyFiles, setReplyFiles] = useState({});
  const [reportStationId, setReportStationId] = useState("");
  const [selectedStation, setSelectedStation] = useState(null);
  const [monthlyLimitInput, setMonthlyLimitInput] = useState("");
  const [ownReportIds, setOwnReportIds] = useState([]);

  useEffect(() => {
    if (!company?.id || !currentUser?.id) return;
    base44.functions.invoke("companyDirectory", {
      action: "getMyAnonymousReportIds",
      companyId: company.id,
      sessionToken: getCompanyToken(company.id),
    }).then((res) => setOwnReportIds(res?.data?.reportIds || []));
  }, [company?.id, currentUser?.id]);

  if (!data || !currentUser) return null;
  const STAGE_COUNT = escalationStageCount(data);
  const canAct = hasHRPermission(currentUser, data, "manage_anonymous_reports");
  const canView = hasHRPermission(currentUser, data, "view_anonymous_reports");
  const isHRAnon = canAct || canView;
  const hrStations = isHRAnon ? hrScopeStations(currentUser, data) : [];
  const isOwner = currentUser.id === data.ownerId;
  const isStaff = isHRAnon || currentUser.role === "director" || currentUser.role === "ops_manager" || currentUser.role === "station_manager" || isOwner;
  const myAnon = data.anonymousReports.filter((report) => ownReportIds.includes(report.id));
  const now = Date.now();
  const usage = {
    day: myAnon.filter((r) => now - new Date(r.createdAt).getTime() < 86400000).length,
    week: myAnon.filter((r) => now - new Date(r.createdAt).getTime() < 86400000 * 7).length,
    month: myAnon.filter((r) => now - new Date(r.createdAt).getTime() < 86400000 * 30).length,
    dayLimit: data.settings?.rateLimitDaily ?? 3,
    weekLimit: data.settings?.rateLimitWeekly ?? 10,
    monthLimit: data.settings?.rateLimitMonthly ?? 30,
  };

  const stationName = (id) => data.stations.find((s) => s.id === id)?.name || "—";
  const assignedStationIds = [...new Set([
    currentUser.stationId,
    ...(currentUser.stationIds || []),
    ...(currentUser.managedStations || []),
  ].filter(Boolean))];
  const assignedStations = data.stations.filter((station) => assignedStationIds.includes(station.id));
  const effectiveReportStationId = assignedStations.some((station) => station.id === reportStationId)
    ? reportStationId
    : assignedStations[0]?.id || "";
  const displayCode = (r) => r.anonymousId || `ANON-${String(r.id).slice(-8).toUpperCase()}`;
  const saveMonthlyLimit = () => {
    const val = Number(monthlyLimitInput);
    if (!val || val < 1) return;
    setAnonRateLimits(company.id, { monthly: val });
    setMonthlyLimitInput("");
  };

  // Reports visible to a staff member based on HR scope (or full oversight for director/owner/ops manager)
  const visibleReports = data.anonymousReports.filter((r) => {
    if (currentUser.role === "director" || currentUser.role === "ops_manager" || isOwner) return true;
    if (currentUser.role === "station_manager") {
      const managed = currentUser.managedStations?.length ? currentUser.managedStations : [currentUser.stationId];
      return managed.includes(r.stationId);
    }
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
    const assignedStation = assignedStations.find((station) => station.id === effectiveReportStationId);
    if (!assignedStation) {
      alert(lang === "ar" ? "يجب تعيين محطة للموظف قبل إرسال شكوى سرية." : "The employee must have an assigned station before filing an anonymous complaint.");
      return;
    }
    if (usage.day >= usage.dayLimit || usage.week >= usage.weekLimit || usage.month >= usage.monthLimit) return;
    const draft = { stationId: assignedStation.id };
    const initialLevel = Array.from({ length: STAGE_COUNT }).findIndex((_, level) => handlersForLevel(level, draft, data).length > 0);
    if (initialLevel < 0) {
      alert(t("noHandlerAssigned"));
      return;
    }
    const reportId = "anr_" + Math.random().toString(36).slice(2, 9);
    const anonymousId = "ANON-" + crypto.randomUUID().replace(/-/g, "").slice(0, 12).toUpperCase();
    updateCompany(company.id, (d) => {
      d.anonymousReports.unshift({
        id: reportId,
        anonymousId,
        stationId: assignedStation.id,
        type, priority, message,
        files,
        status: "open",
        escalationLevel: initialLevel,
        replies: [],
        createdAt: new Date().toISOString(),
      });
    });
    setOwnReportIds((ids) => [reportId, ...ids]);
    base44.functions.invoke("companyDirectory", {
      action: "registerAnonymousReceipt",
      companyId: company.id,
      reportId,
      sessionToken: getCompanyToken(company.id),
    });
    const station = assignedStation;
    const initialHandlers = handlersForLevel(initialLevel, draft, data);
    for (const handler of initialHandlers) addNotification(company.id, handler.id, `New ${t(type)} report at ${station?.name || ""} (${t(priority)}).`);
    setMessage("");
    setFiles([]);
  };

  const decide = (id, decision) => {
    const txt = (replyText[id] || "").trim();
    const rep = data.anonymousReports.find((x) => x.id === id);
    if (!rep || rep.status !== "open" || !canReplyTo(rep) || !txt) return;
    updateCompany(company.id, (d) => {
      const r = d.anonymousReports.find((x) => x.id === id);
      if (!r) return;
      if (txt) {
        r.replies = r.replies || [];
        r.replies.push({ level: r.escalationLevel || 0, role: currentUser.role, authorName: currentUser.name, text: txt, files: replyFiles[id] || [], createdAt: new Date().toISOString() });
      }
      r.status = decision === "approved" || isAtTop(rep) ? "closed" : "rejected";
      r.resolution = decision;
    });
    base44.functions.invoke("companyDirectory", {
      action: "notifyAnonymousAuthor",
      companyId: company.id,
      reportId: rep.id,
      text: `Your anonymous ${t(rep.type)} was ${t(decision)}.`,
      sessionToken: getCompanyToken(company.id),
    });
    setReplyText({ ...replyText, [id]: "" });
    setReplyFiles({ ...replyFiles, [id]: [] });
  };

  const undoEscalate = (id, previous) => {
    updateCompany(company.id, (d) => {
      const r = d.anonymousReports.find((x) => x.id === id);
      if (r) { r.escalationLevel = previous.escalationLevel || 0; r.status = previous.status; r.resolution = previous.resolution || null; }
    });
  };

  const escalate = (id) => {
    const rep = data.anonymousReports.find((x) => x.id === id);
    if (!rep) return;
    const isAuthorAppeal = ownReportIds.includes(rep.id) && !isStaff;
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
      const r = d.anonymousReports.find((x) => x.id === id);
      if (r) { r.escalationLevel = nextLevel; r.status = "open"; r.resolution = null; }
    });
    for (const h of nextHandlers) addNotification(company.id, h.id, `Escalated anonymous report at ${stationName(rep.stationId)} — now requires your attention.`);
  };

  // Escalation ladder showing each level, its reply (if any), and whether anyone is assigned to it
  const renderTimeline = (r) => {
    const steps = buildEscalationSteps(r.escalationLevel || 0, r, data, t, lang, STAGE_COUNT).map((s) => ({
      ...s,
      reply: (r.replies || []).find((rp) => rp.level === s.idx) || null,
    }));
    return <EscalationSteps steps={steps} t={t} lang={lang} />;
  };

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

  // Drag-and-drop reordering of the station cards (reorders the underlying station list).
  const canReorderStations = canManageStations(currentUser);
  const handleStationDragEnd = (result) => {
    if (!result.destination || !canReorderStations) return;
    const ids = stationGroups.map((g) => g.key);
    const reordered = Array.from(ids);
    const [moved] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, moved);
    updateCompany(company.id, (d) => {
      const byId = Object.fromEntries(d.stations.map((s) => [s.id, s]));
      const positions = [];
      d.stations.forEach((s, i) => { if (ids.includes(s.id)) positions.push(i); });
      const next = [...d.stations];
      positions.forEach((pos, idx) => { next[pos] = byId[reordered[idx]]; });
      d.stations = next;
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-semibold">{t("anonymous")}</h1>
        <p className="text-muted-foreground font-body text-sm mt-1">{isStaff ? t("overview") : t("identityProtected")}</p>
      </div>

      <EscalationInfoBox t={t} />

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
            {assignedStations.length > 1 ? (
              <div>
                <label className="block text-xs text-muted-foreground font-body mb-1">{t("station")}</label>
                <select
                  value={effectiveReportStationId}
                  onChange={(e) => setReportStationId(e.target.value)}
                  className="w-full px-3 py-2 rounded-md border border-input text-sm font-body"
                >
                  {assignedStations.map((station) => <option key={station.id} value={station.id}>{station.name}</option>)}
                </select>
              </div>
            ) : (
              <div className={`flex items-center gap-1.5 text-xs font-body ${effectiveReportStationId ? "text-muted-foreground" : "text-destructive"}`}>
                <Building2 className="w-3.5 h-3.5" />
                {t("station")}: {effectiveReportStationId ? stationName(effectiveReportStationId) : (lang === "ar" ? "لا توجد محطة معيّنة" : "No assigned station")}
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
              <button type="submit" disabled={!effectiveReportStationId || usage.day >= usage.dayLimit || usage.week >= usage.weekLimit || usage.month >= usage.monthLimit} className="flex items-center gap-2 px-4 py-2 rounded-md bg-foreground text-background text-sm font-body hover:bg-accent disabled:opacity-40">
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
                    {!isAtTop(r) && r.status === "rejected" && (
                      <button onClick={() => escalate(r.id)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-amber-300 text-amber-700 text-xs font-body hover:bg-amber-50">
                        <ArrowUpCircle className="w-3.5 h-3.5" /> {t("notConvinced")}
                      </button>
                    )}
                    {isAtTop(r) && r.status === "rejected" && (
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
          {(currentUser.role === "director" || isOwner) && (
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
                <DragDropContext onDragEnd={handleStationDragEnd}>
                  <Droppable droppableId="anon-station-groups">
                    {(provided) => (
                      <div ref={provided.innerRef} {...provided.droppableProps} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {stationGroups.map((g, index) => (
                          <Draggable key={g.key} draggableId={g.key} index={index} isDragDisabled={!canReorderStations}>
                            {(dragProvided, dragSnapshot) => (
                              <button
                                ref={dragProvided.innerRef}
                                {...dragProvided.draggableProps}
                                {...dragProvided.dragHandleProps}
                                onClick={() => setSelectedStation(g.key)}
                                className={`flex items-center justify-between p-4 rounded-lg border border-border bg-card hover:bg-muted transition text-start ${dragSnapshot.isDragging ? "shadow-lg ring-2 ring-accent/40" : ""}`}
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
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </DragDropContext>
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
                {canReplyTo(r) && !isConfidentialHidden(r) && r.status === "open" && (
                  <div className="space-y-2 pt-1 border-t border-border">
                    <div className="flex flex-wrap items-end gap-2">
                      <CommentFiles files={replyFiles[r.id] || []} setFiles={(f) => setReplyFiles({ ...replyFiles, [r.id]: f })} />
                      <VoiceRecorder files={replyFiles[r.id] || []} setFiles={(f) => setReplyFiles({ ...replyFiles, [r.id]: f })} />
                    </div>
                    <input value={replyText[r.id] || ""} onChange={(e) => setReplyText({ ...replyText, [r.id]: e.target.value })} placeholder={t("reply")} className="w-full px-3 py-1.5 rounded-md border border-input text-sm font-body" />
                    <div className="flex flex-wrap gap-2">
                      {(replyText[r.id] || "").trim() && (
                        <div className="w-full">
                          <FlowSwipeAction sensitive label={lang === "ar" ? "اسحب لاعتماد وإغلاق البلاغ" : "Swipe to approve and close"} onAction={() => decide(r.id, "approved")} confirmLabel={t("confirm")} cancelLabel={t("cancel")} />
                        </div>
                      )}
                      <button disabled={!(replyText[r.id] || "").trim()} onClick={() => decide(r.id, "rejected")} className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-destructive text-destructive-foreground text-xs font-body hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed">
                        <XIcon className="w-3.5 h-3.5" /> {t("rejectReport")}
                      </button>
                      {!isAtTop(r) && (
                        <div className="w-full">
                          <FlowSwipeAction label={lang === "ar" ? "اسحب للتصعيد للمستوى التالي" : "Swipe to escalate"} onAction={() => escalate(r.id)} onUndo={() => undoEscalate(r.id, r)} undoLabel={lang === "ar" ? "تراجع عن التصعيد" : "Undo escalation"} />
                        </div>
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