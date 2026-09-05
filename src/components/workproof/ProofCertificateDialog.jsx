import React, { useRef, useState } from "react";
import { Download, Loader2, X } from "lucide-react";
import ProofCertificate from "@/components/workproof/ProofCertificate";
import { downloadElementPdf } from "@/lib/downloadElementPdf";

export default function ProofCertificateDialog({ proof, stationName, companyName, ar, onClose }) {
  const ref = useRef(null);
  const [busy, setBusy] = useState(false);

  const download = async () => {
    setBusy(true);
    try {
      await downloadElementPdf(ref.current, `${proof.proofNumber}.pdf`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div className="flex items-center justify-between gap-3 bg-primary px-4 py-3 text-primary-foreground" onClick={(e) => e.stopPropagation()}>
        <p className="truncate font-heading text-base font-semibold">{ar ? "شهادة إثبات العمل" : "Work proof certificate"} — {proof.proofNumber}</p>
        <div className="flex items-center gap-2">
          <button onClick={download} disabled={busy} className="inline-flex items-center gap-2 rounded-md bg-accent px-3 py-2 text-xs font-semibold text-accent-foreground disabled:opacity-50">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}{ar ? "تحميل PDF" : "Download PDF"}
          </button>
          <button onClick={onClose} className="rounded-md p-2 hover:bg-white/10" aria-label="close"><X className="h-4 w-4" /></button>
        </div>
      </div>
      <div className="flex-1 overflow-auto" onClick={(e) => e.stopPropagation()}>
        <ProofCertificate innerRef={ref} proof={proof} stationName={stationName} companyName={companyName} ar={ar} />
      </div>
    </div>
  );
}