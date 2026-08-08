import React, { useState } from "react";
import { Camera, Loader2, X } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Image } from "@/components/ui/image";

export default function PhotoUploader({ label, urls, onChange }) {
  const [uploading, setUploading] = useState(false);
  const pick = async (event) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;
    setUploading(true);
    try {
      const uploaded = [];
      for (const file of files.slice(0, 10 - urls.length)) {
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        uploaded.push(file_url);
      }
      onChange([...urls, ...uploaded]);
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  };
  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-muted-foreground font-body">{label}</p>
      <div className="flex flex-wrap items-center gap-2">
        {urls.map((url) => (
          <div key={url} className="relative">
            <Image src={url} alt={label} className="h-16 w-16 rounded-md border border-border" />
            <button type="button" onClick={() => onChange(urls.filter((u) => u !== url))} className="absolute -top-1.5 -end-1.5 rounded-full bg-destructive p-0.5 text-white" aria-label="remove">
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
        <label className="flex h-16 w-16 cursor-pointer items-center justify-center rounded-md border-2 border-dashed border-accent/40 text-accent hover:bg-accent/5">
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-5 w-5" />}
          <input type="file" accept="image/*" multiple className="hidden" onChange={pick} disabled={uploading} />
        </label>
      </div>
    </div>
  );
}