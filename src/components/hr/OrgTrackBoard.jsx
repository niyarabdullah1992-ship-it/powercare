import React from "react";
import { ChevronDown, ChevronUp, Pencil, Trash2 } from "lucide-react";
import { useAuth } from "@/lib/PowerCareAuth";
import { canManageEmployees } from "@/lib/permissions";
import { gradesForTrack } from "@/lib/jobGrades";
import { positionsForTrack } from "@/lib/orgPositions";
import { deleteOrgTrack, moveOrgTrack, orderedOrgTracks, saveOrgTrack, trackLabel } from "@/lib/orgTracks";
import { toast } from "@/components/ui/use-toast";
import { BORDER, CARD, MUTED, NAVY, SURFACE, cardShell, ui } from "@/lib/platformStyles";

export default function OrgTrackBoard({ lang = "ar", onOpen, onAssign }) {
  const ar = lang === "ar";
  const { company, data, currentUser, refresh } = useAuth();
  const ownerMode = currentUser?.id === data?.ownerId || currentUser?.role === "owner" || currentUser?.role === "director";
  const canWrite = Boolean(currentUser && (
    canManageEmployees(currentUser, data)
    || ownerMode
    || ["pgm", "admin", "hr_manager"].includes(currentUser.role)
  ));
  const tracks = orderedOrgTracks(data);

  const rename = (track) => {
    if (!company?.id || !canWrite) return;
    const next = window.prompt(ar ? "اسم القائمة" : "List name", track.title || "");
    if (next == null) return;
    const id = saveOrgTrack(company.id, { id: track.id, title: next });
    if (!id) {
      toast({ description: ar ? "اسم القائمة مطلوب." : "A list name is required.", variant: "destructive" });
      return;
    }
    refresh?.();
    toast({ description: ar ? "حُفظ الاسم." : "Name saved." });
  };

  const nextHint = (track) => {
    const seats = positionsForTrack(data, track.id).length;
    const grades = gradesForTrack(data, track.id).length;
    if (!grades) return ar ? "ابدأ بسلّم الدرجات" : "Start with the grade ladder";
    if (!seats) return ar ? "أضف منصباً بصلاحياته" : "Add a seat with access";
    return ar ? "جاهزة لتعيين موظف" : "Ready to assign someone";
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={cardShell}>
        <div style={{ fontSize: 13, fontWeight: 600, color: NAVY }}>
          {ar ? "كيف يُبنى الهيكل" : "How the structure is built"}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10, marginTop: 14 }}>
          {[
            { n: "1", ar: "قائمة", en: "List", hintAr: "قيادي، إداري، فني، تشغيلي", hintEn: "Leadership, admin, technical, operations" },
            { n: "2", ar: "درجات ثم مناصب", en: "Grades then seats", hintAr: "كل قائمة لها سلّمها وصلاحياتها", hintEn: "Each list has its ladder and access" },
            { n: "3", ar: "تعيين للموظف", en: "Assign to a person", hintAr: "منصب بصلاحياته ودرجة من نفس القائمة", hintEn: "A seat with its access and a grade from the same list" },
          ].map((step) => (
            <div key={step.n} style={{ padding: "12px 14px", borderRadius: 12, border: `1px solid ${BORDER}`, background: SURFACE }}>
              <div style={{ fontFamily: "'IBM Plex Sans',sans-serif", fontSize: 11, fontWeight: 600, color: MUTED }}>{step.n}</div>
              <div style={{ marginTop: 4, fontSize: 13, fontWeight: 600, color: NAVY }}>{ar ? step.ar : step.en}</div>
              <div style={{ marginTop: 4, fontSize: 11, color: MUTED, lineHeight: 1.55 }}>{ar ? step.hintAr : step.hintEn}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 12 }}>
        {tracks.map((track, index) => {
          const seats = positionsForTrack(data, track.id).length;
          const grades = gradesForTrack(data, track.id).length;
          return (
            <div
              key={track.id}
              style={{
                background: CARD,
                border: `1px solid ${BORDER}`,
                borderRadius: 16,
                padding: 16,
                display: "flex",
                flexDirection: "column",
                gap: 12,
              }}
            >
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: NAVY }}>{trackLabel(track, ar)}</div>
                  <div style={{ marginTop: 4, fontSize: 11, color: MUTED }}>{nextHint(track)}</div>
                </div>
                <div style={{ fontSize: 11, color: MUTED }}>{index + 1}</div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <span style={{ fontSize: 11, color: MUTED, background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 8, padding: "3px 8px" }}>
                  {ar ? `${seats} مناصب` : `${seats} seats`}
                </span>
                <span style={{ fontSize: 11, color: MUTED, background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 8, padding: "3px 8px" }}>
                  {ar ? `${grades} درجات` : `${grades} grades`}
                </span>
              </div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: "auto" }}>
                <button type="button" onClick={() => onOpen?.(track.id)} style={{ ...ui.btnGhost, height: 34 }}>
                  {ar ? "درجات ومناصب" : "Grades & seats"}
                </button>
                <button type="button" onClick={() => onAssign?.(track.id)} style={{ ...ui.btnPrimary, height: 34 }}>
                  {ar ? "عيّن موظفاً" : "Assign someone"}
                </button>
                {canWrite ? (
                  <>
                    <button type="button" aria-label={ar ? "أعلى" : "Up"} onClick={() => { moveOrgTrack(company.id, track.id, -1); refresh?.(); }} style={ui.btnGhost}>
                      <ChevronUp style={{ width: 14, height: 14 }} />
                    </button>
                    <button type="button" aria-label={ar ? "أسفل" : "Down"} onClick={() => { moveOrgTrack(company.id, track.id, 1); refresh?.(); }} style={ui.btnGhost}>
                      <ChevronDown style={{ width: 14, height: 14 }} />
                    </button>
                    <button type="button" aria-label={ar ? "تعديل" : "Edit"} onClick={() => rename(track)} style={ui.btnGhost}>
                      <Pencil style={{ width: 13, height: 13 }} />
                    </button>
                    <button
                      type="button"
                      aria-label={ar ? "حذف" : "Delete"}
                      onClick={() => {
                        if (!window.confirm(ar ? `حذف قائمة «${trackLabel(track, ar)}»؟` : `Delete “${trackLabel(track, ar)}”?`)) return;
                        const result = deleteOrgTrack(company.id, track.id);
                        if (!result.ok) {
                          toast({
                            description: result.last
                              ? (ar ? "يجب أن تبقى قائمة واحدة." : "At least one list must remain.")
                              : (ar ? "انقل المناصب والدرجات أولاً." : "Move seats and grades first."),
                            variant: "destructive",
                          });
                          return;
                        }
                        refresh?.();
                      }}
                      style={ui.btnDanger}
                    >
                      <Trash2 style={{ width: 13, height: 13 }} />
                    </button>
                  </>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
