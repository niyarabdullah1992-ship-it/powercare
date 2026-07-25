import React, { useRef, useState } from "react";
import ComparisonToolbar from "@/components/comparison/ComparisonToolbar";
import ComparisonReportPage from "@/components/comparison/ComparisonReportPage";
import { comparisonPages } from "@/lib/powerCareSapComparison";
import { downloadProfilePdf } from "@/lib/downloadProfilePdf";

export default function PowerCareSapComparison() {
  const reportRef = useRef(null);
  const [downloading, setDownloading] = useState(false);
  const [progress, setProgress] = useState(0);
  const download = async () => {
    setDownloading(true);
    await document.fonts.ready;
    await downloadProfilePdf(reportRef.current, (current) => setProgress(current), "PowerCare-vs-SAP-Comparison-AR-2026.pdf");
    setDownloading(false);
    setProgress(0);
  };
  return <div className="min-h-screen bg-secondary"><ComparisonToolbar downloading={downloading} progress={progress} total={comparisonPages.length} onDownload={download} /><main ref={reportRef} className="flex flex-col items-center gap-8 overflow-x-auto px-4 py-8">{comparisonPages.map((page) => <ComparisonReportPage key={page.number} page={page} total={comparisonPages.length} />)}</main></div>;
}