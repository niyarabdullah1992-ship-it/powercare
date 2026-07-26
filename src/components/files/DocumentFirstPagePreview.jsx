import React, { useEffect, useRef, useState } from "react";
import { FileText, Loader2 } from "lucide-react";
import { Image } from "@/components/ui/image";
import * as pdfjsLib from "pdfjs-dist";

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

export default function DocumentFirstPagePreview({ url, file, ar }) {
  const canvasRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const isPdf = file?.type === "application/pdf" || file?.name?.toLowerCase().endsWith(".pdf");
  const isImage = file?.type?.startsWith("image/");

  useEffect(() => {
    if (!url || !isPdf || !canvasRef.current) return;
    let cancelled = false;
    setLoading(true);
    pdfjsLib.getDocument(url).promise.then((pdf) => pdf.getPage(1)).then((page) => {
      if (cancelled) return null;
      const viewport = page.getViewport({ scale: 1.25 });
      const canvas = canvasRef.current;
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      return page.render({ canvasContext: canvas.getContext("2d"), viewport }).promise;
    }).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [url, isPdf]);

  if (isImage) return <Image src={url} alt={file.name} fittingType="fit" className="min-h-80 w-full bg-secondary/30" />;
  if (!isPdf) return <div className="flex min-h-80 flex-col items-center justify-center bg-secondary/35 p-8 text-center"><FileText className="mb-3 h-10 w-10 text-accent" /><p className="text-sm font-bold">{file?.name}</p><p className="mt-2 text-xs text-muted-foreground">{ar ? "تم فحص الملف. تتوفر المعاينة المباشرة لملفات PDF وPNG." : "File scanned. Live preview is available for PDF and PNG files."}</p></div>;
  return <div className="relative min-h-80 bg-secondary/45 p-3"><canvas ref={canvasRef} className="mx-auto block max-h-[650px] max-w-full bg-white shadow-md" />{loading && <div className="absolute inset-0 flex items-center justify-center bg-card/70"><Loader2 className="h-6 w-6 animate-spin text-accent" /></div>}</div>;
}