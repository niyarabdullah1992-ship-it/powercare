import React, { useState } from "react";
import { useI18n } from "@/lib/i18n";
import { updateEmployeeProfile } from "@/lib/store";
import { Pencil, Check, Briefcase, Building2, CalendarDays, IdCard, MapPin, FileText, Heart, Flag, GraduationCap, PhoneCall, User, Landmark, Layers3, MapPinned, ShieldCheck, FileSignature, BadgeCheck, Plane, HeartPulse, Stethoscope } from "lucide-react";
import MobileSelect from "@/components/mobile/MobileSelect";

// Field groups: label = i18n key for original groups; ar/en = inline labels for
// the HR data-collection group. This list also powers ProfileCompletionCard.
export const PROFILE_GROUPS = [
  { label: "employmentInfo", fields: [
    { key: "position", icon: Briefcase },
    { key: "department", icon: Building2 },
    { key: "hireDate", icon: CalendarDays, type: "date" },
  ] },
  { label: "personalInfo", fields: [
    { key: "nationalId", icon: IdCard },
    { key: "address", icon: MapPin },
    { key: "notes", icon: FileText, area: true, optional: true },
  ] },
  { ar: "بيانات الموارد البشرية", en: "HR Information", fields: [
    { key: "birthDate", icon: CalendarDays, type: "date", ar: "تاريخ الميلاد", en: "Birth date" },
    { key: "gender", icon: User, ar: "الجنس", en: "Gender", options: [
      { value: "", labelAr: "—", labelEn: "—" },
      { value: "male", labelAr: "ذكر", labelEn: "Male" },
      { value: "female", labelAr: "أنثى", labelEn: "Female" },
    ] },
    { key: "nationality", icon: Flag, ar: "الجنسية", en: "Nationality" },
    { key: "maritalStatus", icon: Heart, ar: "الحالة الاجتماعية", en: "Marital status" },
    { key: "qualification", icon: GraduationCap, ar: "المؤهل العلمي", en: "Qualification" },
    { key: "emergencyName", icon: User, ar: "جهة اتصال الطوارئ", en: "Emergency contact" },
    { key: "emergencyPhone", icon: PhoneCall, ar: "هاتف الطوارئ", en: "Emergency phone", dir: "ltr" },
    { key: "iban", icon: Landmark, ar: "الحساب البنكي (IBAN)", en: "Bank account (IBAN)", dir: "ltr" },
  ] },
  { ar: "الالتزام النظامي (الأنظمة السعودية)", en: "Saudi Regulatory Compliance", fields: [
    { key: "idType", icon: IdCard, ar: "نوع الهوية (هوية وطنية / إقامة)", en: "ID type (National ID / Iqama)", optional: true },
    { key: "idExpiry", icon: CalendarDays, type: "date", ar: "تاريخ انتهاء الهوية / الإقامة", en: "ID / Iqama expiry", optional: true },
    { key: "gosiNumber", icon: ShieldCheck, ar: "رقم التأمينات الاجتماعية (GOSI)", en: "GOSI number", dir: "ltr", optional: true },
    { key: "contractType", icon: FileSignature, ar: "نوع العقد (محدد / غير محدد المدة)", en: "Contract type (fixed / indefinite)", optional: true },
    { key: "workPermitNumber", icon: BadgeCheck, ar: "رقم رخصة العمل", en: "Work permit number", dir: "ltr", optional: true },
    { key: "workPermitExpiry", icon: CalendarDays, type: "date", ar: "انتهاء رخصة العمل", en: "Work permit expiry", optional: true },
    { key: "passportNumber", icon: Plane, ar: "رقم الجواز", en: "Passport number", dir: "ltr", optional: true },
    { key: "passportExpiry", icon: CalendarDays, type: "date", ar: "انتهاء الجواز", en: "Passport expiry", optional: true },
    { key: "medicalInsuranceNumber", icon: HeartPulse, ar: "رقم التأمين الطبي", en: "Medical insurance number", dir: "ltr", optional: true },
    { key: "medicalInsuranceExpiry", icon: CalendarDays, type: "date", ar: "انتهاء التأمين الطبي", en: "Medical insurance expiry", optional: true },
    { key: "qiwaJobTitle", icon: Briefcase, ar: "المسمى الوظيفي في قوى", en: "Qiwa job title", optional: true },
    { key: "medicalExamStatus", icon: Stethoscope, ar: "الفحص الطبي", en: "Medical exam status", optional: true },
  ] },
];

export default function ProfessionalInfoTab({ employee, companyId, canEdit, isSelf, canEditGrade, grades, fallbackPosition }) {
  const { t, lang } = useI18n();
  const ar = lang === "ar";
  const [editing, setEditing] = useState(false);
  const profile = employee.profile || {};
  const allFields = PROFILE_GROUPS.flatMap((g) => g.fields.map((f) => f.key));
  const [form, setForm] = useState(() => ({
    ...allFields.reduce((acc, f) => ({ ...acc, [f]: profile[f] || (f === "position" ? fallbackPosition || "" : "") }), {}),
    gradeId: profile.gradeId || "", maxStations: profile.maxStations ?? "",
  }));

  const labelOf = (item) => (item.label ? t(item.label) : ar ? item.ar : item.en);

  const save = () => {
    const payload = { ...form, maxStations: form.maxStations === "" ? null : Number(form.maxStations) };
    if (!canEditGrade) { delete payload.gradeId; delete payload.maxStations; }
    if (!isSelf) delete payload.position;
    if (isSelf && !canEdit) allFields.filter((key) => key !== "position").forEach((key) => delete payload[key]);
    updateEmployeeProfile(companyId, employee.id, payload);
    setEditing(false);
  };

  return (
    <div className="space-y-4">
      {(canEdit || isSelf || canEditGrade) && (
        <div className="flex justify-end">
          {editing ? (
            <button onClick={save} className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-md bg-foreground text-background text-xs font-body">
              <Check className="w-3.5 h-3.5" /> {t("save")}
            </button>
          ) : (
            <button onClick={() => setEditing(true)} className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-md border border-border text-xs font-body hover:bg-muted">
              <Pencil className="w-3.5 h-3.5" /> {t("edit")}
            </button>
          )}
        </div>
      )}

      <div className="space-y-4 rounded-xl border border-border bg-card p-5">
        <h3 className="font-heading text-sm font-semibold uppercase tracking-wide text-muted-foreground">{t("gradeAndStationScope")}</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <div><label className="mb-1.5 flex items-center gap-1.5 text-xs text-muted-foreground"><Layers3 className="h-3.5 w-3.5 text-accent" />{t("jobGrade")}</label>{editing && canEditGrade ? <MobileSelect value={form.gradeId} onChange={(gradeId) => setForm({ ...form, gradeId })} options={[{ value: "", label: "—" }, ...grades.map((grade) => ({ value: grade.id, label: `${grade.gradeNumber} · ${grade.title}` }))]} /> : <p className="min-h-[42px] rounded-lg border border-border bg-background px-3 py-2 text-sm">{grades.find((grade) => grade.id === profile.gradeId) ? `${grades.find((grade) => grade.id === profile.gradeId).gradeNumber} · ${grades.find((grade) => grade.id === profile.gradeId).title}` : "—"}</p>}</div>
          <div><label className="mb-1.5 flex items-center gap-1.5 text-xs text-muted-foreground"><MapPinned className="h-3.5 w-3.5 text-accent" />{t("maxStations")}</label>{editing && canEditGrade ? <input type="number" min="1" value={form.maxStations} onChange={(event) => setForm({ ...form, maxStations: event.target.value })} placeholder="∞" className="w-full rounded-md border border-input px-3 py-2 text-sm" /> : <p className="min-h-[42px] rounded-lg border border-border bg-background px-3 py-2 text-sm">{profile.maxStations || "∞"}</p>}</div>
        </div>
      </div>

      {PROFILE_GROUPS.map((group, gi) => (
        <div key={gi} className="space-y-4 rounded-xl border border-border bg-card p-5">
          <h3 className="font-heading font-semibold text-sm text-muted-foreground uppercase tracking-wide">{labelOf(group)}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {group.fields.map((field) => {
              const { key, icon: Icon, type, area } = field;
              return (
                <div key={key} className={area ? "md:col-span-2" : ""}>
                  <label className="flex items-center gap-1.5 text-xs text-muted-foreground font-body mb-1.5">
                    <Icon className="w-3.5 h-3.5 text-accent" /> {group.label ? t(key) : labelOf(field)}
                  </label>
                  {editing && ((key === "position" && isSelf) || (key !== "position" && canEdit)) ? (
                    field.options ? (
                      <MobileSelect
                        value={form[key]}
                        onChange={(value) => setForm({ ...form, [key]: value })}
                        options={field.options.map((option) => ({ value: option.value, label: ar ? option.labelAr : option.labelEn }))}
                      />
                    ) : area ? (
                      <textarea value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} rows={3} className="w-full px-3 py-2 rounded-md border border-input text-sm font-body resize-none" />
                    ) : (
                      <input type={type || "text"} dir={field.dir} value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} className="w-full px-3 py-2 rounded-md border border-input text-sm font-body" />
                    )
                  ) : (
                    <p className="min-h-[42px] rounded-lg border border-border bg-background px-3 py-2 text-sm font-body" dir={profile[key] ? field.dir : undefined}>{(field.options ? (field.options.find((option) => option.value === profile[key]) || {})[ar ? "labelAr" : "labelEn"] : profile[key]) || (key === "position" ? fallbackPosition : "") || "—"}</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}