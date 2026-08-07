import React from "react";
import ChainRowCard from "@/components/hr/ChainRowCard";
import { buildManagementChain } from "@/lib/managementChain";

// "From my seat to the top of the pyramid" — the approval and escalation path
// drawn from the company's real org tree.
export default function ManagementChainLadder({ data, employeeId, lang }) {
  const rows = buildManagementChain(data, employeeId);

  return (
    <section
      className="overflow-x-auto rounded-xl border border-border bg-muted/40 p-6"
      style={{ backgroundImage: "radial-gradient(hsl(var(--border)) 1px, transparent 1px)", backgroundSize: "26px 26px" }}
    >
      <p className="mb-5 inline-block rounded-md bg-background px-2 py-1 font-heading text-sm font-semibold">
        {lang === "ar" ? "من موقعي إلى رأس الهرم" : "From my seat to the top"}
      </p>
      {rows.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">
          {lang === "ar" ? "لم يتم ربط موقعك بالهيكل التنظيمي بعد." : "Your seat is not linked to the org structure yet."}
        </p>
      ) : (
        <div className="flex min-w-max flex-col items-center">
          {rows.map((row, index) => (
            <div key={row.id} className="flex flex-col items-center">
              <ChainRowCard row={row} lang={lang} />
              {index !== rows.length - 1 && <span className="h-6 w-0.5 bg-border" />}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}