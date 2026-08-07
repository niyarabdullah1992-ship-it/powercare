import React, { useState } from "react";
import { Camera, Loader2, X, CheckCircle2, Clock } from "lucide-react";
import { base44 } from "@/api/base44Client";

// إثبات إنهاء العمل لدى الجهة: صور تُرفع بعد حفظ البطاقة ويعتمدها أحد موظفي المحطة.
export default function ProofCompletionApproval({ card, employees = [], onChange, ar }) {
  const [files, setFiles] = useState([]);
  const [approver, setApprover] = useState("");
  const [uploading, setUploading] = useState(false);
  const completion = card.completion;

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

  const approve = () => {
    if (!files.length || !approver.trim()) return;
    onChange({ completion: { files, approvedByName: approver.trim(), approvedAt: new Date().toISOString() } });
    setFiles([]);
    setApprover("");
  };

  if (completion) {
    return (
      <div className="space-y-1.5 rounded border border-accent/40 bg-accent/5 p-2 text-[11px] font-body">
        <p className="inline-flex items-center gap-1 text-accent">
          <CheckCircle2 className="h-3 w-3" /> {ar ? "إثبات إنهاء العمل معتمد" : "Completion proof approved"}
        </p>
        <p className="flex flex-wrap items-center gap-2 text-muted-foreground">
          <span>{ar ? "اعتماد:" : "Approved by:"} {completion.approvedByName}</span>
          <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" /> {new Date(completion.approvedAt).toLocaleString(ar ? "ar-SA" : "en-GB")}</span>
        </p>
        <div className="flex flex-wrap gap-1.5">
          {completion.files.map((file) => (
            <a key={file.url} href={file.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded border border-border bg-card px-2 py-0.5 hover:bg-muted">
              <Camera className="h-3 w-3" /> {file.name}
            </a>
          ))}
        </div>
        <button type="button" onClick={() => onChange({ completion: null })} className="text-destructive">{ar ? "إزالة الاعتماد" : "Remove approval"}</button>
      </div>
    );
  }

  return (
    <div className="space-y-2 rounded border border-dashed border-border bg-muted/30 p-2 text-[11px] font-body">
      <p className="text-muted-foreground">{ar ? "إثبات إنهاء العمل لدى الجهة" : "Completion proof at the client site"}</p>
      <div className="flex flex-wrap items-center gap-1.5">
        <label className="inline-flex cursor-pointer items-center gap-1 rounded border border-border bg-card px-2 py-1 hover:bg-muted">
          {uploading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Camera className="h-3 w-3" />} {ar ? "رفع صور" : "Upload photos"}
          <input type="file" accept="image/*" multiple className="hidden" onChange={upload} />
        </label>
        {files.map((file) => (
          <span key={file.url} className="inline-flex items-center gap-1 rounded border border-border bg-card px-2 py-1">
            {file.name}
            <button type="button" onClick={() => setFiles((current) => current.filter((entry) => entry.url !== file.url))}><X className="h-3 w-3" /></button>
          </span>
        ))}
      </div>
      <input
        list={`proof-completion-approvers-${card.id}`}
        value={approver}
        onChange={(event) => setApprover(event.target.value)}
        placeholder={ar ? "موظف المحطة المعتمد" : "Approving station employee"}
        className="w-full rounded-md border border-input px-2 py-1.5 text-xs text-foreground"
      />
      <datalist id={`proof-completion-approvers-${card.id}`}>
        {employees.map((employee) => <option key={employee.id} value={employee.name} />)}
      </datalist>
      <button
        type="button"
        onClick={approve}
        disabled={!files.length || !approver.trim()}
        className="w-full rounded-md bg-primary px-3 py-1.5 text-xs text-primary-foreground hover:bg-accent disabled:opacity-50"
      >
        {ar ? "اعتماد الإنهاء" : "Approve completion"}
      </button>
      {(!files.length || !approver.trim()) && (
        <p className="text-muted-foreground">
          {!files.length
            ? (ar ? "ارفع صورة واحدة على الأقل لتفعيل الاعتماد." : "Upload at least one photo to enable approval.")
            : (ar ? "اكتب اسم الموظف المعتمد لتفعيل الاعتماد." : "Enter the approving employee to enable approval.")}
        </p>
      )}
    </div>
  );
}