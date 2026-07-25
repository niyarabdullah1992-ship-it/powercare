import React, { useRef, useState } from "react";
import AcwaDocumentPage from "@/components/acwa/AcwaDocumentPage";
import AcwaDocumentToolbar from "@/components/acwa/AcwaDocumentToolbar";
import { downloadProfilePdf } from "@/lib/downloadProfilePdf";

export default function AcwaDocument({ pages, title, subtitle, documentType, fileName }) {
  const documentRef = useRef(null);
  const [downloading, setDownloading] = useState(false);
  const [progress, setProgress] = useState(0);
  const download = async () => {
    setDownloading(true);
    await document.fonts.ready;
    await downloadProfilePdf(documentRef.current, setProgress, fileName);
    setDownloading(false);
    setProgress(0);
  };
  return <div className="min-h-screen bg-secondary"><AcwaDocumentToolbar title={title} subtitle={subtitle} downloading={downloading} progress={progress} total={pages.length} onDownload={download} /><main ref={documentRef} className="flex flex-col items-center gap-8 overflow-x-auto px-4 py-8">{pages.map((page) => <AcwaDocumentPage key={page.number} page={page} total={pages.length} documentType={documentType} />)}</main></div>;
}