import React from "react";
import { Phone, Video } from "lucide-react";

export default function CallButtons({ onStart, disabled, ar }) {
  const begin = (mode) => onStart(mode);
  return <div className="flex items-center gap-1">
    <button type="button" disabled={disabled} onClick={() => begin("audio")} title={ar ? "مكالمة صوتية" : "Audio call"} className="rounded-md p-2 text-muted-foreground hover:bg-muted disabled:opacity-40"><Phone className="h-4 w-4" /></button>
    <button type="button" disabled={disabled} onClick={() => begin("video")} title={ar ? "مكالمة فيديو" : "Video call"} className="rounded-md p-2 text-muted-foreground hover:bg-muted disabled:opacity-40"><Video className="h-4 w-4" /></button>
  </div>;
}