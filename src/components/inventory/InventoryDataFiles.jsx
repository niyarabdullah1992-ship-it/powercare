import React, { useState } from "react";
import { FileSpreadsheet, Printer } from "lucide-react";
import MobileSelect from "@/components/mobile/MobileSelect";
import { useAuth } from "@/lib/PowerCareAuth";
import { exportExcelColored } from "@/lib/exportExcelColored";
import { printReport } from "@/lib/printReport";
import { buildInventoryDataFile } from "@/lib/inventoryDataFile";

export default function InventoryDataFiles({ movements, items, stations, employees, ar }) {
  const { data, company } = useAuth();
  const [selectedId, setSelectedId] = useState("all");
  const files = [{ id: "all", name: ar ? "جميع المحطات" : "All stations" }, ...stations.map((station) => ({ id: station.stationId || station.id, name: station.name }))];
  const selected = files.find((file) => file.id === selectedId) || files[0];
  const output = buildInventoryDataFile({ movements, items, stations, employees, stationId: selected.id === "all" ? "" : selected.id, ar });
  const latest = output.movements[0]?.created_date;
  const title = `${ar ? "حركات الصرف والنقل" : "Issue and transfer movements"} — ${selected.name}`;
  const branding = data?.reportBranding || {};
  const downloadExcel = () => exportExcelColored({ filename: `inventory_movements_${selected.id}`, title, headers: output.headers, rows: output.rows, color: branding.color || "#b07d3f", dir: ar ? "rtl" : "ltr" });
  const downloadPdf = () => printReport({ title, companyName: company?.name || "", periodLabel: new Date().toLocaleDateString(ar ? "ar-SA" : "en-GB"), dir: ar ? "rtl" : "ltr", sections: [{ heading: title, headers: output.headers, rows: output.rows }], logoUrl: branding.logoUrl || "", color: branding.color || "#b07d3f" });
  return <section className="rounded-xl border border-border bg-card p-4">
    <div className="mb-4 flex items-start gap-3"><span className="rounded-xl bg-emerald-500/10 p-2 text-emerald-600"><FileSpreadsheet className="h-5 w-5" /></span><div><h3 className="font-semibold">{ar ? "ملفات بيانات المخزون" : "Inventory data files"}</h3><p className="text-sm text-muted-foreground">{ar ? "ابحث عن المحطة ثم نزّل ملفها المحدث تلقائيًا." : "Search for a station, then download its automatically updated file."}</p></div></div>
    <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-end">
      <div><p className="mb-1.5 text-xs font-medium text-muted-foreground">{ar ? "المحطة" : "Station"}</p><MobileSelect value={selectedId} onChange={setSelectedId} options={files.map((file) => ({ value: file.id, label: file.name }))} searchable placeholder={ar ? "ابحث عن محطة" : "Search stations"} /></div>
      <button type="button" disabled={!output.rows.length} onClick={downloadPdf} className="flex items-center justify-center gap-2 rounded-lg bg-accent px-4 py-3 text-sm font-medium text-accent-foreground hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-40"><Printer className="h-4 w-4" />PDF</button>
      <button type="button" disabled={!output.rows.length} onClick={downloadExcel} className="flex items-center justify-center gap-2 rounded-lg bg-accent px-4 py-3 text-sm font-medium text-accent-foreground hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-40"><FileSpreadsheet className="h-4 w-4" />Excel</button>
    </div>
    <p className="mt-3 text-xs text-muted-foreground">{output.rows.length} {ar ? "حركة صرف أو نقل" : "issue or transfer movements"}{latest ? ` · ${ar ? "آخر تحديث" : "Last updated"}: ${new Date(latest).toLocaleDateString(ar ? "ar-SA" : "en-GB")}` : ""}</p>
  </section>;
}