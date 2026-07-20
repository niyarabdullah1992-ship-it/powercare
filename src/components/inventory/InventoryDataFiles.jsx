import React from "react";
import { Download, FileSpreadsheet } from "lucide-react";
import { exportExcelColored } from "@/lib/exportExcelColored";
import { buildInventoryDataFile } from "@/lib/inventoryDataFile";

export default function InventoryDataFiles({ movements, items, stations, employees, ar }) {
  const files = [{ id: "all", name: ar ? "جميع المحطات" : "All stations" }, ...stations.map((station) => ({ id: station.stationId || station.id, name: station.name }))];
  const download = (file) => {
    const output = buildInventoryDataFile({ movements, items, stations, employees, stationId: file.id === "all" ? "" : file.id, ar });
    exportExcelColored({ filename: `inventory_movements_${file.id}`, title: `${ar ? "حركات الصرف والنقل" : "Issue and transfer movements"} — ${file.name}`, headers: output.headers, rows: output.rows, dir: ar ? "rtl" : "ltr" });
  };
  return <section className="rounded-xl border border-border bg-card p-4">
    <div className="mb-4 flex items-start gap-3"><span className="rounded-xl bg-emerald-500/10 p-2 text-emerald-600"><FileSpreadsheet className="h-5 w-5" /></span><div><h3 className="font-semibold">{ar ? "ملفات بيانات المخزون" : "Inventory data files"}</h3><p className="text-sm text-muted-foreground">{ar ? "تتحدث تلقائيًا بعد كل عملية صرف أو نقل." : "Automatically updated after every issue or transfer."}</p></div></div>
    <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">{files.map((file) => { const output = buildInventoryDataFile({ movements, items, stations, employees, stationId: file.id === "all" ? "" : file.id, ar }); const latest = output.movements[0]?.created_date; return <button key={file.id} type="button" onClick={() => download(file)} className="flex items-center justify-between gap-3 rounded-xl border border-border p-3 text-start hover:border-emerald-500/40 hover:bg-emerald-500/5"><div><p className="font-medium">{file.name}.xls</p><p className="text-xs text-muted-foreground">{output.rows.length} {ar ? "حركة" : "movements"}{latest ? ` · ${new Date(latest).toLocaleDateString(ar ? "ar-SA" : "en-GB")}` : ""}</p></div><Download className="h-4 w-4 shrink-0 text-emerald-600" /></button>; })}</div>
  </section>;
}