import React from "react";
import { FileText } from "lucide-react";
import { Image } from "@/components/ui/image";
import InlinePdfPlacement from "@/components/files/InlinePdfPlacement";

export default function DocumentFirstPagePreview({ url, file, ar, fields = [], onFieldsChange, textValues = {}, signaturePreview, onPageChange }) {
  const isPdf = file?.type === "application/pdf" || file?.name?.toLowerCase().endsWith(".pdf");
  const isImage = file?.type?.startsWith("image/");


  if (isImage) return <Image src={url} alt={file.name} fittingType="fit" className="min-h-80 w-full bg-secondary/30" />;
  if (!isPdf) return <div className="flex min-h-80 flex-col items-center justify-center bg-secondary/35 p-8 text-center"><FileText className="mb-3 h-10 w-10 text-accent" /><p className="text-sm font-bold">{file?.name}</p><p className="mt-2 text-xs text-muted-foreground">{ar ? "تم فحص الملف. تتوفر المعاينة المباشرة لملفات PDF وPNG." : "File scanned. Live preview is available for PDF and PNG files."}</p></div>;
  return <InlinePdfPlacement url={url} fields={fields} onFieldsChange={onFieldsChange} textValues={textValues} signaturePreview={signaturePreview} ar={ar} onPageChange={onPageChange} />;
}