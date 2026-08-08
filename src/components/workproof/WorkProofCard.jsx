import React, { useState } from "react";
import { BadgeCheck, CalendarDays, Car, CheckCircle2, Clock, Paperclip, PenLine, Users } from "lucide-react";
import { Image } from "@/components/ui/image";
import ClientSignDialog from "@/components/workproof/ClientSignDialog";
import CloseJobDialog from "@/components/workproof/CloseJobDialog";
import { idTypeLabel } from "@/components/workproof/CrewEditor";

function PhotoRow({ label, urls }) {
  if (!urls?.length) return null;
  return (
    <div>
      <p className="mb-1 text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <div className="flex flex-wrap gap-1.5">
        {urls.map((url) => (
          <a key={url} href={url} target="_blank" rel="noreferrer">
            <Image src={url} alt={label} className="h-14 w-14 rounded-md border border-border" />
          </a>
        ))}
      </div>
    </div>
  );
}

function FileRow({ label, files }) {
  if (!files?.length) return null;
  return (
    <div>
      <p className="mb-1 text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <ul className="space-y-0.5">
        {files.map((file) => (
          <li key={file.url}>
            <a href={file.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-xs font-body text-accent hover:underline">
              <Paperclip className="h-3 w-3" />{file.name}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function WorkProofCard({ proof, stationName, ar, onSign, onClose }) {
  const [signOpen, setSignOpen] = useState(false);
  const [closeOpen, setCloseOpen] = useState(false);
  const signed = proof.status === "signed";
  const inProgress = proof.status === "in_progress";

  const statusChip = signed
    ? { icon: BadgeCheck, text: ar ? "موقّع من العميل" : "Client signed", cls: "border-green-600/30 bg-green-600/10 text-green-700" }
    : inProgress
      ? { icon: Clock, text: ar ? "مهمة جارية" : "Job in progress", cls: "border-blue-600/30 bg-blue-500/10 text-blue-700" }
      : { icon: Clock, text: ar ? "بانتظار توقيع العميل" : "Awaiting client signature", cls: "border-amber-600/30 bg-amber-500/10 text-amber-700" };

  return (
    <div className="space-y-3 rounded-xl border border-border bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-mono text-[10px] text-muted-foreground">{proof.proofNumber}</p>
          <h3 className="truncate font-heading text-base font-semibold">{proof.workTitle}</h3>
          <p className="text-xs text-muted-foreground font-body">{stationName} · {proof.workDate} · {proof.performedByName}</p>
        </div>
        <span className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-1 text-[10px] font-body ${statusChip.cls}`}>
          <statusChip.icon className="h-3 w-3" />{statusChip.text}
        </span>
      </div>

      {proof.workDescription && <p className="text-sm text-foreground/80 font-body">{proof.workDescription}</p>}

      <div className="flex flex-wrap items-center gap-2 text-xs font-body">
        <span className="inline-flex items-center gap-1.5 rounded-md border border-border bg-muted/40 px-2 py-1">
          <CalendarDays className="h-3.5 w-3.5 text-accent" />
          {ar ? "المخطط" : "Planned"}: {proof.plannedDays ?? "—"}
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-md border border-border bg-muted/40 px-2 py-1">
          <CheckCircle2 className="h-3.5 w-3.5 text-accent" />
          {ar ? "الفعلي" : "Actual"}: {proof.actualDays ?? "—"}
        </span>
      </div>

      {proof.workers?.length > 0 && (
        <div>
          <p className="mb-1 flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground"><Users className="h-3 w-3" />{ar ? "العمال" : "Crew"}</p>
          <ul className="space-y-0.5 text-xs font-body">
            {proof.workers.map((worker, index) => (
              <li key={index} className="text-foreground/80">
                {worker.name} — {idTypeLabel(worker.idType, ar)} {worker.idNumber || "—"}{worker.phone ? ` · ${worker.phone}` : ""}
              </li>
            ))}
          </ul>
        </div>
      )}

      {proof.vehicles?.length > 0 && (
        <div>
          <p className="mb-1 flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground"><Car className="h-3 w-3" />{ar ? "السيارات" : "Vehicles"}</p>
          <ul className="space-y-0.5 text-xs font-body">
            {proof.vehicles.map((vehicle, index) => (
              <li key={index} className="text-foreground/80">
                {vehicle.plate}{vehicle.type ? ` · ${vehicle.type}` : ""}{vehicle.driverName ? ` · ${vehicle.driverName}` : ""}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <PhotoRow label={ar ? "قبل" : "Before"} urls={proof.beforeImageUrls} />
        <PhotoRow label={ar ? "بعد" : "After"} urls={proof.afterImageUrls} />
        <FileRow label={ar ? "ملفات قبل" : "Before files"} files={proof.beforeFiles} />
        <FileRow label={ar ? "ملفات بعد" : "After files"} files={proof.afterFiles} />
      </div>

      {signed ? (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-accent/25 bg-accent/5 p-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium font-body">{proof.clientName}{proof.clientTitle ? ` — ${proof.clientTitle}` : ""}</p>
            <p className="text-[10px] text-muted-foreground font-body">{ar ? "وقّع في" : "Signed at"} {new Date(proof.signedAt).toLocaleString(ar ? "ar" : "en")}</p>
          </div>
          {proof.clientSignatureUrl && (
            <Image src={proof.clientSignatureUrl} alt="signature" fittingType="fit" className="h-12 w-28 shrink-0 rounded-md border border-border bg-white" />
          )}
        </div>
      ) : inProgress ? (
        <button onClick={() => setCloseOpen(true)} className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
          <CheckCircle2 className="h-4 w-4" />{ar ? "إغلاق المهمة" : "Close job"}
        </button>
      ) : (
        <button onClick={() => setSignOpen(true)} className="inline-flex items-center gap-2 rounded-md bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground">
          <PenLine className="h-4 w-4" />{ar ? "توقيع العميل الآن" : "Client sign now"}
        </button>
      )}

      {closeOpen && <CloseJobDialog proof={proof} ar={ar} onClose={() => setCloseOpen(false)} onSubmit={async (payload) => { const ok = await onClose(payload); if (ok) setCloseOpen(false); }} />}
      {signOpen && <ClientSignDialog ar={ar} onClose={() => setSignOpen(false)} onSign={async (payload) => { const ok = await onSign(payload); if (ok) setSignOpen(false); }} />}
    </div>
  );
}