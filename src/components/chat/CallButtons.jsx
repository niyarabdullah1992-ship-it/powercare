import React from "react";
import { Phone, Video } from "lucide-react";

export default function CallButtons({ onStart, disabled, ar }) {
  return (
    <div className="flex items-center gap-1">
      <button type="button" disabled={disabled} onClick={() => onStart("audio")} title={ar ? "مكالمة صوتية" : "Audio call"} className="rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-40"><Phone className="h-4 w-4" /></button>
      <button type="button" disabled={disabled} onClick={() => onStart("video")} title={ar ? "مكالمة فيديو" : "Video call"} className="rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-40"><Video className="h-4 w-4" /></button>
    </div>
  );
}