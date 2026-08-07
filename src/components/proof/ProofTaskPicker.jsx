import React from "react";
import { Check, Camera, FileSignature, MapPin } from "lucide-react";

// Picks which completed work items go into the client proof.
export default function ProofTaskPicker({ tasks, selectedIds, onToggle, stationNameOf, ar }) {
  if (tasks.length === 0) {
    return <p className="rounded-xl border border-border bg-card p-6 text-center text-sm text-muted-foreground font-body">
      {ar ? "لا توجد أعمال مكتملة ضمن الفترة المختارة." : "No completed work in the selected period."}
    </p>;
  }
  return (
    <div className="space-y-2">
      {tasks.map((task) => {
        const proof = Array.isArray(task.completion_proof) ? task.completion_proof : [];
        const photos = proof.filter((entry) => entry.url).length;
        const attestations = proof.filter((entry) => entry.type === "attestation").length;
        const selected = selectedIds.includes(task.id);
        return (
          <button
            key={task.id}
            type="button"
            onClick={() => onToggle(task.id)}
            className={`flex w-full items-start gap-3 rounded-xl border p-3.5 text-start transition ${selected ? "border-accent bg-accent/5" : "border-border bg-card hover:bg-muted"}`}
          >
            <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border ${selected ? "border-accent bg-accent text-accent-foreground" : "border-input"}`}>
              {selected && <Check className="h-3.5 w-3.5" />}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium font-body">{task.title || "—"}</span>
              <span className="mt-1 flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground font-body">
                <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" />{stationNameOf(task)}</span>
                <span className="inline-flex items-center gap-1"><Camera className="h-3 w-3" />{photos}</span>
                <span className="inline-flex items-center gap-1"><FileSignature className="h-3 w-3" />{attestations}</span>
                <span dir="ltr">{task.end_date ? new Date(task.end_date).toLocaleDateString(ar ? "ar-SA" : "en-GB") : "—"}</span>
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}