import React from "react";
import { Pencil, Trash2 } from "lucide-react";
import { ladderLabel } from "@/lib/jobCatalogApi";

export default function JobTitlesTable({ titles, seats, onEdit, onDelete, lang }) {
  const ar = lang === "ar";
  if (!titles.length) return <p className="text-sm text-muted-foreground text-center py-6">{ar ? "لا توجد مسميات بعد — أضف أول مسمى وظيفي." : "No titles yet — add the first one."}</p>;
  const seatCount = (titleId) => seats.filter((s) => s.titleId === titleId).length;
  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-card">
      <table className="w-full text-sm mobile-cards">
        <thead>
          <tr>
            {[ar ? "المسمى" : "Title", ar ? "السلم" : "Ladder", ar ? "الدرجة" : "Grade", ar ? "وزن الجهد" : "Effort", ar ? "المقاعد" : "Seats", ""].map((h, i) => (
              <th key={i} className="px-3 py-2.5 text-start font-medium">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {titles.map((title) => (
            <tr key={title.id} className="border-t border-border">
              <td data-label={ar ? "المسمى" : "Title"} className="px-3 py-2.5">
                <p className="font-medium">{title.name}</p>
                {title.duties && <p className="text-xs text-muted-foreground line-clamp-1">{title.duties}</p>}
              </td>
              <td data-label={ar ? "السلم" : "Ladder"} className="px-3 py-2.5">{ladderLabel(title.ladder, lang)}</td>
              <td data-label={ar ? "الدرجة" : "Grade"} className="px-3 py-2.5">{title.grade || "—"}</td>
              <td data-label={ar ? "وزن الجهد" : "Effort"} className="px-3 py-2.5">{title.effortWeight}</td>
              <td data-label={ar ? "المقاعد" : "Seats"} className="px-3 py-2.5">{seatCount(title.id)}</td>
              <td className="px-3 py-2.5">
                <div className="flex items-center gap-1.5 justify-end">
                  <button onClick={() => onEdit(title)} className="p-1.5 rounded-md hover:bg-muted"><Pencil className="w-4 h-4" /></button>
                  <button onClick={() => onDelete(title)} disabled={seatCount(title.id) > 0} title={seatCount(title.id) > 0 ? (ar ? "مرتبط بمقاعد" : "In use by seats") : ""} className="p-1.5 rounded-md text-destructive hover:bg-muted disabled:opacity-30"><Trash2 className="w-4 h-4" /></button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}