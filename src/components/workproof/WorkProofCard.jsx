import React, { useState } from "react";
import { BadgeCheck, CalendarDays, Car, CheckCircle2, Clock, FileText, Mail, MapPin, PenLine, User, Users } from "lucide-react";
import ProofCertificateDialog from "@/components/workproof/ProofCertificateDialog";
import SendSignLinkDialog from "@/components/workproof/SendSignLinkDialog";
import { Image } from "@/components/ui/image";
import ClientSignDialog from "@/components/workproof/ClientSignDialog";
import CloseJobDialog from "@/components/workproof/CloseJobDialog";
import { idTypeLabel } from "@/components/workproof/CrewEditor";
import { PhotoRow, FileRow, DetailList } from "@/components/workproof/ProofSections";

export default function WorkProofCard({ proof, stationName, ar, onSign, onClose, onSendLink }) {
  const [signOpen, setSignOpen] = useState(false);
  const [closeOpen, setCloseOpen] = useState(false);
  const [linkOpen, setLinkOpen] = useState(false);
  const [certOpen, setCertOpen] = useState(false);
  const signed = proof.status === "signed";
  const inProgress = proof.status === "in_progress";

  const statusChip = signed
    ? { icon: BadgeCheck, text: ar ? "موقّع من العميل" : "Client signed", cls: "border-emerald-400/40 bg-emerald-400/15 text-emerald-100" }
    : inProgress
      ? { icon: Clock, text: ar ? "مهمة جارية" : "Job in progress", cls: "border-sky-300/40 bg-sky-300/15 text-sky-100" }
      : { icon: Clock, text: ar ? "بانتظار توقيع العميل" : "Awaiting client signature", cls: "border-amber-300/45 bg-amber-300/15 text-amber-100" };

  const metaChips = [
    { icon: MapPin, text: stationName },
    { icon: CalendarDays, text: proof.workDate },
    { icon: User, text: proof.performedByName },
  ];

  return (
    <article className="overflow-hidden rounded-xl border border-accent/35 bg-card shadow-soft">
      {/* Certificate head band */}
      <header className="relative overflow-hidden border-b border-accent/40 bg-primary p-4 text-primary-foreground">
        <span className="absolute inset-y-0 start-0 w-1 bg-accent" />
        <span className="pointer-events-none absolute -end-12 -top-16 h-40 w-40 rounded-full border border-accent/20" />
        <div className="relative flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="font-mono text-[10px] tracking-[0.2em] text-accent">{proof.proofNumber}</p>
            <h3 className="truncate font-heading text-lg font-semibold !text-primary-foreground">{proof.workTitle}</h3>
            <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-primary-foreground/70 font-body">
              {metaChips.map(({ icon: Icon, text }) => (
                <span key={text} className="inline-flex items-center gap-1"><Icon className="h-3 w-3" />{text}</span>
              ))}
            </div>
          </div>
          <span className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-body ${statusChip.cls}`}>
            <statusChip.icon className="h-3 w-3" />{statusChip.text}
          </span>
        </div>
      </header>

      <div className="space-y-4 p-4">
        {proof.workDescription && (
          <p className="border-s-2 border-accent/40 ps-3 text-sm leading-relaxed text-foreground/80 font-body">{proof.workDescription}</p>
        )}

        <div className="grid grid-cols-2 gap-2">
          {[
            { label: ar ? "أيام مخططة" : "Planned days", value: proof.plannedDays ?? "—" },
            { label: ar ? "أيام فعلية" : "Actual days", value: proof.actualDays ?? "—" },
          ].map((stat) => (
            <div key={stat.label} className="rounded-lg border border-border bg-muted/30 px-3 py-2">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-body">{stat.label}</p>
              <p className="font-heading text-xl font-semibold leading-tight">{stat.value}</p>
            </div>
          ))}
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <DetailList
            icon={Users}
            label={ar ? "العمال" : "Crew"}
            items={(proof.workers || []).map((w) => `${w.name} — ${idTypeLabel(w.idType, ar)} ${w.idNumber || "—"}${w.phone ? ` · ${w.phone}` : ""}`)}
          />
          <DetailList
            icon={Car}
            label={ar ? "السيارات" : "Vehicles"}
            items={(proof.vehicles || []).map((v) => [v.plate, v.type, [v.make, v.model, v.year].filter(Boolean).join(" "), v.driverName].filter(Boolean).join(" · "))}
          />
          <PhotoRow label={ar ? "قبل العمل" : "Before"} urls={proof.beforeImageUrls} />
          <PhotoRow label={ar ? "بعد العمل" : "After"} urls={proof.afterImageUrls} />
          <FileRow label={ar ? "ملفات قبل" : "Before files"} files={proof.beforeFiles} />
          <FileRow label={ar ? "ملفات بعد" : "After files"} files={proof.afterFiles} />
        </div>
      </div>

      <footer className="space-y-2 border-t border-border bg-secondary/40 p-4">
        {proof.employeeSignatureUrl && (
          <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card p-3">
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-wider text-accent-text font-body">{ar ? "توقيع الموظف (تلقائي عند الإغلاق)" : "Employee signature (auto at close)"}</p>
              <p className="truncate text-sm font-medium font-body">{proof.performedByName}</p>
              {proof.employeeSignedAt && <p className="text-[10px] text-muted-foreground font-body">{new Date(proof.employeeSignedAt).toLocaleString(ar ? "ar" : "en")}</p>}
            </div>
            <Image src={proof.employeeSignatureUrl} alt="employee signature" fittingType="fit" className="h-14 w-32 shrink-0 rounded-md border border-border bg-white" />
          </div>
        )}
        <button onClick={() => setCertOpen(true)} className="inline-flex w-full items-center justify-center gap-2 rounded-md border border-accent/50 bg-card px-4 py-2.5 text-sm font-semibold hover:bg-muted">
          <FileText className="h-4 w-4" />{ar ? "شهادة إثبات العمل (PDF)" : "Work proof certificate (PDF)"}
        </button>
        {signed ? (
          <div className="flex items-center justify-between gap-3 rounded-lg border border-accent/30 bg-card p-3">
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-wider text-accent-text font-body">{ar ? "اعتماد العميل" : "Client approval"}</p>
              <p className="truncate text-sm font-medium font-body">{proof.clientName}{proof.clientTitle ? ` — ${proof.clientTitle}` : ""}</p>
              <p className="text-[10px] text-muted-foreground font-body">{new Date(proof.signedAt).toLocaleString(ar ? "ar" : "en")}</p>
            </div>
            {proof.clientSignatureUrl && (
              <Image src={proof.clientSignatureUrl} alt="signature" fittingType="fit" className="h-14 w-32 shrink-0 rounded-md border border-border bg-white" />
            )}
          </div>
        ) : inProgress ? (
          <button onClick={() => setCloseOpen(true)} className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-95">
            <CheckCircle2 className="h-4 w-4" />{ar ? "إغلاق المهمة" : "Close job"}
          </button>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2">
            <button onClick={() => setLinkOpen(true)} className="inline-flex items-center justify-center gap-2 rounded-md bg-accent px-4 py-2.5 text-sm font-semibold text-accent-foreground hover:opacity-95">
              <Mail className="h-4 w-4" />{ar ? "إرسال رابط التوقيع" : "Email sign link"}
            </button>
            <button onClick={() => setSignOpen(true)} className="inline-flex items-center justify-center gap-2 rounded-md border border-primary px-4 py-2.5 text-sm font-semibold hover:bg-secondary">
              <PenLine className="h-4 w-4" />{ar ? "توقيع في الموقع" : "Sign on site"}
            </button>
          </div>
        )}
      </footer>

      {certOpen && <ProofCertificateDialog proof={proof} stationName={stationName} companyName={proof.companyName || ""} ar={ar} onClose={() => setCertOpen(false)} />}
      {closeOpen && <CloseJobDialog proof={proof} ar={ar} onClose={() => setCloseOpen(false)} onSubmit={async (payload) => { const ok = await onClose(payload); if (ok) setCloseOpen(false); }} />}
      {linkOpen && <SendSignLinkDialog proof={proof} ar={ar} onClose={() => setLinkOpen(false)} onSend={async (payload) => { const ok = await onSendLink(payload); if (ok) setLinkOpen(false); }} />}
      {signOpen && <ClientSignDialog ar={ar} onClose={() => setSignOpen(false)} onSign={async (payload) => { const ok = await onSign(payload); if (ok) setSignOpen(false); }} />}
    </article>
  );
}