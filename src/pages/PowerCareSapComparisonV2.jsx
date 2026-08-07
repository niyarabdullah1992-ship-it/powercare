import React, { useRef, useState } from "react";
import ComparisonToolbar from "@/components/comparison/ComparisonToolbar";
import SapComparisonDocument from "@/components/comparison/SapComparisonDocument";
import { downloadProfilePdf } from "@/lib/downloadProfilePdf";

export default function NiroVeraSapComparisonV2() {
  const reportRef = useRef(null);
  const [downloading, setDownloading] = useState(false);
  const [progress, setProgress] = useState(0);
  const download = async () => {
    setDownloading(true);
    await document.fonts.ready;
    await downloadProfilePdf(reportRef.current, setProgress, "NiroVera-SAP-Pain-Point-Comparison-AR-2026.pdf");
    setDownloading(false);
    setProgress(0);
  };
  return <div className="min-h-screen bg-secondary"><ComparisonToolbar downloading={downloading} progress={progress} total={4} onDownload={download} /><main ref={reportRef} className="flex flex-col items-center gap-8 overflow-x-auto px-4 py-8"><SapComparisonDocument /></main></div>;
}