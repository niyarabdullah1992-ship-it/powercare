import React, { useState, useRef } from "react";
import { useI18n } from "@/lib/i18n";
import { base44 } from "@/api/base44Client";
import { Paperclip, X, FileText, Image as ImageIcon, Loader2, Download } from "lucide-react";

const isImage = (name = "", type = "") =>
  /^image\/(png|jpe?g|gif|webp|svg)$/i.test(type) || /\.(png|jpe?g|gif|webp|svg)$/i.test(name);

export default function CommentFiles({ files, setFiles, disabled }) {
  const { t } = useI18n();
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  const handleFiles = async (fileList) => {
    if (!fileList || !fileList.length) return;
    setUploading(true);
    const newFiles = [];
    for (const f of Array.from(fileList)) {
      try {
        const up = await base44.integrations.Core.UploadFile({ file: f });
        newFiles.push({ url: up.file_url, name: f.name, type: f.type || "file" });
      } catch {
        alert(`${f.name}: ${t("attachmentFailed")}`);
      }
    }
    setUploading(false);
    if (newFiles.length) setFiles([...(files || []), ...newFiles]);
    if (inputRef.current) inputRef.current.value = "";
  };

  const removeAt = (i) => {
    setFiles((files || []).filter((_, idx) => idx !== i));
  };

  return (
    <div className="space-y-1.5">
      {(files || []).length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {(files || []).map((f, i) => (
            <div key={i} className="group relative flex items-center gap-1.5 pe-7 ps-2 py-1 rounded-md bg-muted border border-border text-xs font-body max-w-[200px]">
              {isImage(f.name, f.type) ? (
                <img src={f.url} alt={f.name} className="w-4 h-4 rounded object-cover" />
              ) : (
                <FileText className="w-4 h-4 text-accent shrink-0" />
              )}
              <a href={f.url} target="_blank" rel="noopener noreferrer" download={f.name} className="truncate text-foreground hover:underline" title={f.name}>
                {f.name}
              </a>
              <button type="button" onClick={() => removeAt(i)} className="absolute end-0.5 top-0.5 p-0.5 rounded hover:bg-foreground/10" title={t("removeFile")}>
                <X className="w-3 h-3 text-muted-foreground" />
              </button>
            </div>
          ))}
        </div>
      )}
      <input ref={inputRef} type="file" multiple className="hidden" onChange={(e) => handleFiles(e.target.files)} />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={disabled || uploading}
        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-body border border-border hover:bg-muted transition-colors disabled:opacity-50"
      >
        {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Paperclip className="w-3.5 h-3.5" />}
        {uploading ? t("uploading") : (files || []).length > 0 ? `${t("attachFile")} (${(files || []).length})` : t("attachFile")}
      </button>
    </div>
  );
}

export function CommentAttachments({ files }) {
  const { t } = useI18n();
  if (!files || !files.length) return null;
  return (
    <div className="mt-1.5 flex flex-wrap gap-1.5">
      {files.map((f, i) => (
        <a
          key={i}
          href={f.url}
          target="_blank"
          rel="noopener noreferrer"
          download={f.name}
          className="group inline-flex items-center gap-1.5 ps-2 pe-2.5 py-1 rounded-md bg-muted/70 border border-border text-xs font-body hover:bg-muted transition-colors max-w-[220px]"
          title={f.name}
        >
          {isImage(f.name, f.type) ? (
            <img src={f.url} alt={f.name} className="w-4 h-4 rounded object-cover" />
          ) : (
            <FileText className="w-3.5 h-3.5 text-accent shrink-0" />
          )}
          <span className="truncate text-foreground">{f.name}</span>
          <Download className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
        </a>
      ))}
    </div>
  );
}