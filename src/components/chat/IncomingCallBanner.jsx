import React from "react";
import { Phone, PhoneOff, Video } from "lucide-react";

export default function IncomingCallBanner({ call, onAccept, onDecline, ar }) {
  if (!call) return null;
  const Icon = call.mode === "video" ? Video : Phone;
  return <div className="flex items-center justify-between gap-3 border-b border-accent/20 bg-accent/10 px-4 py-3">
    <div className="flex items-center gap-2 text-sm"><Icon className="h-4 w-4 text-accent" /><span>{call.initiatorName} — {ar ? "مكالمة واردة" : "Incoming call"}</span></div>
    <div className="flex gap-2">
      <button onClick={() => onAccept(call)} className="rounded-full bg-accent p-2 text-accent-foreground"><Phone className="h-4 w-4" /></button>
      <button onClick={onDecline} className="rounded-full bg-destructive p-2 text-destructive-foreground"><PhoneOff className="h-4 w-4" /></button>
    </div>
  </div>;
}