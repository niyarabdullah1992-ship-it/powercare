import React, { useState } from "react";
import { Plus, X, Paperclip, PenLine, Clock, FileText, Trash2, Loader2, Package, Users, Target } from "lucide-react";
import { base44 } from "@/api/base44Client";
import ProofCrewEditor from "@/components/proof/ProofCrewEditor";

const EMPTY = { companyName: "", contractNumber: "", projectName: "", purpose: "", crew: [], notes: "", materials: "" };

// بطاقات العميل: بيانات الجهة والعقد والمشروع، المواد المصروفة (اختيارية)،
// مرفقاتها، وتوقيع رقمي للموظف الذي اعتمدها مع التاريخ والوقت.
export default function ProofClientCards({ cards, onChange, employees = [], signerName, ar }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [files, setFiles] = useState([]);
  const [approvedBy, setApprovedBy] = useState(signerName || "");
  const [uploading, setUploading] = useState(false);

  const set = (key) => (event) => setForm((current) => ({ ...current, [key]: event.target.value }));

  const upload = async (event) => {
    const picked = Array.from(event.target.files || []);
    if (!picked.length) return;
    setUploading(true);
    try {
      const uploaded = [];
      for (const file of picked) {
        const res = await base44.integrations.Core.UploadFile({ file });
        uploaded.push({ url: res.file_url, name: file.name });
      }
      setFiles((current) => [...current, ...uploaded]);
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  };

  const save = () => {
    if (!form.companyName.trim()) return;
    onChange([
      ...cards,
      {
        id: `card_${Date.now()}`,
        ...form,
        files,
        enteredByName: signerName || "",
        approvedByName: approvedBy || signerName || "",
        signedAt: new Date().toISOString(),
      },
    ]);
    setForm(EMPTY);
    setFiles([]);
    setApprovedBy(signerName || "");
    setOpen(false);
  };

  const stamp = (iso) => new Date(iso).toLocaleString(ar ? "ar-SA" : "en-GB");

  return (
    <section className="space-y-3 rounded-xl border border-border bg-card p-4 md:p-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">{ar ? "بطاقات العميل" : "Client cards"}</p>
        <button type="button" onClick={() => setOpen(!open)} className="inline-flex items-center gap-1.5 rounded-md border border-accent/40 px-3 py-2 text-xs font-body text-accent hover:bg-accent/5">
          {open ? <X className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />} {open ? (ar ? "إلغاء" : "Cancel") : (ar ? "بطاقة جديدة" : "New card")}
        </button>
      </div>

      {open && (
        <div className="space-y-3 rounded-lg border border-accent/30 bg-secondary/40 p-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-xs text-muted-foreground font-body">
              {ar ? "اسم الشركة" : "Company name"}
              <input value={form.companyName} onChange={set("companyName")} className="mt-1 w-full rounded-md border border-input px-3 py-2 text-sm text-foreground" />
            </label>
            <label className="text-xs text-muted-foreground font-body">
              {ar ? "اسم المشروع" : "Project name"}
              <input value={form.projectName} onChange={set("projectName")} className="mt-1 w-full rounded-md border border-input px-3 py-2 text-sm text-foreground" />
            </label>
            <label className="text-xs text-muted-foreground font-body">
              {ar ? "رقم العقد" : "Contract number"}
              <input value={form.contractNumber} onChange={set("contractNumber")} className="mt-1 w-full rounded-md border border-input px-3 py-2 text-sm text-foreground" dir="ltr" />
            </label>
            <label className="text-xs text-muted-foreground font-body">
              <span className="inline-flex items-center gap-1.5"><Target className="h-3 w-3" /> {ar ? "الغرض من الدخول" : "Purpose of entry"}</span>
              <input value={form.purpose} onChange={set("purpose")} placeholder={ar ? "مثال: صيانة دورية" : "e.g. scheduled maintenance"} className="mt-1 w-full rounded-md border border-input px-3 py-2 text-sm text-foreground" />
            </label>
          </div>

          <ProofCrewEditor
            value={form.crew}
            onChange={(crew) => setForm((current) => ({ ...current, crew }))}
            employees={employees}
            ar={ar}
          />

          <label className="block text-xs text-muted-foreground font-body">
            {ar ? "ملاحظات" : "Notes"}
            <input value={form.notes} onChange={set("notes")} className="mt-1 w-full rounded-md border border-input px-3 py-2 text-sm text-foreground" />
          </label>

          <label className="block text-xs text-muted-foreground font-body">
            <span className="inline-flex items-center gap-1.5"><Package className="h-3 w-3" /> {ar ? "المواد المصروفة (اختياري — بلا تكاليف)" : "Materials issued (optional — no costs)"}</span>
            <textarea value={form.materials} onChange={set("materials")} rows={2} placeholder={ar ? "كل مادة في سطر: الاسم والكمية" : "One material per line: name and quantity"} className="mt-1 w-full resize-y rounded-md border border-input px-3 py-2 text-sm text-foreground" />
          </label>

          <div className="flex flex-wrap items-center gap-2">
            <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-border px-3 py-2 text-xs font-body hover:bg-muted">
              {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Paperclip className="h-3.5 w-3.5" />} {ar ? "إرفاق ملفات" : "Attach files"}
              <input type="file" multiple className="hidden" onChange={upload} />
            </label>
            {files.map((file) => (
              <span key={file.url} className="inline-flex items-center gap-1.5 rounded-md border border-border px-2 py-1 text-[11px] font-body">
                <FileText className="h-3 w-3" /> {file.name}
                <button type="button" onClick={() => setFiles((current) => current.filter((entry) => entry.url !== file.url))}><X className="h-3 w-3" /></button>
              </span>
            ))}
          </div>

          <div className="space-y-2 rounded-lg border border-border bg-card p-3">
            <p className="text-xs font-semibold text-foreground">{ar ? "الاعتماد والتوقيع الرقمي" : "Approval & digital signature"}</p>
            <label className="block text-xs text-muted-foreground font-body">
              {ar ? "الموظف الذي اعتمد البطاقة" : "Employee approving this card"}
              <input list="proof-approvers" value={approvedBy} onChange={(event) => setApprovedBy(event.target.value)} className="mt-1 w-full rounded-md border border-input px-3 py-2 text-sm text-foreground" />
              <datalist id="proof-approvers">
                {employees.map((employee) => <option key={employee.id} value={employee.name} />)}
              </datalist>
            </label>
            <p className="flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground font-body">
              <span className="inline-flex items-center gap-1"><PenLine className="h-3 w-3" /> {ar ? "أدخلها:" : "Entered by:"} {signerName || "—"}</span>
              <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" /> {stamp(new Date().toISOString())}</span>
            </p>
          </div>

          <button type="button" onClick={save} className="w-full rounded-md bg-primary px-4 py-2.5 text-sm font-body text-primary-foreground hover:bg-accent">
            {ar ? "حفظ البطاقة" : "Save card"}
          </button>
        </div>
      )}

      {cards.length === 0 ? (
        <p className="text-sm text-muted-foreground font-body">{ar ? "لا توجد بطاقات بعد." : "No cards yet."}</p>
      ) : (
        <div className="grid gap-2 md:grid-cols-2">
          {cards.map((card) => (
            <article key={card.id} className="space-y-1.5 rounded-lg border border-border p-3">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-semibold text-foreground">{card.companyName}</p>
                <button type="button" onClick={() => onChange(cards.filter((entry) => entry.id !== card.id))} className="text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>
              </div>
              <p className="text-xs text-muted-foreground font-body">
                {card.projectName || ""}
                {card.contractNumber ? ` · ${ar ? "عقد" : "contract"} ${card.contractNumber}` : ""}
              </p>
              {card.purpose && (
                <p className="inline-flex items-center gap-1.5 text-xs text-foreground font-body">
                  <Target className="h-3 w-3 text-muted-foreground" /> {ar ? "الغرض:" : "Purpose:"} {card.purpose}
                </p>
              )}
              {card.crew?.length > 0 && (
                <div className="space-y-1 rounded border border-dashed border-border bg-muted/30 p-2 text-[11px] font-body">
                  <p className="inline-flex items-center gap-1 text-muted-foreground">
                    <Users className="h-3 w-3" /> {ar ? `الموظفون الداخلون (${card.crew.length})` : `Employees entered (${card.crew.length})`}
                  </p>
                  {card.crew.map((crew) => (
                    <p key={crew.id} className="text-foreground">
                      {crew.name}
                      {crew.idNumber ? ` · ${crew.idNumber}` : ""}
                      {(crew.vehicles?.length ? crew.vehicles : []).map((vehicle) => ` · ${vehicle.type}${vehicle.plate ? ` (${vehicle.plate})` : ""}`).join("")}
                    </p>
                  ))}
                </div>
              )}
              {card.notes && <p className="text-xs text-foreground font-body">{card.notes}</p>}
              {card.materials && (
                <p className="whitespace-pre-line rounded border border-dashed border-border bg-muted/30 p-2 text-[11px] text-foreground font-body">
                  <span className="inline-flex items-center gap-1 text-muted-foreground"><Package className="h-3 w-3" /> {ar ? "المواد المصروفة" : "Materials issued"}</span>
                  {"\n"}{card.materials}
                </p>
              )}
              {card.files?.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {card.files.map((file) => (
                    <a key={file.url} href={file.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded border border-border px-2 py-0.5 text-[11px] font-body hover:bg-muted">
                      <FileText className="h-3 w-3" /> {file.name}
                    </a>
                  ))}
                </div>
              )}
              <p className="flex flex-wrap items-center gap-3 text-[11px] text-accent font-body">
                <span className="inline-flex items-center gap-1"><PenLine className="h-3 w-3" /> {ar ? "اعتماد:" : "Approved by:"} {card.approvedByName || card.signedByName || "—"}</span>
                <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" /> {stamp(card.signedAt)}</span>
              </p>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}