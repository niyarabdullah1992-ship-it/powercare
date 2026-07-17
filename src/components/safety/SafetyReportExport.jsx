import React, { useState } from "react";
import { exportExcelColored } from "@/lib/exportExcelColored";
import { printReport } from "@/lib/printReport";
import { FileSpreadsheet, FileText, CalendarRange } from "lucide-react";

// تقرير السلامة (HSE): حالة كل محطة + سجل الحوادث خلال الفترة — PDF وExcel.
const PRESETS = [
  { val: "month", months: 1 },
  { val: "3months", months: 3 },
  { val: "6months", months: 6 },
  { val: "year", months: 12 },
];

export default function SafetyReportExport({ stations, safety, data, t, lang, dir }) {
  const [preset, setPreset] = useState("month");
  const [stationFilter, setStationFilter] = useState("all");
  const ar = lang === "ar";
  const L = (a, e) => (ar ? a : e);
  const branding = data?.reportBranding || {};
  const color = branding.color || "#b07d3f";

  const presetLabel = (val) => ({
    month: L("شهر", "1 Month"),
    "3months": L("٣ أشهر", "3 Months"),
    "6months": L("٦ أشهر", "6 Months"),
    year: L("سنة", "1 Year"),
  })[val];

  const levelLabel = (lv) => ({
    green: L("آمن", "Safe"),
    amber: L("مراقبة", "Watch"),
    red: L("حرج", "Critical"),
  })[lv] || L("غير محدد", "Not set");

  const fmt = (d) => (d ? new Date(d).toLocaleDateString(ar ? "ar-SA" : "en-GB") : "—");
  const recFor = (sid) => (safety || []).find((s) => s.stationId === sid) || null;

  const scopedStations = stationFilter === "all" ? stations : stations.filter((s) => s.id === stationFilter);

  const buildReport = () => {
    const months = PRESETS.find((p) => p.val === preset)?.months || 1;
    const start = new Date();
    start.setMonth(start.getMonth() - months);
    start.setHours(0, 0, 0, 0);

    const statusHeaders = [
      L("المحطة", "Station"), L("مستوى السلامة", "Safety level"), L("المخاطر المفتوحة", "Open hazards"),
      L("إجمالي الحوادث", "Total incidents"), L("آخر تفتيش", "Last inspection"), L("الاعتماد", "Approval"),
    ];
    const statusRows = scopedStations.map((st) => {
      const rec = recFor(st.id);
      return [
        st.name,
        levelLabel(rec?.level),
        (rec?.hazards || []).length,
        rec?.incidents || (rec?.incidentLog || []).length || 0,
        fmt(rec?.lastInspection),
        rec?.approvedBy ? `${rec.approvedBy} — ${fmt(rec.approvedAt)}` : L("غير معتمد", "Not approved"),
      ];
    });

    const incidentHeaders = [L("المحطة", "Station"), L("التاريخ", "Date"), L("الوصف", "Description")];
    const incidentRows = scopedStations.flatMap((st) =>
      ((recFor(st.id)?.incidentLog) || [])
        .filter((i) => i.at && new Date(i.at) >= start)
        .map((i) => [st.name, fmt(i.at), i.description || "—"])
    );

    const stationLabel = stationFilter === "all" ? L("كل المحطات", "All stations") : scopedStations[0]?.name || "";
    const periodLabel = `${stationLabel} • ${fmt(start)} → ${fmt(new Date())}`;
    return { statusHeaders, statusRows, incidentHeaders, incidentRows, periodLabel };
  };

  const exportExcel = () => {
    const r = buildReport();
    exportExcelColored({
      filename: `safety_report_${new Date().toISOString().slice(0, 10)}`,
      title: `${L("تقرير السلامة", "Safety Report")} — ${r.periodLabel}`,
      headers: r.statusHeaders,
      rows: [
        ...r.statusRows,
        [],
        r.incidentHeaders,
        ...r.incidentRows,
      ],
      color,
      dir,
    });
  };

  const exportPdf = () => {
    const r = buildReport();
    const critical = r.statusRows.filter((row) => row[1] === levelLabel("red")).length;
    const openHazards = r.statusRows.reduce((s, row) => s + Number(row[2] || 0), 0);
    printReport({
      title: L("تقرير السلامة (HSE)", "Safety Report (HSE)"),
      companyName: data?.name || "",
      periodLabel: r.periodLabel,
      dir,
      logoUrl: branding.logoUrl || "",
      color,
      stats: [
        { value: r.statusRows.length, label: L("المحطات", "Stations") },
        { value: critical, label: L("محطات حرجة", "Critical stations") },
        { value: openHazards, label: L("مخاطر مفتوحة", "Open hazards") },
        { value: r.incidentRows.length, label: L("حوادث الفترة", "Incidents in period") },
      ],
      sections: [
        { heading: L("حالة السلامة لكل محطة", "Safety status per station"), headers: r.statusHeaders, rows: r.statusRows },
        { heading: L("سجل الحوادث خلال الفترة", "Incident log in period"), headers: r.incidentHeaders, rows: r.incidentRows.length ? r.incidentRows : [[L("لا توجد حوادث", "No incidents"), "—", "—"]] },
      ],
    });
  };

  return (
    <div className="p-4 rounded-xl border border-border bg-card space-y-3">
      <p className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
        <CalendarRange className="w-3.5 h-3.5" /> {L("تقرير السلامة (PDF / Excel)", "Safety report (PDF / Excel)")}
      </p>

      <div className="flex flex-wrap gap-2">
        {[{ key: "all", name: L("كل المحطات", "All stations") }, ...stations.map((s) => ({ key: s.id, name: s.name }))].map((s) => (
          <button
            key={s.key}
            type="button"
            onClick={() => setStationFilter(s.key)}
            className={`px-3 py-1.5 rounded-full text-xs font-body border transition ${stationFilter === s.key ? "bg-accent text-accent-foreground border-accent" : "border-border hover:bg-muted"}`}
          >
            {s.name}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {PRESETS.map(({ val }) => (
          <button
            key={val}
            type="button"
            onClick={() => setPreset(val)}
            className={`px-3 py-1.5 rounded-full text-xs font-body border transition ${preset === val ? "bg-foreground text-background border-foreground" : "border-border hover:bg-muted"}`}
          >
            {presetLabel(val)}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2 pt-1">
        <button
          type="button" onClick={exportExcel}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-md border border-emerald-300 text-emerald-700 text-xs font-body hover:bg-emerald-50 transition"
        >
          <FileSpreadsheet className="w-4 h-4" /> Excel
        </button>
        <button
          type="button" onClick={exportPdf}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-md border border-border text-xs font-body hover:bg-muted transition"
        >
          <FileText className="w-4 h-4" /> PDF
        </button>
      </div>
    </div>
  );
}