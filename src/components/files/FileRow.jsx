import React from "react";
import { FileText, Image as ImageIcon, FileSpreadsheet, File as FileIcon, Download, Trash2 } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import ConfirmDeleteDialog from "@/components/ConfirmDeleteDialog";

function fileIcon(mimeType = "", name = "") {
  const n = name.toLowerCase();
  if (mimeType.startsWith("image/")) return ImageIcon;
  if (mimeType.includes("pdf") || n.endsWith(".pdf")) return FileText;
  if (mimeType.includes("sheet") || n.endsWith(".xlsx") || n.endsWith(".csv")) return FileSpreadsheet;
  return FileIcon;
}

function formatSize(bytes) {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function FileRow({ file, onDelete, stationName }) {
  const { t, lang } = useI18n();
  const Icon = fileIcon(file.mimeType, file.name);
  return (
    <div className="flex items-center gap-3 bg-card border border-border rounded-lg px-4 py-3 hover:border-accent/60 transition-colors">
      <Icon className="w-5 h-5 text-accent shrink-0" strokeWidth={1.5} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-body font-medium truncate" dir="auto">{file.name}</p>
        <p className="text-[11px] text-muted-foreground">
          {formatSize(file.size)}{file.size ? " · " : ""}{new Date(file.createdAt).toLocaleDateString(lang)}
          {file.uploadedBy ? <> · {t("uploadedBy")} <span dir="auto">{file.uploadedBy}</span></> : null}
        </p>
      </div>
      {stationName && (
        <span className="hidden sm:inline-flex items-center px-2.5 py-1 rounded-full bg-accent/10 border border-accent/30 text-accent text-[11px] font-body shrink-0" dir="auto">
          {stationName}
        </span>
      )}
      <a
        href={file.url}
        target="_blank"
        rel="noopener noreferrer"
        className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted"
        aria-label={t("downloadFile")}
      >
        <Download className="w-4 h-4" />
      </a>
      <ConfirmDeleteDialog
        onConfirm={onDelete}
        trigger={
          <button className="p-2 rounded-md text-muted-foreground hover:text-destructive hover:bg-muted" aria-label={t("delete")}>
            <Trash2 className="w-4 h-4" />
          </button>
        }
      />
    </div>
  );
}