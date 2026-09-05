import React from "react";
import { ThumbsDown, ThumbsUp } from "lucide-react";

export default function AssistantFeedback({ value, onRate }) {
  return (
    <div className="mt-2 flex items-center gap-1 border-t border-border/70 pt-2">
      <button type="button" onClick={() => onRate("up")} className={`rounded p-1.5 hover:bg-muted ${value === "up" ? "text-emerald-600" : "text-muted-foreground"}`} aria-label="Helpful"><ThumbsUp className="h-3.5 w-3.5" /></button>
      <button type="button" onClick={() => onRate("down")} className={`rounded p-1.5 hover:bg-muted ${value === "down" ? "text-destructive" : "text-muted-foreground"}`} aria-label="Not helpful"><ThumbsDown className="h-3.5 w-3.5" /></button>
    </div>
  );
}