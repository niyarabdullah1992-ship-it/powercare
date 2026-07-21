import React, { useMemo, useRef, useState } from "react";
import { Upload, Loader2, FileText, Plus, X, Send, Copy, Check, MousePointerClick, Users, ChevronLeft, ChevronRight, CheckCircle2 } from "lucide-react";
import MultiSignPlacementModal from "@/components/files/MultiSignPlacementModal";
import { base44 } from "@/api/base44Client";
import { generateVerificationId } from "@/lib/verificationBadge";
import { appParams } from "@/lib/app-params";
import { getCompanyToken } from "@/lib/store";

const signingBaseUrl = () => {
  try { if (appParams.appBaseUrl) return String(appParams.appBaseUrl).replace(/\/+$/, ""); } catch { /* use current origin */ }
  return window.location.origin;
};

export default function MultiSignCard({ currentUser, companyId, employees, ar, onCreated }) {
  const [step, setStep] = useState(1);
  const [doc, setDoc] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [signers, setSigners] = useState([{ name: "", email: "", employeeId: null, role: "", stationId: null, signatureUrl: "" }]);
  const [spots, setSpots] = useState({});
  const [placing, setPlacing] = useState(false);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState("");
  const [error, setError] = useState("");
  const fileRef = useRef(null);
  const emailPattern = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
  const validSigners = useMemo(() => signers.filter((signer) => signer.name.trim() && emailPattern.test(signer.email.trim())), [signers]);
  const uniqueSigners = validSigners.length === signers.length && new Set(signers.map((signer) => signer.email.trim().toLowerCase())).size === signers.length;
  const labels = ar ? ["المستند", "الموقّعون والترتيب", "المراجعة والإرسال"] : ["Document", "Signers & order", "Review & send"];

  const upload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) { setError(ar ? "اختر ملف PDF صالحًا." : "Choose a valid PDF file."); return; }
    setUploading(true); setError(""); setResult(null);
    try { const { file_url } = await base44.integrations.Core.UploadFile({ file }); setDoc({ name: file.name, url: file_url }); setSpots({}); setStep(2); }
    finally { setUploading(false); event.target.value = ""; }
  };

  const isCurrentUser = (signer) => signer.email.trim().toLowerCase() === String(currentUser.email || "").trim().toLowerCase();
  const updateSigner = (index, field, value) => setSigners((rows) => rows.map((row, rowIndex) => rowIndex === index ? { ...row, [field]: value } : row));
  const chooseTeamMember = (index, value) => {
    const employee = employees.find((item) => item.email === value || item.name === value);
    if (employee) setSigners((rows) => rows.map((row, rowIndex) => rowIndex === index ? { name: employee.name, email: employee.email || "", employeeId: employee.id || employee.employeeId, role: employee.role || "", stationId: employee.stationId || null, signatureUrl: employee.profile?.signatureUrl || "" } : row));
    else updateSigner(index, "name", value);
  };
  const next = () => {
    if (step === 1 && !doc) return setError(ar ? "ارفع المستند أولًا." : "Upload the document first.");
    if (step === 2 && !uniqueSigners) return setError(ar ? "أدخل اسمًا وبريدًا صالحًا وفريدًا لكل موقّع." : "Enter a valid, unique name and email for every signer.");
    setError(""); setStep((value) => Math.min(3, value + 1));
  };

  const send = async () => {
    setSending(true); setError("");
    try {
      const response = await base44.functions.invoke("multiSign", { action: "create", companyId, sessionToken: getCompanyToken(companyId), creatorId: currentUser.id, creatorName: currentUser.name, creatorEmail: currentUser.email || "", fileName: doc.name, docUrl: doc.url, verificationId: generateVerificationId(), signers: validSigners.map((signer, index) => ({ ...signer, spots: spots[index]?.length ? spots[index] : [{ id: `auto-${index}`, type: "signature", label: "", page: 1, x: 75, y: 88, scale: 100 }] })), appUrl: signingBaseUrl(), lang: ar ? "ar" : "en" });
      setResult(response.data); onCreated?.();
    } catch (err) { setError((ar ? "تعذّر إنشاء الطلب — " : "Couldn't create the request — ") + (err?.response?.data?.error || err.message)); }
    finally { setSending(false); }
  };
  const reset = () => { setStep(1); setDoc(null); setSigners([{ name: "", email: "", employeeId: null, role: "", stationId: null, signatureUrl: "" }]); setSpots({}); setResult(null); };
  const copyLink = (email, link) => { navigator.clipboard.writeText(link).catch(() => {}); setCopied(email); setTimeout(() => setCopied(""), 1500); };

  if (result) return <div className="rounded-2xl border border-emerald-200 bg-card p-6 shadow-sm"><div className="mb-4 flex items-center gap-3 text-emerald-700"><CheckCircle2 className="h-6 w-6" /><h2 className="font-heading text-xl font-semibold">{ar ? "أُرسل طلب التوقيع" : "Signature request sent"}</h2></div><p className="mb-4 text-sm text-muted-foreground">{ar ? "تم إشعار أول موقّع، وسيُشعر النظام كل موقّع تلقائيًا عند حلول دوره." : "The first signer was notified; each next signer will be notified automatically when their turn starts."}</p><div className="space-y-2">{Object.entries(result.links || {}).map(([email, link]) => <div key={email} className="flex items-center gap-2 rounded-lg bg-muted p-2"><span dir="ltr" className="min-w-0 flex-1 truncate text-xs">{email}</span><button onClick={() => copyLink(email, link)} className="inline-flex items-center gap-1 rounded-md border border-border bg-card px-2 py-1 text-xs">{copied === email ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}{ar ? "نسخ" : "Copy"}</button></div>)}</div><button onClick={reset} className="mt-5 rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground">{ar ? "طلب جديد" : "New request"}</button></div>;

  return (
    <section className="rounded-2xl border border-border bg-card p-5 shadow-sm md:p-7">
      <div className="mb-6"><h2 className="flex items-center gap-2 font-heading text-xl font-semibold"><Users className="h-5 w-5 text-accent" />{ar ? "إرسال مستند للتوقيع" : "Send a document for signing"}</h2><p className="mt-1 text-xs text-muted-foreground">{ar ? "ارفع، رتّب الموقّعين، ثم أرسل — ثلاث خطوات فقط." : "Upload, order signers, then send — only three steps."}</p></div>
      <div className="mb-8 grid grid-cols-3 gap-2">{labels.map((label, index) => { const number = index + 1; return <div key={label} className="min-w-0"><div className={`mb-2 h-1.5 rounded-full ${number <= step ? "bg-accent" : "bg-muted"}`} /><p className={`truncate text-[10px] sm:text-xs ${number === step ? "font-semibold text-foreground" : "text-muted-foreground"}`}>{number}. {label}</p></div>; })}</div>

      {step === 1 && <div className="rounded-xl border-2 border-dashed border-border bg-muted/30 p-8 text-center"><Upload className="mx-auto mb-3 h-8 w-8 text-accent" /><p className="mb-4 text-sm text-muted-foreground">{doc ? doc.name : ar ? "ارفع مستند PDF المراد توقيعه" : "Upload the PDF document to sign"}</p><button onClick={() => fileRef.current?.click()} disabled={uploading} className="inline-flex items-center gap-2 rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-accent-foreground">{uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}{ar ? "اختيار المستند" : "Choose document"}</button><input ref={fileRef} type="file" accept="application/pdf" className="hidden" onChange={upload} /></div>}

      {step === 2 && <div className="space-y-3"><datalist id="team-signers">{employees.filter((employee) => employee.email).map((employee) => <option key={employee.id || employee.employeeId} value={employee.name}>{employee.email}</option>)}</datalist>{signers.map((signer, index) => { const self = isCurrentUser(signer); return <div key={index} className={`grid gap-2 rounded-xl border p-3 sm:grid-cols-[1fr_1fr_auto] ${self ? "border-accent/50 bg-accent/5" : "border-border"}`}><div className="relative"><input readOnly={self} list={self ? undefined : "team-signers"} value={signer.name} onChange={(event) => chooseTeamMember(index, event.target.value)} placeholder={ar ? "ابحث في الفريق أو أدخل الاسم" : "Search team or enter name"} className={`w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ${self ? "pe-14" : ""}`} />{self && <span className="absolute end-2 top-1/2 -translate-y-1/2 rounded-full bg-accent px-2 py-0.5 text-[10px] font-semibold text-accent-foreground">{ar ? "أنت" : "You"}</span>}</div><input readOnly={self} value={signer.email} onChange={(event) => updateSigner(index, "email", event.target.value)} placeholder={ar ? "البريد الإلكتروني" : "Email address"} dir="ltr" className="rounded-lg border border-input bg-background px-3 py-2 text-sm read-only:cursor-default read-only:bg-muted/60" />{signers.length > 1 && <button onClick={() => setSigners((rows) => rows.filter((_, rowIndex) => rowIndex !== index))} className="rounded-lg p-2 text-muted-foreground hover:bg-muted"><X className="h-4 w-4" /></button>}</div>; })}<div className="flex flex-wrap items-center gap-4"><button onClick={() => setSigners((rows) => [...rows, { name: "", email: "", employeeId: null, role: "", stationId: null, signatureUrl: "" }])} className="inline-flex items-center gap-2 text-sm font-medium text-accent"><Plus className="h-4 w-4" />{ar ? "إضافة موقّع" : "Add signer"}</button>{doc && validSigners.length > 0 && <button onClick={() => setPlacing(true)} className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground"><MousePointerClick className="h-4 w-4" />{ar ? "تخصيص مواضع التوقيع (اختياري)" : "Customize signature fields (optional)"}</button>}</div></div>}

      {step === 3 && <div className="space-y-4"><div className="rounded-xl border border-border p-4"><p className="mb-1 text-xs text-muted-foreground">{ar ? "المستند" : "Document"}</p><p className="flex items-center gap-2 text-sm font-medium"><FileText className="h-4 w-4 text-accent" />{doc.name}</p></div><div className="rounded-xl border border-border p-4"><p className="mb-3 text-xs text-muted-foreground">{ar ? "الموقّعون والحقول بالترتيب" : "Signers and fields in order"}</p><div className="space-y-2">{validSigners.map((signer, index) => <div key={signer.email} className="flex items-center gap-3 text-sm"><span className="flex h-7 w-7 items-center justify-center rounded-full bg-accent/15 text-xs font-semibold text-accent">{index + 1}</span><span className="font-medium">{signer.name}</span><span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">{Math.max(1, (spots[index] || []).filter((field) => field.type === "signature").length)} {ar ? "توقيع" : "signature"} · {(spots[index] || []).filter((field) => field.type === "text").length} {ar ? "نص" : "text"}</span><span dir="ltr" className="ms-auto text-xs text-muted-foreground">{signer.email}</span></div>)}</div></div><button onClick={send} disabled={sending} className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-5 py-3 text-sm font-semibold text-accent-foreground shadow-lg disabled:opacity-50">{sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}{sending ? (ar ? "جارٍ الإرسال…" : "Sending…") : (ar ? "تأكيد وإرسال طلب التوقيع" : "Confirm and send request")}</button></div>}

      {error && <p className="mt-4 text-xs text-destructive">{error}</p>}
      <div className="mt-7 flex items-center justify-between border-t border-border pt-4"><button onClick={() => { setError(""); setStep((value) => Math.max(1, value - 1)); }} disabled={step === 1} className="inline-flex items-center gap-1 rounded-lg border border-border px-4 py-2 text-sm disabled:opacity-30">{ar ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}{ar ? "السابق" : "Back"}</button>{step < 3 && <button onClick={next} className="inline-flex items-center gap-1 rounded-lg bg-primary px-5 py-2 text-sm text-primary-foreground">{ar ? "التالي" : "Continue"}{ar ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}</button>}</div>
      {placing && doc && <MultiSignPlacementModal docUrl={doc.url} signers={validSigners} initialSpots={spots} ar={ar} onConfirm={(value) => { setSpots(value); setPlacing(false); }} onClose={() => setPlacing(false)} />}
    </section>
  );
}