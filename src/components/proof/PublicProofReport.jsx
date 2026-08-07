import React from "react";
import { Camera, FileSignature, MapPin, ShieldCheck, ShieldAlert } from "lucide-react";
import ProofCardsSummary from "@/components/proof/ProofCardsSummary";

// What the company's client sees: the redacted work record plus the integrity check.
export default function PublicProofReport({ info, hashMatches, ar }) {
  const items = info.payload?.items || [];
  const totalPhotos = items.reduce((sum, item) => sum + (item.photoEvidence || 0), 0);
  const onSite = items.filter((item) => item.verifiedOnSite).length;
  const fmt = (value) => (value ? new Date(value).toLocaleDateString(ar ? "ar-SA" : "en-GB") : "—");

  return (
    <div className="space-y-5">
      <div className={`flex items-start gap-3 rounded-xl border-2 p-5 ${hashMatches ? "border-emerald-400 bg-emerald-50" : "border-red-400 bg-red-50"}`}>
        {hashMatches ? <ShieldCheck className="h-9 w-9 shrink-0 text-emerald-700" /> : <ShieldAlert className="h-9 w-9 shrink-0 text-red-700" />}
        <div className="min-w-0">
          <p className={`font-heading text-lg font-semibold ${hashMatches ? "text-emerald-800" : "text-red-800"}`}>
            {hashMatches
              ? (ar ? "إثبات عمل موثّق" : "Verified work record")
              : (ar ? "المحتوى لا يطابق البصمة المسجّلة" : "Content does not match the registered fingerprint")}
          </p>
          <p className={`text-xs font-body ${hashMatches ? "text-emerald-800/80" : "text-red-800/80"}`}>
            {ar
              ? "بصمة SHA-256 محسوبة من محتوى هذا التقرير ومقارنة بالسجل وقت الإصدار."
              : "SHA-256 fingerprint recomputed from this report's content and compared with the registry at issue time."}
          </p>
          <p className="mt-2 break-all font-mono text-[10px] text-muted-foreground" dir="ltr">{info.contentHash}</p>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-5 text-card-foreground">
        <p className="font-mono text-sm font-semibold text-primary" dir="ltr">{info.proofId}</p>
        <h2 className="mt-1 font-heading text-xl font-semibold">{info.projectName || (ar ? "تقرير أعمال" : "Work report")}</h2>
        <div className="mt-3 grid gap-2 text-xs text-muted-foreground font-body sm:grid-cols-2">
          <p>{ar ? "المنفّذ" : "Contractor"}: <span className="text-foreground">{info.companyName || "—"}</span></p>
          <p>{ar ? "العميل" : "Client"}: <span className="text-foreground">{info.clientName || "—"}</span></p>
          <p>{ar ? "الفترة" : "Period"}: <span className="text-foreground" dir="ltr">{fmt(info.periodStart)} – {fmt(info.periodEnd)}</span></p>
          <p>{ar ? "تاريخ الإصدار" : "Issued"}: <span className="text-foreground" dir="ltr">{fmt(info.issuedAt)}</span></p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[[items.length, ar ? "بنود منجزة" : "Completed items"], [totalPhotos, ar ? "أدلة مصوّرة" : "Photo evidence"], [onSite, ar ? "منفَّذة في الموقع" : "On-site verified"]].map(([value, label]) => (
          <div key={label} className="rounded-xl border border-border bg-card p-4 text-center text-card-foreground">
            <p className="font-heading text-2xl font-semibold">{value}</p>
            <p className="text-[11px] text-muted-foreground font-body">{label}</p>
          </div>
        ))}
      </div>

      <ProofCardsSummary cards={info.payload?.clientCards || []} ar={ar} />

      <div className="space-y-2">
        {items.map((item, index) => (
          <div key={index} className="rounded-xl border border-border bg-card p-4 text-card-foreground">
            <p className="text-sm font-medium font-body">{item.title}</p>
            <div className="mt-1.5 flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground font-body">
              <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" />{item.station || "—"}</span>
              <span className="inline-flex items-center gap-1"><Camera className="h-3 w-3" />{item.photoEvidence || 0}</span>
              <span className="inline-flex items-center gap-1"><FileSignature className="h-3 w-3" />{item.attestations || 0}</span>
              <span dir="ltr">{fmt(item.startDate)} → {fmt(item.endDate)}</span>
              <span>{item.completed}/{item.target}</span>
            </div>
          </div>
        ))}
      </div>

      <p className="text-center text-[11px] text-white/50 font-body">
        {ar
          ? "لا يتضمن هذا التقرير أي بيانات تعريفية عن الموظفين — يعرض العمل وأدلته الميدانية فقط."
          : "This report contains no employee identifying data — only the work and its field evidence."}
      </p>
    </div>
  );
}