import React, { useMemo, useState } from "react";
import { Search, FolderOpen, ChevronDown } from "lucide-react";
import IssuedProofList from "@/components/proof/IssuedProofList";

// أرشيف ذكي: بحث فوري + مجلدات شهرية قابلة للفتح، مثل بقية أقسام النظام.
export default function ProofArchive({ proofs, onRevoke, ar }) {
  const [query, setQuery] = useState("");
  const [openKey, setOpenKey] = useState(null);

  const groups = useMemo(() => {
    const term = query.trim().toLowerCase();
    const filtered = proofs.filter((proof) => !term
      || (proof.proofId || "").toLowerCase().includes(term)
      || (proof.clientName || "").toLowerCase().includes(term)
      || (proof.projectName || "").toLowerCase().includes(term));
    const map = new Map();
    filtered.forEach((proof) => {
      const date = new Date(proof.issuedAt || Date.now());
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      const label = date.toLocaleDateString(ar ? "ar-SA" : "en-GB", { month: "long", year: "numeric" });
      if (!map.has(key)) map.set(key, { key, label, proofs: [] });
      map.get(key).proofs.push(proof);
    });
    return [...map.values()].sort((a, b) => b.key.localeCompare(a.key));
  }, [proofs, query, ar]);

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground start-3" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={ar ? "ابحث برقم الإثبات أو العميل أو المشروع" : "Search by proof id, client or project"}
          className="w-full rounded-md border border-input py-2 pe-3 ps-9 text-sm text-foreground"
        />
      </div>

      {groups.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border bg-muted/30 p-4 text-sm text-muted-foreground font-body">
          {ar ? "لا نتائج في الأرشيف." : "No archive results."}
        </p>
      ) : (
        groups.map((group) => (
          <div key={group.key} className="overflow-hidden rounded-xl border border-border bg-background">
            <button type="button" onClick={() => setOpenKey(openKey === group.key ? null : group.key)} className="flex w-full items-center gap-2.5 px-4 py-3 text-start hover:bg-muted">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent/15 text-accent"><FolderOpen className="h-4 w-4" /></span>
              <p className="min-w-0 flex-1 truncate text-sm font-medium font-body">{group.label}</p>
              <span className="shrink-0 text-[11px] text-muted-foreground font-body">{group.proofs.length}</span>
              <ChevronDown className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${openKey === group.key ? "rotate-180" : ""}`} />
            </button>
            {openKey === group.key && (
              <div className="border-t border-border/60 p-3">
                <IssuedProofList proofs={group.proofs} onRevoke={onRevoke} ar={ar} />
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}