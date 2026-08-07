import React, { useState, useEffect } from "react";
import { Trash2 } from "lucide-react";
import { CommentAttachments } from "@/components/tasks/CommentFiles";

const DELETE_WINDOW_MS = 2 * 60 * 1000; // messages can be deleted within 2 minutes of sending

export default function ChatBubble({ msg, isMine, lang, onDelete }) {
  const time = new Date(msg.created_at).toLocaleTimeString(lang, { hour: "2-digit", minute: "2-digit" });
  const [now, setNow] = useState(Date.now());
  const deletable = isMine && onDelete && now - new Date(msg.created_at).getTime() <= DELETE_WINDOW_MS;

  // Re-check every 10s so the delete button disappears once the 2-minute window closes.
  useEffect(() => {
    if (!deletable) return;
    const interval = setInterval(() => setNow(Date.now()), 10000);
    return () => clearInterval(interval);
  }, [deletable]);

  return (
    <div className={`flex ${isMine ? "justify-end" : "justify-start"} group`}>
      <div className={`max-w-[75%] flex flex-col gap-1 ${isMine ? "items-end" : "items-start"}`}>
        {!isMine && <p className="text-[11px] text-muted-foreground font-body px-1">{msg.user_name}</p>}
        <div className="flex items-center gap-1.5">
          {deletable && (
            <button
              onClick={() => onDelete(msg)}
              className="opacity-0 group-hover:opacity-100 transition p-1 rounded hover:bg-muted text-muted-foreground hover:text-destructive"
              aria-label="delete"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
          <div className={`px-3.5 py-2.5 rounded-2xl text-sm font-body ${isMine ? "bg-foreground text-background" : "bg-muted text-foreground"}`}>
            {msg.text && <p className="whitespace-pre-wrap break-words">{msg.text}</p>}
            <CommentAttachments files={msg.files} />
          </div>
        </div>
        <p className="text-[10px] text-muted-foreground font-body px-1">{time}</p>
      </div>
    </div>
  );
}