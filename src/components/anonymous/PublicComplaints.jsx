import React, { useState, useEffect } from "react";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/PowerCareAuth";
import { updateCompany, addNotification } from "@/lib/store";
import { visibleStations, hasHRPermission, hrScopeStations } from "@/lib/permissions";
import useStationScope, { matchesStationScope } from "@/hooks/useStationScope";
import { complaintHandlersForLevel, complaintHasHandlerAtLevel, complaintLevelLabel, complaintEscalationStageCount, isManualComplaintHandler, usesManualComplaintEscalation } from "@/lib/escalation";
import { formatDateTime } from "@/lib/dateFormat";
import { Megaphone, Send, Building2, CheckCircle2, ArrowLeft, X as XIcon, ArrowUpCircle, Lightbulb } from "lucide-react";
import CommentFiles, { CommentAttachments } from "@/components/tasks/CommentFiles";
import VoiceRecorder from "@/components/tasks/VoiceRecorder";
import MobileSelect from "@/components/mobile/MobileSelect";
import FlowSwipeAction from "@/components/flow/FlowSwipeAction";
import VoiceStationList from "@/components/complaints/VoiceStationList";
import { ACCENT, BORDER, MUTED, NAVY, SURFACE, field, labelMuted, textarea, ui, BAD, OK, NEUTRAL, CARD } from "@/lib/platformStyles";

const TYPES = ["complaint", "suggestion"];
const PRIORITIES = ["high", "medium", "low"];

const card = {
  background: CARD,
  border: `1px solid ${BORDER}`,
  borderRadius: "14px",
  padding: "16px 18px",
};

function ToneBadge({ text, tone = "muted" }) {
  const style = tone === "destructive" ? BAD : tone === "accent" ? OK : NEUTRAL;
  return <span style={style}>{text}</span>;
}

// Identical idea to the anonymous complaints section above, except every report
// here carries the employee's real identity — same submission form, same
// station-by-station escalation chain and staff review flow, just not hidden.
export default function PublicComplaints({ lockedType = null, underQueue = false }) {
  const { t, dir, lang } = useI18n();
  const ar = lang === "ar";
  const { data, currentUser, company } = useAuth();
  const stationScope = useStationScope();
  const [type, setType] = useState(lockedType === "suggestion" ? "suggestion" : "complaint");
  const [priority, setPriority] = useState(lockedType === "suggestion" ? "low" : "medium");
  const [message, setMessage] = useState("");
  const [files, setFiles] = useState([]);
  const [replyText, setReplyText] = useState({});
  const [replyFiles, setReplyFiles] = useState({});
  const [selectedStation, setSelectedStation] = useState(null);

  useEffect(() => {
    setSelectedStation(null);
  }, [stationScope]);

  useEffect(() => {
    if (lockedType === "suggestion" || lockedType === "complaint") setType(lockedType);
  }, [lockedType]);

  if (!data || !currentUser) return null;
  const reportsList = (data.publicReports || []).filter((r) => {
    if (lockedType === "suggestion") return r.type === "suggestion" || r.kind === "suggestion";
    if (lockedType === "complaint") return r.type !== "suggestion" && r.kind !== "suggestion";
    return true;
  });
  const STAGE_COUNT = complaintEscalationStageCount(data);
  const manualHandler = isManualComplaintHandler(currentUser, data);
  const canAct = manualHandler || hasHRPermission(currentUser, data, "manage_anonymous_reports");
  const canView = manualHandler || hasHRPermission(currentUser, data, "view_anonymous_reports");
  const isHRStaff = canAct || canView;
  const hrStations = manualHandler ? null : isHRStaff ? hrScopeStations(currentUser, data) : [];
  const isOwner = currentUser.id === data.ownerId;
  const isStaff = isHRStaff || currentUser.role === "director" || currentUser.role === "ops_manager" || currentUser.role === "station_manager" || isOwner;
  const myReports = reportsList.filter((r) => r.authorId === currentUser.id);

  const stationName = (id) => data.stations.find((s) => s.id === id)?.name || "—";
  const authorName = (r) => data.employees.find((e) => e.id === r.authorId)?.name || "—";

  const visibleReports = reportsList.filter((r) => {
    if (!matchesStationScope(r.stationId, stationScope)) return false;
    if (currentUser.role === "director" || currentUser.role === "ops_manager" || isOwner) return true;
    if (currentUser.role === "station_manager") {
      const managed = currentUser.managedStations?.length ? currentUser.managedStations : [currentUser.stationId];
      return managed.includes(r.stationId);
    }
    if (isHRStaff) return hrStations === null || hrStations.includes(r.stationId);
    return false;
  });
  const scopedToOne = stationScope !== "all";

  if (isStaff && scopedToOne && visibleReports.length === 0) return null;
  if (underQueue && isStaff && visibleReports.length === 0) return null;

  const currentHandlerLabel = (r) => complaintLevelLabel(r.escalationLevel || 0, data, t, lang);
  const canReplyTo = (r) => {
    const level = r.escalationLevel || 0;
    if (!complaintHandlersForLevel(level, r, data).some((h) => h.id === currentUser.id)) return false;
    return usesManualComplaintEscalation(data) ? true : level === 0 ? true : canAct;
  };
  const isAtTop = (r) => (r.escalationLevel || 0) >= STAGE_COUNT - 1;

  const submit = (e) => {
    e.preventDefault();
    if (!message.trim()) return;
    const draft = { stationId: currentUser.stationId || null };
    const initialLevel = Array.from({ length: STAGE_COUNT }).findIndex((_, level) => complaintHandlersForLevel(level, draft, data).length > 0);
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
        kind: type === "suggestion" ? "suggestion" : "public",
        status: "open",
        escalationLevel: initialLevel,
        replies: [],
        createdAt: new Date().toISOString(),
      });
    });
    const station = data.stations.find((s) => s.id === currentUser.stationId);
    const initialHandlers = complaintHandlersForLevel(initialLevel, draft, data);
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

  const undoEscalate = (id, previous) => {
    updateCompany(company.id, (d) => {
      const r = (d.publicReports || []).find((x) => x.id === id);
      if (r) { r.escalationLevel = previous.escalationLevel || 0; r.status = previous.status; r.resolution = previous.resolution || null; }
    });
  };

  const escalate = (id) => {
    const rep = reportsList.find((x) => x.id === id);
    if (!rep) return;
    const isAuthorAppeal = rep.authorId === currentUser.id && !isStaff;
    if (isAuthorAppeal && rep.status !== "rejected") return;
    if (!isAuthorAppeal && (rep.status !== "open" || !canReplyTo(rep))) return;
    const nextLevel = (rep.escalationLevel || 0) + 1;
    if (nextLevel >= STAGE_COUNT) return;
    if (!complaintHasHandlerAtLevel(nextLevel, rep, data)) {
      alert(t("noHandlerAssigned"));
      return;
    }
    const nextHandlers = complaintHandlersForLevel(nextLevel, rep, data);
    updateCompany(company.id, (d) => {
      const r = (d.publicReports || []).find((x) => x.id === id);
      if (r) { r.escalationLevel = nextLevel; r.status = "open"; r.resolution = null; }
    });
    for (const h of nextHandlers) addNotification(company.id, h.id, `Escalated public complaint at ${stationName(rep.stationId)} — now requires your attention.`);
  };

  const renderTimeline = (r) => (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px", paddingTop: "10px", borderTop: `1px solid ${BORDER}` }}>
      <p style={{ margin: 0, fontSize: "10px", letterSpacing: "0.06em", color: MUTED, fontWeight: 600 }}>{t("escalationChain")}</p>
      {Array.from({ length: STAGE_COUNT }).map((_, idx) => {
        const replyAtLevel = (r.replies || []).find((rp) => rp.level === idx);
        const isCurrent = (r.escalationLevel || 0) === idx;
        const isPast = (r.escalationLevel || 0) > idx;
        const label = complaintLevelLabel(idx, data, t, lang);
        return (
          <div key={idx} style={{ display: "flex", alignItems: "flex-start", gap: "8px", fontSize: "12px", opacity: isPast ? 0.55 : 1 }}>
            <div style={{
              width: "20px",
              height: "20px",
              borderRadius: "50%",
              flexShrink: 0,
              marginTop: "2px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: replyAtLevel ? ACCENT : isCurrent ? "#FFFBEB" : SURFACE,
              color: replyAtLevel ? "#fff" : isCurrent ? "#B45309" : MUTED,
              border: isCurrent && !replyAtLevel ? "1px solid #FDE68A" : `1px solid ${BORDER}`,
            }}
            >
              {replyAtLevel ? <CheckCircle2 style={{ width: 12, height: 12 }} /> : <span style={{ fontSize: "9px" }}>{idx + 1}</span>}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ margin: 0, fontWeight: 600, color: isCurrent ? NAVY : MUTED }}>
                {label} {isCurrent && !replyAtLevel ? <span style={{ fontWeight: 400, color: "#B45309" }}>— {t("waitingReply")}</span> : null}
              </p>
              {replyAtLevel && (
                <div style={{ marginTop: "4px", padding: "8px 10px", borderRadius: "8px", background: SURFACE }}>
                  <p style={{ margin: 0, fontSize: "10px", color: MUTED }}>{replyAtLevel.authorName} · {formatDateTime(replyAtLevel.createdAt, lang)}</p>
                  <p style={{ margin: "4px 0 0", color: NAVY }}>{replyAtLevel.text}</p>
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
  const myStations = Array.from(stationMap.values()).filter((s) => matchesStationScope(s.id, stationScope));
  const activeStation = scopedToOne ? stationScope : selectedStation;
  const stationGroups = myStations.map((s) => ({ key: s.id, name: s.name, count: visibleReports.filter((r) => r.stationId === s.id).length }));
  const stationReports = activeStation ? visibleReports.filter((r) => r.stationId === activeStation) : [];
  const selectedStationName = activeStation ? stationName(activeStation) : "";

  const isSuggestion = lockedType === "suggestion" || type === "suggestion";
  const HeadingIcon = isSuggestion ? Lightbulb : Megaphone;
  const headingLabel = isSuggestion
    ? (ar ? "الاقتراحات" : t("suggestion"))
    : (ar ? "الشكاوى" : t("complaint"));
  const submitLabel = isSuggestion
    ? (ar ? "إرسال الاقتراح" : "Send suggestion")
    : t("fileReport");
  const identityNote = isSuggestion
    ? (ar ? "يظهر اسمك مع الاقتراح حتى يمكن التواصل معك." : "Your name appears with the suggestion so management can follow up.")
    : t("identityVisible");
  const mineTitle = isSuggestion
    ? (ar ? "اقتراحاتك" : "Your suggestions")
    : t("yourPublicReports");
  const emptyMine = isSuggestion
    ? (ar ? "لا اقتراحات بعد — ابدأ بفكرة واحدة لتحسين العمل." : "No suggestions yet — start with one idea to improve the work.")
    : t("noPublicReports");
  const emptyStaff = isSuggestion
    ? (ar ? "لا اقتراحات في هذا النطاق." : "No suggestions in this scope.")
    : t("noPublicReports");
  const placeholder = isSuggestion
    ? (ar ? "اكتب اقتراحك لتحسين العمل أو الإجراء أو بيئة الفرع..." : "Write your idea to improve the work, process, or station environment…")
    : t("fileReport");

  const emptyMsg = { margin: 0, fontSize: "13px", color: MUTED, textAlign: "center", padding: "20px 0" };

  const reportCard = (r, showAuthor) => (
    <div key={r.id} style={{ ...card, display: "flex", flexDirection: "column", gap: "10px" }}>
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "8px", fontSize: "12px" }}>
          <span style={{ fontWeight: 600, color: NAVY }}>{showAuthor ? authorName(r) : currentUser.name}</span>
          {r.stationId && (
            <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", color: MUTED, fontSize: "11px" }}>
              <Building2 style={{ width: 12, height: 12 }} /> {stationName(r.stationId)}
            </span>
          )}
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
          <ToneBadge text={t(r.type)} />
          <ToneBadge text={t(r.priority)} tone={r.priority === "high" ? "destructive" : "muted"} />
          <ToneBadge text={currentHandlerLabel(r)} tone="accent" />
          {showAuthor && <ToneBadge text={t(r.status)} tone={r.status === "closed" ? (r.resolution === "approved" ? "accent" : "destructive") : "muted"} />}
        </div>
      </div>
      <p style={{ margin: 0, fontSize: "13px", color: NAVY, lineHeight: 1.65 }}>{r.message}</p>
      <CommentAttachments files={r.files} />
      {renderTimeline(r)}
      {!showAuthor && !isAtTop(r) && r.status === "rejected" && (
        <button type="button" onClick={() => escalate(r.id)} style={{ ...ui.btnGhost, display: "inline-flex", alignItems: "center", gap: "6px", borderColor: "#FDE68A", color: "#B45309", alignSelf: "flex-start" }}>
          <ArrowUpCircle style={{ width: 14, height: 14 }} /> {t("notConvinced")}
        </button>
      )}
      {!showAuthor && isAtTop(r) && r.status === "rejected" && (
        <p style={{ margin: 0, fontSize: "11px", color: MUTED, fontStyle: "italic" }}>{t("finalLevel")}</p>
      )}
      {showAuthor && canReplyTo(r) && r.status === "open" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px", paddingTop: "10px", borderTop: `1px solid ${BORDER}` }}>
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-end", gap: "8px" }}>
            <CommentFiles files={replyFiles[r.id] || []} setFiles={(f) => setReplyFiles({ ...replyFiles, [r.id]: f })} />
            <VoiceRecorder files={replyFiles[r.id] || []} setFiles={(f) => setReplyFiles({ ...replyFiles, [r.id]: f })} />
          </div>
          <input value={replyText[r.id] || ""} onChange={(e) => setReplyText({ ...replyText, [r.id]: e.target.value })} placeholder={t("reply")} style={field} />
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            {(replyText[r.id] || "").trim() && (
              <div style={{ width: "100%" }}>
                <FlowSwipeAction sensitive label={lang === "ar" ? (isSuggestion ? "اسحب لاعتماد الاقتراح" : "اسحب لاعتماد وإغلاق البلاغ") : (isSuggestion ? "Swipe to adopt the suggestion" : "Swipe to approve and close")} onAction={() => decide(r.id, "approved")} confirmLabel={t("confirm")} cancelLabel={t("cancel")} />
              </div>
            )}
            <button type="button" disabled={!(replyText[r.id] || "").trim()} onClick={() => decide(r.id, "rejected")} style={{ ...ui.btnDanger, display: "inline-flex", alignItems: "center", gap: "6px", opacity: !(replyText[r.id] || "").trim() ? 0.4 : 1 }}>
              <XIcon style={{ width: 14, height: 14 }} /> {t("rejectReport")}
            </button>
            {!isAtTop(r) && (
              <div style={{ width: "100%" }}>
                <FlowSwipeAction label={lang === "ar" ? "اسحب للتصعيد للمستوى التالي" : "Swipe to escalate"} onAction={() => escalate(r.id)} onUndo={() => undoEscalate(r.id, r)} undoLabel={lang === "ar" ? "تراجع عن التصعيد" : "Undo escalation"} />
              </div>
            )}
          </div>
        </div>
      )}
      {showAuthor && !canReplyTo(r) && r.status !== "closed" && (
        <p style={{ margin: 0, fontSize: "11px", color: MUTED, fontStyle: "italic" }}>
          {isHRStaff && !canAct ? t("auditTrail") : `${t("escalatedTo")} ${currentHandlerLabel(r)}`}
        </p>
      )}
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "14px" }} dir={dir}>
      {!isStaff ? (
      <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", fontWeight: 600, color: NAVY }}>
        <HeadingIcon style={{ width: 16, height: 16, color: ACCENT }} />
        {headingLabel}
      </div>
      ) : null}

      {!isStaff && (
        <>
          <form onSubmit={submit} style={{ ...card, display: "flex", flexDirection: "column", gap: "12px" }}>
            <div style={{ display: "grid", gridTemplateColumns: lockedType ? "1fr" : "1fr 1fr", gap: "10px" }}>
              {!lockedType && (
                <div>
                  <label style={labelMuted}>{t("type")}</label>
                  <MobileSelect value={type} onChange={setType} placeholder={t("type")} className="w-full" options={TYPES.map((ty) => ({ value: ty, label: t(ty) }))} />
                </div>
              )}
              <div>
                <label style={labelMuted}>{t("priority")}</label>
                <MobileSelect value={priority} onChange={setPriority} placeholder={t("priority")} className="w-full" options={PRIORITIES.map((p) => ({ value: p, label: t(p) }))} />
              </div>
            </div>
            {currentUser.stationId && (
              <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: MUTED }}>
                <Building2 style={{ width: 14, height: 14 }} /> {t("station")}: {stationName(currentUser.stationId)}
              </div>
            )}
            <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={4} placeholder={placeholder} required style={{ ...textarea, resize: "none" }} />
            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-end", gap: "8px" }}>
              <CommentFiles files={files} setFiles={setFiles} />
              <VoiceRecorder files={files} setFiles={setFiles} />
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: "10px" }}>
              <p style={{ margin: 0, fontSize: "11px", color: MUTED }}>{identityNote}</p>
              <button type="submit" style={{ ...ui.btnPrimary, display: "inline-flex", alignItems: "center", gap: "6px" }}>
                <Send style={{ width: 14, height: 14 }} /> {submitLabel}
              </button>
            </div>
          </form>

          <div>
            <div style={{ fontSize: "13px", fontWeight: 600, color: NAVY, marginBottom: "10px" }}>{mineTitle}</div>
            {myReports.length === 0 ? (
              <p style={emptyMsg}>{emptyMine}</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>{myReports.map((r) => reportCard(r, false))}</div>
            )}
          </div>
        </>
      )}

      {isStaff && !scopedToOne && !underQueue && (
        <>
          {!activeStation ? (
            <VoiceStationList
              stations={stationGroups}
              onPick={setSelectedStation}
              emptyLabel={emptyStaff}
            />
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <button type="button" onClick={() => setSelectedStation(null)} style={{ ...ui.btnGhost, display: "inline-flex", alignItems: "center", gap: "6px", alignSelf: "flex-start" }}>
                <ArrowLeft style={{ width: 14, height: 14, transform: dir === "rtl" ? "scaleX(-1)" : "none" }} /> {t("back")}
              </button>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", fontWeight: 600, color: NAVY }}>
                <Building2 style={{ width: 16, height: 16 }} /> {selectedStationName}
              </div>
              {stationReports.length === 0 ? (
                <p style={emptyMsg}>{emptyStaff}</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>{stationReports.map((r) => reportCard(r, true))}</div>
              )}
            </div>
          )}
        </>
      )}
      {isStaff && scopedToOne && stationReports.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>{stationReports.map((r) => reportCard(r, true))}</div>
      )}
    </div>
  );
}