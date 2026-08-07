import React, { useState } from "react";
import { Camera, ChevronDown } from "lucide-react";
import QrScanner from "@/components/inventory/QrScanner";

export default function InventoryItemScanner({ items, stationIds, onOpen, ar }) {
  const [expanded, setExpanded] = useState(false);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");

  const openItem = (rawCode) => {
    const normalized = String(rawCode || "").trim().toLocaleLowerCase();
    const item = items.find((entry) => [entry.qrCode, entry.itemCode].some((value) => String(value || "").trim().toLocaleLowerCase() === normalized));
    if (!item) { setError(ar ? "لم يتم العثور على صنف بهذا الكود." : "No item was found with this code."); return; }
    const balances = item.locationBalances || [];
    const balance = balances.find((entry) => stationIds.includes(entry.locationId)) || balances[0];
    const locationId = balance?.locationId || item.currentLocationId;
    setError("");
    onOpen({ ...item, quantity: Number(balance?.quantity ?? item.quantity ?? 0), currentLocationId: locationId });
  };

  return <section className="rounded-xl border border-border bg-card p-3">
    <button type="button" onClick={() => setExpanded((value) => !value)} className="flex w-full items-center justify-between gap-3 rounded-lg px-2 py-2 text-start hover:bg-muted">
      <span className="flex items-center gap-2 text-sm font-semibold"><Camera className="h-5 w-5 text-accent" />{ar ? "مسح كود الصنف بالكاميرا" : "Scan item code with camera"}</span>
      <ChevronDown className={`h-4 w-4 transition-transform ${expanded ? "rotate-180" : ""}`} />
    </button>
    {expanded && <div className="mt-3 border-t pt-3"><QrScanner value={code} onChange={(value) => { setCode(value); setError(""); }} onDetected={openItem} ar={ar} />
      <button type="button" disabled={!code.trim()} onClick={() => openItem(code)} className="mt-3 w-full rounded-lg bg-accent px-4 py-2.5 font-medium text-accent-foreground disabled:opacity-40">{ar ? "فتح الصنف" : "Open item"}</button>
      {error && <p className="mt-2 rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">{error}</p>}
    </div>}
  </section>;
}