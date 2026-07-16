import React from "react";
import { PhoneIncoming, Video } from "lucide-react";

export default function IncomingCallBanner({ call, onAccept, onDecline, ar }) {
  if (!call) return null;
  const Icon = call.mode === "video" ? Video : PhoneIncoming;
  return (
    <div className="flex items-center justify-between gap-3 border-b border-border bg-accent/10 px-4 py-3">
      <div className="flex items-center gap-2"><Icon className="h-4 w-4 text-accent" /><p className="text-sm font-medium">{call.initiatorName} — {ar ? "مكالمة واردة" : "Incoming call"}</p></div>
      <div className="flex gap-2"><button onClick={() => onDecline(call)} className="rounded-md border border-border px-3 py-1.5 text-xs">{ar ? "تجاهل" : "Dismiss"}</button><button onClick={() => onAccept(call)} className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs text-white">{ar ? "انضمام" : "Join"}</button></div>
    </div>
  );
}