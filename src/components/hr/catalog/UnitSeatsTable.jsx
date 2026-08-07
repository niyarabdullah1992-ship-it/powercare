import React from "react";
import { Building2, Pencil, Trash2 } from "lucide-react";
import { seatVacancy } from "@/lib/jobCatalogApi";

// لكل وحدة جدول: المسمى، الدرجة، المعتمد/المشغول/الشاغر، الحالة.
export default function UnitSeatsTable({ seats, titles, stations, employees, onEdit, onDelete, lang }) {
  const ar = lang === "ar";
  if (!seats.length) return <p className="text-sm text-muted-foreground text-center py-6">{ar ? "لا توجد مقاعد بعد — أضف مقعدًا وظيفيًا لكل وحدة." : "No seats yet."}</p>;
  const units = [...new Set(seats.map((s) => s.unitId))];
  const unitName = (id) => stations.find((s) => s.id === id)?.name || (ar ? "وحدة غير معروفة" : "Unknown unit");
  const titleOf = (seat) => titles.find((t) => t.id === seat.titleId);
  const empName = (id) => employees.find((e) => e.id === id)?.name || id;

  return (
    <div className="space-y-4">
      {units.map((unitId) => (
        <div key={unitId} className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-secondary">
            <Building2 className="w-4 h-4 text-accent" />
            <h4 className="font-heading font-semibold text-sm">{unitName(unitId)}</h4>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm mobile-cards">
              <thead>
                <tr>
                  {[ar ? "المسمى" : "Title", ar ? "الدرجة" : "Grade", ar ? "المعتمد" : "Approved", ar ? "المشغول" : "Occupied", ar ? "الشاغر" : "Vacant", ar ? "الحالة" : "Status", ""].map((h, i) => (
                    <th key={i} className="px-3 py-2 text-start font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {seats.filter((s) => s.unitId === unitId).map((seat) => {
                  const title = titleOf(seat);
                  const vacant = seatVacancy(seat);
                  const occupied = (seat.assignedEmployeeIds || []).length;
                  return (
                    <tr key={seat.id} className="border-t border-border">
                      <td data-label={ar ? "المسمى" : "Title"} className="px-3 py-2.5">
                        <p className="font-medium">{title?.name || "—"}</p>
                        {occupied > 0 && <p className="text-xs text-muted-foreground line-clamp-1">{seat.assignedEmployeeIds.map(empName).join("، ")}</p>}
                      </td>
                      <td data-label={ar ? "الدرجة" : "Grade"} className="px-3 py-2.5">{title?.grade || "—"}</td>
                      <td data-label={ar ? "المعتمد" : "Approved"} className="px-3 py-2.5">{seat.approvedCount}</td>
                      <td data-label={ar ? "المشغول" : "Occupied"} className="px-3 py-2.5">{occupied}</td>
                      <td data-label={ar ? "الشاغر" : "Vacant"} className="px-3 py-2.5 font-medium">{vacant}</td>
                      <td data-label={ar ? "الحالة" : "Status"} className="px-3 py-2.5">
                        <span className={`inline-block rounded-full px-2 py-0.5 text-xs ${vacant > 0 ? "bg-amber-500/15 text-amber-700" : "bg-accent/15 text-accent-text"}`}>
                          {vacant > 0 ? (ar ? "شاغر — طلب توظيف مفتوح" : "Vacant — hiring open") : ar ? "مكتمل" : "Full"}
                        </span>
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-1.5 justify-end">
                          <button onClick={() => onEdit(seat)} className="p-1.5 rounded-md hover:bg-muted"><Pencil className="w-4 h-4" /></button>
                          <button onClick={() => onDelete(seat)} disabled={occupied > 0} className="p-1.5 rounded-md text-destructive hover:bg-muted disabled:opacity-30"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
}