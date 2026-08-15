import React, { useState } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { GripVertical, Layers, Plus, Trash2 } from "lucide-react";
import { updateCompany } from "@/lib/store";
import { orderedJobGrades } from "@/lib/jobGrades";
import { useI18n } from "@/lib/i18n";
import IdentityCard from "@/components/shared/IdentityCard";
import { BORDER, MUTED, NAVY, SURFACE, field, ui, CARD } from "@/lib/platformStyles";

export default function JobGradeManager({ companyId, data }) {
  const { t, lang } = useI18n();
  const ar = lang === "ar";
  const grades = orderedJobGrades(data);
  const [draft, setDraft] = useState({ gradeNumber: "", title: "" });
  const mutate = (fn) => updateCompany(companyId, (company) => {
    company.jobGrades = company.jobGrades || [];
    fn(company.jobGrades);
  });
  const add = () => {
    if (!draft.gradeNumber.trim() || !draft.title.trim()) return;
    mutate((list) => list.push({
      id: `grade_${Date.now().toString(36)}`,
      gradeNumber: draft.gradeNumber.trim(),
      title: draft.title.trim(),
      order: list.length,
    }));
    setDraft({ gradeNumber: "", title: "" });
  };
  const edit = (id, field, value) => mutate((list) => {
    const item = list.find((grade) => grade.id === id);
    if (item) item[field] = value;
  });
  const remove = (id) => updateCompany(companyId, (company) => {
    company.jobGrades = (company.jobGrades || []).filter((grade) => grade.id !== id);
    company.jobGrades.forEach((grade, order) => { grade.order = order; });
    (company.employees || []).forEach((employee) => {
      if (employee.profile?.gradeId === id) employee.profile.gradeId = null;
    });
  });
  const reorder = ({ source, destination }) => {
    if (!destination) return;
    mutate((list) => {
      list.sort((a, b) => a.order - b.order);
      const [item] = list.splice(source.index, 1);
      list.splice(destination.index, 0, item);
      list.forEach((grade, order) => { grade.order = order; });
    });
  };

  return (
    <IdentityCard
      icon={Layers}
      kicker={ar ? "هيكل" : "Structure"}
      title={t("jobGradesManage")}
      subtitle={t("jobGradesDescription")}
      dir={ar ? "rtl" : "ltr"}
      bodySurface
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ padding: 10, borderRadius: 12, border: `1px solid ${BORDER}`, background: CARD }}>
          <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: NAVY }}>{t("jobGradesPurposeTitle")}</p>
          <p style={{ margin: "6px 0 0", fontSize: 12, color: MUTED, lineHeight: 1.55 }}>{t("jobGradesNextStep")}</p>
        </div>
        <div style={{ display: "grid", gap: 8, gridTemplateColumns: "minmax(0,1fr) minmax(0,2fr) auto" }}>
          <input value={draft.gradeNumber} onChange={(e) => setDraft({ ...draft, gradeNumber: e.target.value })} placeholder={t("gradeNumberPlaceholder")} style={field} />
          <input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} placeholder={t("gradeTitle")} style={field} />
          <button type="button" onClick={add} style={{ ...ui.btnPrimary, display: "inline-flex", alignItems: "center", gap: 4, height: 36 }}>
            <Plus style={{ width: 14, height: 14 }} />{t("add")}
          </button>
        </div>
        <DragDropContext onDragEnd={reorder}>
          <Droppable droppableId="job-grades">
            {(provided) => (
              <div ref={provided.innerRef} {...provided.droppableProps} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {grades.map((grade, index) => (
                  <Draggable key={grade.id} draggableId={grade.id} index={index}>
                    {(item) => (
                      <div
                        ref={item.innerRef}
                        {...item.draggableProps}
                        style={{
                          ...item.draggableProps.style,
                          display: "grid",
                          alignItems: "center",
                          gap: 8,
                          gridTemplateColumns: "auto minmax(0,1fr) minmax(0,2fr) auto",
                          padding: 8,
                          borderRadius: 12,
                          border: `1px solid ${BORDER}`,
                          background: CARD,
                        }}
                      >
                        <button type="button" {...item.dragHandleProps} aria-label={t("reorderGrade")} style={{ ...ui.btnGhost, padding: 8, color: MUTED }}>
                          <GripVertical style={{ width: 16, height: 16 }} />
                        </button>
                        <input aria-label={t("gradeNumber")} value={grade.gradeNumber} onChange={(e) => edit(grade.id, "gradeNumber", e.target.value)} style={field} />
                        <input aria-label={t("gradeTitle")} value={grade.title} onChange={(e) => edit(grade.id, "title", e.target.value)} style={field} />
                        <button type="button" aria-label={t("delete")} onClick={() => remove(grade.id)} style={{ ...ui.btnDanger, padding: 8 }}>
                          <Trash2 style={{ width: 16, height: 16 }} />
                        </button>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
                {!grades.length && <p style={{ margin: 0, padding: 16, textAlign: "center", fontSize: 13, color: MUTED, background: SURFACE, borderRadius: 12 }}>{t("noJobGrades")}</p>}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </div>
    </IdentityCard>
  );
}
