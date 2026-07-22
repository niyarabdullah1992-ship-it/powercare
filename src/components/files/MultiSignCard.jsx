import React, { useMemo, useRef, useState } from "react";
import { Upload, Loader2, FileText, Plus, X, Send, Copy, Check, MousePointerClick, Users, ChevronLeft, ChevronRight, CheckCircle2 } from "lucide-react";
import MultiSignPlacementModal from "@/components/files/MultiSignPlacementModal";
import MultiSignStepper from "@/components/files/MultiSignStepper";
import { base44 } from "@/api/base44Client";
import { generateVerificationId } from "@/lib/verificationBadge";
import { appParams } from "@/lib/app-params";
import { getCompanyToken } from "@/lib/store";

const SIGNER_COLORS = ["bg-amber-600", "bg-sky-700", "bg-emerald-700", "bg-violet-700", "bg-rose-700", "bg-teal-700"];

const signingBaseUrl = () => {
  try { if (appParams.appBaseUrl) return String(appParams.appBaseUrl).replace(/\/+$/, ""); } catch { /* use current origin */ }
  return window.location.origin;
};

export default function MultiSignCard({ currentUser, companyId, employees, ar, onCreated }) {
  const [step, setStep] = useState(1);
  const [doc, setDoc] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [signers, setSigners] = useState([{ name: "", email: "", employeeId: null, role: "", stationId: null, signatureUrl: "", external: false }]);
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
    if (employee) setSigners((rows) => rows.map((row, rowIndex) => rowIndex === index ? { name: employee.name, email: employee.email || "", employeeId: employee.id || employee.employeeId, role: employee.role || "", stationId: employee.stationId || null, signatureUrl: employee.profile?.signatureUrl || "", external: false } : row));
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
  const reset = () => { setStep(1); setDoc(null); setSigners([{ name: "", email: "", employeeId: null, role: "", stationId: null, signatureUrl: "", external: false }]); setSpots({}); setResult(null); };
  const copyLink = (email, link) => { navigator.clipboard.writeText(link).catch(() => {}); setCopied(email); setTimeout(() => setCopied(""), 1500); };

  if (result) return <div className="rounded-2xl border border-emerald-200 bg-card p-6 shadow-sm"><div className="mb-4 flex items-center gap-3 text-emerald-700"><CheckCircle2 className="h-6 w-6" /><h2 className="font-heading text-xl font-semibold">{ar ? "أُرسل طلب التوقيع" : "Signature request sent"}</h2></div><p className="mb-4 text-sm text-muted-foreground">{ar ? "تم إرسال دعوة مستقلة إلى جميع الموقّعين، ويمكن لكل شخص التوقيع فورًا دون انتظار الآخرين." : "Each signer received an independent invitation and can sign immediately without waiting for anyone else."}</p><div className="space-y-2">{Object.entries(result.links || {}).map(([email, link]) => <div key={email} className="flex items-center gap-2 rounded-lg bg-muted p-2"><span dir="ltr" className="min-w-0 flex-1 truncate text-xs">{email}</span><button onClick={() => copyLink(email, link)} className="inline-flex items-center gap-1 rounded-md border border-border bg-card px-2 py-1 text-xs">{copied === email ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}{ar ? "نسخ" : "Copy"}</button></div>)}</div><button onClick={reset} className="mt-5 rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground">{ar ? "طلب جديد" : "New request"}</button></div>;

  return (
    <section className="rounded-3xl border border-accent/20 bg-card p-5 shadow-soft md:p-7">
      <div className="mb-8"><h2 className="flex items-center gap-2 font-heading text-2xl font-semibold"><Users className="h-6 w-6 text-accent" />{ar ? "إرسال مستند للتوقيع" : "Send a document for signing"}</h2><p className="mt-1 text-sm text-muted-foreground">{ar ? "ارفع، رتّب الموقّعين، ثم أرسل — ثلاث خطوات فقط." : "Upload, order signers, then send — only three steps."}</p></div>
      <MultiSignStepper step={step} labels={labels} ar={ar} />

      {step === 1 && <div className="animate-in fade-in rounded-2xl border-2 border-dashed border-accent/50 bg-landing-bg/60 p-10 text-center sm:p-16"><span className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-accent/10"><Upload className="h-9 w-9 text-accent" /></span><p className="mb-5 text-sm font-medium text-muted-foreground">{doc ? doc.name : ar ? "ارفع مستند PDF المراد توقيعه" : "Upload the PDF document to sign"}</p><button onClick={() => fileRef.current?.click()} disabled={uploading} className="inline-flex min-h-[52px] items-center gap-2 rounded-xl bg-accent px-6 py-3.5 text-[15px] font-bold text-accent-foreground shadow-lg">{uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}{ar ? "اختيار المستند" : "Choose document"}</button><input ref={fileRef} type="file" accept="application/pdf" className="hidden" onChange={upload} /></div>}

      {step === 2 && <div className="animate-in fade-in space-y-4"><datalist id="team-signers">{employees.filter((employee) => employee.email).map((employee) => <option key={employee.id || employee.employeeId} value={employee.name}>{employee.email}</option>)}</datalist>{signers.map((signer, index) => { const self = isCurrentUser(signer); return <div key={index} className={`group relative grid gap-3 rounded-2xl border p-5 ps-16 shadow-sm sm:grid-cols-[1fr_1fr_auto] ${self ? "border-accent/50 bg-accent/5" : "border-accent/20 bg-card"}`}><span className={`absolute start-5 top-5 flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold text-white ${SIGNER_COLORS[index % SIGNER_COLORS.length]}`}>{index + 1}</span><div className="relative"><input readOnly={self} list={self ? undefined : "team-signers"} value={signer.name} onChange={(event) => chooseTeamMember(index, event.target.value)} placeholder={ar ? "ابحث في الفريق أو أدخل الاسم" : "Search team or enter name"} className={`w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ${self || signer.external ? "pe-14" : ""}`} />{self && <span className="absolute end-2 top-1/2 -translate-y-1/2 rounded-full bg-accent px-2 py-0.5 text-[10px] font-semibold text-accent-foreground">{ar ? "أنت" : "You"}</span>}{signer.external && !self && <span className="absolute end-2 top-1/2 -translate-y-1/2 rounded-full bg-secondary px-2 py-0.5 text-[10px] font-semibold text-secondary-foreground">{ar ? "خارجي" : "External"}</span>}</div><input readOnly={self} value={signer.email} onChange={(event) => updateSigner(index, "email", event.target.value)} placeholder={ar ? "البريد الإلكتروني" : "Email address"} dir="ltr" className="rounded-lg border border-input bg-background px-3 py-2 text-sm read-only:cursor-default read-only:bg-muted/60" />{signers.length > 1 && <button onClick={() => setSigners((rows) => rows.filter((_, rowIndex) => rowIndex !== index))} className="rounded-lg p-2 text-muted-foreground opacity-0 transition-opacity hover:bg-muted group-hover:opacity-100 focus:opacity-100"><X className="h-4 w-4" /></button>}</div>; })}<div className="flex flex-wrap items-center gap-4"><button onClick={() => setSigners((rows) => [...rows, { name: "", email: "", employeeId: null, role: "", stationId: null, signatureUrl: "", external: false }])} className="inline-flex items-center gap-2 text-sm font-medium text-accent"><Plus className="h-4 w-4" />{ar ? "إضافة موظف" : "Add employee"}</button><button onClick={() => setSigners((rows) => rows.length === 1 && !rows[0].name && !rows[0].email ? [{ ...rows[0], external: true }] : [...rows, { name: "", email: "", employeeId: null, role: "", stationId: null, signatureUrl: "", external: true }])} className="inline-flex items-center gap-2 text-sm font-medium text-accent"><Plus className="h-4 w-4" />{ar ? "إضافة موقّع خارجي" : "Add external signer"}</button>{doc && validSigners.length > 0 && <button onClick={() => setPlacing(true)} className="inline-flex min-h-12 items-center gap-2 rounded-xl border border-accent/30 bg-accent/10 px-4 text-sm font-bold text-accent shadow-sm"><MousePointerClick className="h-4 w-4" />{ar ? "تخصيص مواضع التوقيع (اختياري)" : "Customize signature fields (optional)"}</button>}</div></div>}

      {step === 3 && <div className="animate-in fade-in space-y-5"><div className="rounded-2xl border border-accent/20 bg-landing-bg/50 p-5 shadow-sm"><p className="mb-1 text-xs text-muted-foreground">{ar ? "المستند" : "Document"}</p><p className="flex items-center gap-2 text-sm font-medium"><FileText className="h-4 w-4 text-accent" />{doc.name}</p></div><div className="overflow-hidden rounded-2xl border border-accent/20 bg-card p-5 shadow-sm"><p className="mb-4 border-b border-border pb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">{ar ? "الموقّعون والحقول بالترتيب" : "Signers and fields in order"}</p><div className="space-y-2">{validSigners.map((signer, index) => <div key={signer.email} className="flex items-center gap-3 text-sm"><span className="flex h-7 w-7 items-center justify-center rounded-full bg-accent/15 text-xs font-semibold text-accent">{index + 1}</span><span className="font-medium">{signer.name}</span><span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">{Math.max(1, (spots[index] || []).filter((field) => field.type === "signature").length)} {ar ? "توقيع" : "signature"} · {(spots[index] || []).filter((field) => field.type === "text").length} {ar ? "نص" : "text"}</span><span dir="ltr" className="ms-auto text-xs text-muted-foreground">{signer.email}</span></div>)}</div></div><button onClick={send} disabled={sending} className="inline-flex min-h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-accent px-6 py-3.5 text-[15px] font-bold text-accent-foreground shadow-lg disabled:opacity-50">{sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}{sending ? (ar ? "جارٍ الإرسال…" : "Sending…") : (ar ? "تأكيد وإرسال طلب التوقيع" : "Confirm and send request")}</button></div>}

      {error && <p className="mt-4 text-xs text-destructive">{error}</p>}
      <div className="mt-7 flex items-center justify-between border-t border-border pt-4"><button onClick={() => { setError(""); setStep((value) => Math.max(1, value - 1)); }} disabled={step === 1} className="inline-flex min-h-[52px] items-center gap-1 rounded-xl border border-border px-5 py-3 text-sm font-semibold disabled:opacity-30">{ar ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}{ar ? "السابق" : "Back"}</button>{step < 3 && <button onClick={next} className="inline-flex min-h-[52px] items-center gap-1 rounded-xl bg-primary px-6 py-3 text-[15px] font-bold text-primary-foreground shadow-md">{ar ? "التالي" : "Continue"}{ar ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}</button>}</div>
      {placing && doc && <MultiSignPlacementModal docUrl={doc.url} signers={validSigners} initialSpots={spots} ar={ar} onConfirm={(value) => { setSpots(value); setPlacing(false); }} onClose={() => setPlacing(false)} />}
    </section>
  );
}