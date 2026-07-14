import React, { useState, useRef } from "react";
import { Users, Upload, Loader2, FileText, Plus, X, Send, Copy, Check } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { generateVerificationId } from "@/lib/verificationBadge";
import { appParams } from "@/lib/app-params";

// Emailed signing links must point to the real app domain — inside the editor
// preview, window.location.origin is the preview frame, not the published app.
const signingBaseUrl = () => {
  try {
    if (appParams.appBaseUrl) return String(appParams.appBaseUrl).replace(/\/+$/, "");
  } catch { /* fall through */ }
  return window.location.origin;
};

// Create a multi-party signature request: upload a PDF, add signers
// (company members or any external email) — each gets a personal signing link.
export default function MultiSignCard({ currentUser, companyId, employees, ar, onCreated }) {
  const [doc, setDoc] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [signers, setSigners] = useState([{ name: "", email: "" }]);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null); // { links }
  const [error, setError] = useState("");
  const [copied, setCopied] = useState("");
  const fileRef = useRef(null);

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError("");
    setResult(null);
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setDoc({ name: file.name, url: file_url });
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const setSigner = (i, field, value) => {
    setSigners((rows) => rows.map((r, idx) => (idx === i ? { ...r, [field]: value } : r)));
  };
  const addFromEmployee = (i, empId) => {
    const emp = employees.find((e) => e.id === empId);
    if (emp) setSigners((rows) => rows.map((r, idx) => (idx === i ? { name: emp.name, email: emp.email || "" } : r)));
  };

  const validSigners = signers.filter((s) => s.name.trim() && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(s.email.trim()));

  const send = async () => {
    setError("");
    setSending(true);
    try {
      const res = await base44.functions.invoke("multiSign", {
        action: "create",
        companyId,
        creatorId: currentUser.id,
        creatorName: currentUser.name,
        creatorEmail: currentUser.email || "",
        fileName: doc.name,
        docUrl: doc.url,
        verificationId: generateVerificationId(),
        signers: validSigners,
        appUrl: signingBaseUrl(),
        lang: ar ? "ar" : "en",
      });
      setResult(res.data);
      setDoc(null);
      setSigners([{ name: "", email: "" }]);
      onCreated?.();
    } catch (err) {
      setError((ar ? "تعذّر إنشاء الطلب — " : "Couldn't create the request — ") + (err?.response?.data?.error || err.message));
    } finally {
      setSending(false);
    }
  };

  const copyLink = (email, link) => {
    navigator.clipboard.writeText(link).catch(() => {});
    setCopied(email);
    setTimeout(() => setCopied(""), 1500);
  };

  return (
    <div className="p-5 rounded-xl border border-border bg-card space-y-3">
      <h3 className="font-heading text-base font-semibold flex items-center gap-2">
        <Users className="w-4 h-4 text-accent" /> {ar ? "توقيع جماعي على مستند" : "Group signing"}
      </h3>
      <p className="text-xs text-muted-foreground font-body">
        {ar
          ? "ارفع ملف PDF وأضف الموقّعين — كلٌّ منهم يستلم رابط توقيع خاصًا به بالبريد، ويمكنهم التوقيع في نفس الوقت من داخل المنصة أو خارجها."
          : "Upload a PDF and add signers — each receives their own signing link by email and can sign at the same time, inside or outside the platform."}
      </p>

      <div className="flex items-center gap-2">
        <button onClick={() => fileRef.current?.click()} disabled={uploading} className="flex items-center gap-1.5 px-3 py-2 rounded-md border border-border text-xs font-body hover:bg-muted">
          {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
          {ar ? "اختيار ملف PDF" : "Choose PDF file"}
        </button>
        <input ref={fileRef} type="file" accept="application/pdf" className="hidden" onChange={handleUpload} />
        {doc && (
          <span className="flex items-center gap-1.5 text-xs font-body text-muted-foreground truncate">
            <FileText className="w-3.5 h-3.5 shrink-0" /> {doc.name}
          </span>
        )}
      </div>

      {/* Signers */}
      <div className="space-y-2">
        {signers.map((s, i) => (
          <div key={i} className="flex items-center gap-2 flex-wrap">
            <input
              value={s.name}
              onChange={(e) => setSigner(i, "name", e.target.value)}
              placeholder={ar ? "اسم الموقّع" : "Signer name"}
              className="flex-1 min-w-[120px] px-3 py-2 rounded-md border border-border bg-background text-xs font-body"
            />
            <input
              value={s.email}
              onChange={(e) => setSigner(i, "email", e.target.value)}
              placeholder={ar ? "البريد الإلكتروني" : "Email"}
              dir="ltr"
              className="flex-1 min-w-[150px] px-3 py-2 rounded-md border border-border bg-background text-xs font-body"
            />
            {employees.length > 0 && (
              <select
                value=""
                onChange={(e) => addFromEmployee(i, e.target.value)}
                className="px-2 py-2 rounded-md border border-border bg-background text-xs font-body max-w-[130px]"
              >
                <option value="">{ar ? "من الفريق…" : "From team…"}</option>
                {employees.filter((e) => e.email).map((e) => (
                  <option key={e.id} value={e.id}>{e.name}</option>
                ))}
              </select>
            )}
            {signers.length > 1 && (
              <button onClick={() => setSigners((rows) => rows.filter((_, idx) => idx !== i))} className="p-1.5 rounded hover:bg-muted text-muted-foreground">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        ))}
        {signers.length < 10 && (
          <button onClick={() => setSigners((rows) => [...rows, { name: "", email: "" }])} className="flex items-center gap-1 text-xs text-accent font-body hover:underline">
            <Plus className="w-3.5 h-3.5" /> {ar ? "إضافة موقّع" : "Add signer"}
          </button>
        )}
      </div>

      <button
        onClick={send}
        disabled={!doc || validSigners.length === 0 || sending}
        className="flex items-center gap-1.5 px-4 py-2 rounded-md bg-foreground text-background text-xs font-body disabled:opacity-40"
      >
        {sending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
        {sending ? (ar ? "جارٍ الإرسال…" : "Sending…") : ar ? "إرسال طلبات التوقيع" : "Send signature requests"}
      </button>

      {result && (
        <div className="text-xs font-body bg-emerald-50 border border-emerald-200 rounded-md px-3 py-2 space-y-1.5">
          <p className="text-emerald-700 font-medium">
            {ar ? "أُرسلت روابط التوقيع بالبريد — ويمكنك نسخها ومشاركتها مباشرة:" : "Signing links emailed — you can also copy and share them directly:"}
          </p>
          {Object.entries(result.links || {}).map(([email, link]) => (
            <div key={email} className="flex items-center gap-2">
              <span className="truncate text-muted-foreground" dir="ltr">{email}</span>
              <button onClick={() => copyLink(email, link)} className="flex items-center gap-1 px-2 py-1 rounded border border-border hover:bg-muted shrink-0">
                {copied === email ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                {ar ? "نسخ الرابط" : "Copy link"}
              </button>
            </div>
          ))}
        </div>
      )}
      {error && <p className="text-xs text-destructive font-body">{error}</p>}
    </div>
  );
}