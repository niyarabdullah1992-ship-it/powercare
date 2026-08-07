import React from "react";
import { Check, Camera, FileSignature, MapPin } from "lucide-react";

function TaskMeta({ task, stationNameOf, ar }) {
  const proof = Array.isArray(task.completion_proof) ? task.completion_proof : [];
  const photos = proof.filter((entry) => entry.url).length;
  const attestations = proof.filter((entry) => entry.type === "attestation").length;
  return (
    <span className="mt-1 flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground font-body">
      <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" />{stationNameOf(task)}</span>
      <span className="inline-flex items-center gap-1"><Camera className="h-3 w-3" />{photos}</span>
      <span className="inline-flex items-center gap-1"><FileSignature className="h-3 w-3" />{attestations}</span>
      <span dir="ltr">{task.end_date ? new Date(task.end_date).toLocaleDateString(ar ? "ar-SA" : "en-GB") : "—"}</span>
    </span>
  );
}

// Only tasks closed with complete field evidence are selectable; the rest are
// listed disabled with the exclusion reason, so nothing weak reaches the client.
export default function ProofTaskPicker({ eligible, excluded, selectedIds, onToggle, stationNameOf, ar }) {
  if (eligible.length === 0 && excluded.length === 0) return null;
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
        <h3 className="text-sm font-semibold font-heading">{ar ? "المهام المؤهَّلة" : "Eligible tasks"}</h3>
        <span className="text-[11px] text-muted-foreground font-body">{ar ? "مغلقة بإثبات كامل فقط" : "Closed with complete evidence only"}</span>
      </div>
      <div className="divide-y divide-border">
        {eligible.map((task) => {
          const selected = selectedIds.includes(task.id);
          return (
            <button
              key={task.id}
              type="button"
              onClick={() => onToggle(task.id)}
              className={`flex w-full items-start gap-3 p-3.5 text-start transition ${selected ? "bg-accent/5" : "hover:bg-muted"}`}
            >
              <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border ${selected ? "border-accent bg-accent text-accent-foreground" : "border-input"}`}>
                {selected && <Check className="h-3.5 w-3.5" />}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium font-body">{task.title || "—"}</span>
                <TaskMeta task={task} stationNameOf={stationNameOf} ar={ar} />
              </span>
            </button>
          );
        })}
        {excluded.map(({ task }) => (
          <div key={task.id} className="flex items-start gap-3 p-3.5 opacity-50">
            <span className="mt-0.5 h-5 w-5 shrink-0 rounded border border-input" />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium font-body">{task.title || "—"}</span>
              <TaskMeta task={task} stationNameOf={stationNameOf} ar={ar} />
            </span>
          </div>
        ))}
      </div>
      {excluded.length > 0 && (
        <p className="border-t border-border bg-muted/40 px-4 py-2.5 text-[11px] text-muted-foreground font-body">
          {ar
            ? `${excluded.length === 1 ? "مهمة مستبعدة" : excluded.length === 2 ? "مهمتان مستبعدتان" : `${excluded.length} مهام مستبعدة`}: ${excluded.map(({ reason }) => reason).join("، ")}.`
            : `${excluded.length} excluded: ${excluded.map(({ reason }) => reason).join(", ")}.`}
        </p>
      )}
    </div>
  );
}