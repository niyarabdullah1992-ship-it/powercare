import React, { useState } from "react";
import { Archive, Search } from "lucide-react";
import { taskScope, groupTasksByPeriod } from "@/lib/taskTimeScope";
import ArchivePeriodGroup from "@/components/tasks/ArchivePeriodGroup";

// Smart archive: finished tasks (completed / overdue) are classified automatically
// by their DURATION (monthly / quarterly / half-year / yearly) and filed under
// Year → Period folders so they stay easy to find later.
export default function SmartArchive({ targets, renderTask, ar, dir }) {
  const [query, setQuery] = useState("");

  const archived = targets
    .filter((tg) => tg.status === "completed" || tg.status === "overdue")
    .filter((tg) => {
      if (!query) return true;
      const q = query.toLowerCase();
      return (tg.title || "").toLowerCase().includes(q) || (tg.description || "").toLowerCase().includes(q);
    });

  // Year → ordered period groups (yearly goals first, then half-year, quarters, months).
  const years = new Map();
  for (const tg of archived) {
    const y = taskScope(tg).year;
    if (!years.has(y)) years.set(y, []);
    years.get(y).push(tg);
  }
  const yearList = Array.from(years.keys()).sort((a, b) => b - a);

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className={`absolute top-1/2 -translate-y-1/2 ${dir === "rtl" ? "right-3" : "left-3"} w-4 h-4 text-muted-foreground`} />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={ar ? "ابحث في الأرشيف…" : "Search the archive…"}
          className={`w-full ${dir === "rtl" ? "pr-9 pl-3" : "pl-9 pr-3"} py-2 rounded-md border border-input text-sm font-body bg-background`}
        />
      </div>

      {yearList.length === 0 ? (
        <div className="py-10 text-center space-y-2">
          <Archive className="w-8 h-8 mx-auto text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground font-body">
            {ar ? "لا توجد مهام مؤرشفة بعد — تُنقل المهام المكتملة والمتأخرة إلى هنا تلقائيًا." : "No archived tasks yet — completed and overdue tasks are filed here automatically."}
          </p>
        </div>
      ) : (
        yearList.map((year) => (
          <div key={year} className="space-y-2">
            <div className="flex items-center gap-2">
              <h3 className="font-heading text-base font-semibold">{ar ? `سنة ${year}` : year}</h3>
              <span className="h-px flex-1 bg-border" />
              <span className="text-[11px] text-muted-foreground font-body">{years.get(year).length}</span>
            </div>
            <div className="space-y-2">
              {groupTasksByPeriod(years.get(year), ar).map((grp) => (
                <ArchivePeriodGroup key={grp.key} group={grp} ar={ar} renderTask={renderTask} />
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}