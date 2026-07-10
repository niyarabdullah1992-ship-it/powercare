import React from "react";
import { FileText, Download, Paperclip } from "lucide-react";
import { formatDateTime } from "@/lib/dateFormat";

const isImage = (name = "", type = "") =>
  /^image\/(png|jpe?g|gif|webp|svg)$/i.test(type) || /\.(png|jpe?g|gif|webp|svg)$/i.test(name);
const isAudio = (name = "", type = "") => /^audio\//i.test(type) || /\.(webm|mp3|wav|m4a|ogg)$/i.test(name);

export default function ChatMediaGallery({ messages, t, lang }) {
  const items = (messages || []).flatMap((m) =>
    (m.files || []).map((f) => ({ ...f, userName: m.user_name, createdAt: m.created_at }))
  );

  if (items.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground font-body">
        <div className="text-center">
          <Paperclip className="w-6 h-6 mx-auto mb-2 opacity-40" />
          {t("noMediaShared")}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-5 py-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {items.map((f, i) => (
          <a
            key={i}
            href={f.url}
            target="_blank"
            rel="noopener noreferrer"
            download={f.name}
            className="group p-2.5 rounded-lg border border-border bg-background hover:bg-muted transition-colors space-y-1.5"
          >
            {isImage(f.name, f.type) ? (
              <img src={f.url} alt={f.name} className="w-full h-24 rounded-md object-cover" />
            ) : isAudio(f.name, f.type) ? (
              <audio src={f.url} controls className="w-full h-8" onClick={(e) => e.stopPropagation()} />
            ) : (
              <div className="w-full h-24 rounded-md bg-muted flex items-center justify-center">
                <FileText className="w-6 h-6 text-accent" />
              </div>
            )}
            <div className="flex items-center justify-between gap-1">
              <p className="text-xs font-body truncate">{f.name}</p>
              <Download className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
            </div>
            <p className="text-[11px] text-muted-foreground font-body truncate">
              {t("sharedBy")} {f.userName} · {formatDateTime(f.createdAt, lang)}
            </p>
          </a>
        ))}
      </div>
    </div>
  );
}