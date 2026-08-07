import React from "react";
import { Briefcase } from "lucide-react";
import { seatVacancy } from "@/lib/jobCatalogApi";

// كل مقعد شاغر يفتح طلب توظيف تلقائيًا في صفحة التوظيف.
export default function VacantSeatRequests({ seats, titles, stations, lang }) {
  const ar = lang === "ar";
  const vacant = seats.filter((seat) => seatVacancy(seat) > 0);
  if (!vacant.length) return null;
  const titleOf = (seat) => titles.find((t) => t.id === seat.titleId);
  const unitName = (id) => stations.find((s) => s.id === id)?.name || "—";
  return (
    <div className="rounded-xl border border-amber-500/40 bg-card p-4">
      <h3 className="font-heading font-semibold flex items-center gap-2 mb-3">
        <Briefcase className="w-4 h-4 text-amber-600" />
        {ar ? `طلبات توظيف مفتوحة تلقائيًا (${vacant.length})` : `Auto-opened hiring requests (${vacant.length})`}
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {vacant.map((seat) => {
          const title = titleOf(seat);
          return (
            <div key={seat.id} className="rounded-lg border border-border p-3">
              <p className="font-medium text-sm">{title?.name || "—"}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{unitName(seat.unitId)} · {title?.grade || "—"}</p>
              <p className="text-xs mt-1.5">
                <span className="inline-block rounded-full bg-amber-500/15 text-amber-700 px-2 py-0.5">
                  {ar ? `${seatVacancy(seat)} مقعد شاغر` : `${seatVacancy(seat)} vacant`}
                </span>
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}