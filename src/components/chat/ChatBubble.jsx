import React from "react";
import { Trash2 } from "lucide-react";
import { CommentAttachments } from "@/components/tasks/CommentFiles";

export default function ChatBubble({ msg, isMine, lang, onDelete }) {
  const time = new Date(msg.created_at).toLocaleTimeString(lang, { hour: "2-digit", minute: "2-digit" });
  return (
    <div className={`flex ${isMine ? "justify-end" : "justify-start"} group`}>
      <div className={`max-w-[75%] flex flex-col gap-1 ${isMine ? "items-end" : "items-start"}`}>
        {!isMine && <p className="text-[11px] text-muted-foreground font-body px-1">{msg.user_name}</p>}
        <div className="flex items-center gap-1.5">
          {isMine && onDelete && (
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