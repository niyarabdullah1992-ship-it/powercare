import React, { useState } from "react";
import { Layers, Plus, Trash2 } from "lucide-react";
import { updateCompany } from "@/lib/store";
import { createListGrade, gradesForList, removeListGrade, seedDefaultLadder } from "@/lib/jobGrades";
import { companyLists, createCompanyList, templateLabel } from "@/lib/permissionTemplates";
import { useI18n } from "@/lib/i18n";
import IdentityCard from "@/components/shared/IdentityCard";
import { BORDER, MUTED, SURFACE, field, ui, CARD } from "@/lib/platformStyles";

export default function JobGradeManager({ companyId, data }) {
  const { lang } = useI18n();
  const ar = lang === "ar";
  const packs = companyLists(data);
  const [listId, setListId] = useState(packs[0]?.id || "");
  const [newList, setNewList] = useState("");
  const [draft, setDraft] = useState("");
  const selected = packs.find((pack) => pack.id === listId) || packs[0] || null;
  const activeId = selected?.id || "";
  const grades = gradesForList(data, activeId);

  const mutate = (fn) => updateCompany(companyId, (company) => {
    company.jobGrades = company.jobGrades || [];
    fn(company.jobGrades);
  });
  const edit = (id, key, value) => mutate((list) => {
    const item = list.find((grade) => grade.id === id);
    if (item) item[key] = value;
  });
  const add = () => {
    if (!activeId) return;
    const result = createListGrade(companyId, { title: draft, listId: activeId });
    if (result.ok) setDraft("");
  };
  const createList = () => {
    const name = newList.trim();
    if (!name) return;
    const id = createCompanyList(companyId, name);
    setListId(id);
    setNewList("");
  };

  return (
    <IdentityCard
      icon={Layers}
      kicker={ar ? "قائمة" : "List"}
      title={ar ? "سلّم الدرجات" : "Grade ladder"}
      subtitle={ar
        ? "اكتب اسم الدرجة. الكود يُولَّد تلقائيًا. الصلاحيات تتبع القائمة لا الدرجة."
        : "Type a grade name. The code is generated. Permissions follow the list, not the grade."}
      dir={ar ? "rtl" : "ltr"}
      bodySurface
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <select value={activeId} onChange={(event) => setListId(event.target.value)} style={{ ...field, appearance: "auto" }}>
          {!packs.length ? <option value="">{ar ? "لا قوائم بعد" : "No lists yet"}</option> : null}
          {packs.map((pack) => (
            <option key={pack.id} value={pack.id}>{templateLabel(pack, ar)}</option>
          ))}
        </select>

        <div style={{ display: "grid", gap: 8, gridTemplateColumns: "minmax(0,1fr) auto" }}>
          <input
            value={newList}
            onChange={(event) => setNewList(event.target.value)}
            placeholder={ar ? "اسم قائمة جديدة" : "New list name"}
            style={field}
          />
          <button type="button" onClick={createList} style={{ ...ui.btnPrimary, height: 36, display: "inline-flex", alignItems: "center", gap: 4 }}>
            <Plus style={{ width: 14, height: 14 }} />{ar ? "أضف قائمة" : "Add list"}
          </button>
        </div>

        <div style={{ display: "grid", gap: 8, gridTemplateColumns: "minmax(0,1fr) auto" }}>
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(event) => { if (event.key === "Enter") add(); }}
            placeholder={ar ? "اسم الدرجة — مثل: مبتدئ" : "Grade name — e.g. Junior"}
            style={field}
          />
          <button type="button" onClick={add} style={{ ...ui.btnPrimary, display: "inline-flex", alignItems: "center", gap: 4, height: 36 }}>
            <Plus style={{ width: 14, height: 14 }} />{ar ? "إضافة" : "Add"}
          </button>
        </div>

        {!grades.length ? (
          <button
            type="button"
            disabled={!activeId}
            onClick={() => seedDefaultLadder(companyId, activeId, selected?.ar, ar)}
            style={{ ...ui.btnSecondary, height: 36 }}
          >
            {ar ? "سلّم جاهز: مبتدئ إلى مدير" : "Ready ladder: Junior to Manager"}
          </button>
        ) : null}

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {grades.map((grade) => (
            <div
              key={grade.id}
              style={{
                display: "grid",
                alignItems: "center",
                gap: 8,
                gridTemplateColumns: "minmax(0,1fr) auto",
                padding: 8,
                borderRadius: 12,
                border: `1px solid ${BORDER}`,
                background: CARD,
              }}
            >
              <input aria-label={ar ? "المسمّى" : "Title"} value={grade.title} onChange={(e) => edit(grade.id, "title", e.target.value)} style={field} />
              <button type="button" aria-label={ar ? "حذف" : "Delete"} onClick={() => removeListGrade(companyId, grade.id)} style={{ ...ui.btnDanger, padding: 8 }}>
                <Trash2 style={{ width: 16, height: 16 }} />
              </button>
            </div>
          ))}
          {!grades.length && (
            <p style={{ margin: 0, padding: 16, textAlign: "center", fontSize: 13, color: MUTED, background: SURFACE, borderRadius: 12 }}>
              {ar ? "لا درجات بعد — أضف اسمًا أو اضغط السلّم الجاهز." : "No grades yet — add a name or use the ready ladder."}
            </p>
          )}
        </div>
      </div>
    </IdentityCard>
  );
}
