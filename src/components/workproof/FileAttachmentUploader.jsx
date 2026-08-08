import React, { useState } from "react";
import { Loader2, Paperclip, X } from "lucide-react";
import { base44 } from "@/api/base44Client";

// Document attachments (PDF, Word, Excel…) alongside the before/after photos.
export default function FileAttachmentUploader({ label, files, onChange }) {
  const [uploading, setUploading] = useState(false);
  const pick = async (event) => {
    const picked = Array.from(event.target.files || []);
    if (!picked.length) return;
    setUploading(true);
    try {
      const uploaded = [];
      for (const file of picked.slice(0, 10 - files.length)) {
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        uploaded.push({ url: file_url, name: file.name });
      }
      onChange([...files, ...uploaded]);
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  };
  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-muted-foreground font-body">{label}</p>
      <div className="space-y-1.5">
        {files.map((file) => (
          <div key={file.url} className="flex items-center gap-2 rounded-md border border-border bg-muted/30 px-2.5 py-1.5">
            <Paperclip className="h-3.5 w-3.5 shrink-0 text-accent" />
            <a href={file.url} target="_blank" rel="noreferrer" className="min-w-0 flex-1 truncate text-xs font-body hover:underline">{file.name}</a>
            <button type="button" onClick={() => onChange(files.filter((f) => f.url !== file.url))} className="rounded p-1 text-destructive hover:bg-muted" aria-label="remove">
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
      </div>
      <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-dashed border-accent/40 px-3 py-2 text-xs font-body text-accent hover:bg-accent/5">
        {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Paperclip className="h-3.5 w-3.5" />}
        {uploading ? "…" : label}
        <input type="file" multiple className="hidden" onChange={pick} disabled={uploading} />
      </label>
    </div>
  );
}