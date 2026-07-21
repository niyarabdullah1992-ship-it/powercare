import React from "react";
import { NavLink } from "react-router-dom";
import { Clock3 } from "lucide-react";
import { mostVisited } from "@/lib/quickNavigation";

export default function MostVisitedNav({ items, companyId, userId, lang }) {
  const recent = mostVisited(items, companyId, userId);
  if (!recent.length) return null;
  return (
    <div className="border-b border-white/10 px-3 py-3">
      <p className="mb-2 flex items-center gap-2 px-2 text-[10px] font-medium uppercase tracking-widest text-white/40">
        <Clock3 className="h-3.5 w-3.5" />{lang === "ar" ? "الأكثر زيارة" : "Most visited"}
      </p>
      <div className="grid grid-cols-2 gap-1.5">
        {recent.map((item) => <NavLink key={item.to} to={item.to} className="flex min-w-0 items-center gap-2 rounded-lg bg-white/5 px-2.5 py-2 text-white/70 hover:bg-white/10 hover:text-white"><item.icon className="h-4 w-4 shrink-0" /><span className="truncate text-xs">{item.label}</span></NavLink>)}
      </div>
    </div>
  );
}