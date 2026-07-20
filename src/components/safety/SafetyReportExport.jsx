import React, { useState } from "react";
import { exportExcelColored } from "@/lib/exportExcelColored";
import { printReport } from "@/lib/printReport";
import { FileSpreadsheet, FileText, CalendarRange } from "lucide-react";
import SafetyStationPicker from "@/components/safety/SafetyStationPicker";
import { CHECKLIST_GROUPS, PERMIT_REQUIREMENTS, PERMIT_TYPES, checklistCompliance, safetyKpis } from "@/lib/safetyStandards";

// تقرير السلامة (HSE): حالة كل محطة + سجل الحوادث خلال الفترة — PDF وExcel.
const PRESETS = [
  { val: "month", months: 1 },
  { val: "3months", months: 3 },
  { val: "6months", months: 6 },
  { val: "year", months: 12 },
  { val: "days", months: 0 },
  { val: "custom", months: 0 },
];

export default function SafetyReportExport({ stations, safety, data, t, lang, dir }) {
  const [preset, setPreset] = useState("month");
  const [stationFilter, setStationFilter] = useState("all");
  const [customDays, setCustomDays] = useState("");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const ar = lang === "ar";
  const L = (a, e) => (ar ? a : e);
  const branding = data?.reportBranding || {};
  const color = branding.color || "#b07d3f";

  const presetLabel = (val) => ({
    month: L("شهر", "1 Month"),
    "3months": L("٣ أشهر", "3 Months"),
    "6months": L("٦ أشهر", "6 Months"),
    year: L("سنة", "1 Year"),
    days: L("أيام محددة", "Specific days"),
    custom: L("بين تاريخين", "Date range"),
  })[val];

  const levelLabel = (lv) => ({
    green: L("آمن", "Safe"),
    amber: L("مراقبة", "Watch"),
    red: L("حرج", "Critical"),
  })[lv] || L("غير محدد", "Not set");

  const fmt = (d) => (d ? new Date(d).toLocaleDateString(ar ? "ar-SA" : "en-GB") : "—");
  const recFor = (sid) => (safety || []).find((s) => s.stationId === sid) || null;

  const scopedStations = stationFilter === "all" ? stations : stations.filter((s) => s.id === stationFilter);
  const selectedApproved = scopedStations.length > 0 && scopedStations.every((station) => !!recFor(station.id)?.approvedBy);
  const periodValid = preset === "days"
    ? Number(customDays) > 0
    : preset === "custom"
      ? !!customStart && !!customEnd && new Date(customStart) <= new Date(customEnd)
      : true;
  const canExport = selectedApproved && periodValid;

  const buildReport = () => {
    let start = new Date();
    let end = new Date();
    if (preset === "days") {
      start.setDate(start.getDate() - Number(customDays || 1));
    } else if (preset === "custom") {
      if (customStart) start = new Date(customStart);
      if (customEnd) { end = new Date(customEnd); end.setHours(23, 59, 59, 999); }
    } else {
      const months = PRESETS.find((p) => p.val === preset)?.months || 1;
      start.setMonth(start.getMonth() - months);
    }
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
        (rec?.incidentLog || []).length,
        fmt(rec?.lastInspection),
        rec?.approvedBy ? `${rec.approvedBy} — ${fmt(rec.approvedAt)}` : L("غير معتمد", "Not approved"),
      ];
    });

    const incidentHeaders = [L("المحطة", "Station"), L("التاريخ", "Date"), L("الوصف", "Description")];
    const incidentRows = scopedStations.flatMap((st) =>
      ((recFor(st.id)?.incidentLog) || [])
        .filter((i) => i.at && new Date(i.at) >= start && new Date(i.at) <= end)
        .map((i) => [st.name, fmt(i.at), i.description || "—"])
    );

    const riskHeaders = [L("المحطة", "Station"), L("الخطر", "Hazard"), "P", "S", L("المستوى", "Risk level"), L("الإجراء التصحيحي", "Corrective action"), L("المسؤول", "Owner"), L("الموعد", "Due date")];
    const riskRows = scopedStations.flatMap((st) => (recFor(st.id)?.riskItems || []).map((item) => [st.name, item.hazard, item.probability, item.severity, Number(item.probability) * Number(item.severity), item.correctiveAction || "—", item.owner || "—", fmt(item.dueDate)]));
    const kpiHeaders = [L("المحطة", "Station"), L("ساعات العمل", "Work hours"), L("حوادث الشهر", "Month incidents"), "TRIR", "LTI", "LTIFR", L("أيام بدون حوادث", "Days incident-free")];
    const kpiRows = scopedStations.map((st) => { const rec = recFor(st.id) || {}; const k = safetyKpis(rec); return [st.name, k.hours, k.incidents, k.trir.toFixed(2), k.lti, k.ltifr.toFixed(2), k.days]; });
    const checklistHeaders = [L("المحطة", "Station"), L("نسبة المطابقة", "Compliance"), L("البند", "Checklist item"), L("النتيجة", "Result"), L("التعليق", "Comment")];
    const checklistRows = scopedStations.flatMap((st) => { const results = recFor(st.id)?.checklistResults || {}; const standards = CHECKLIST_GROUPS.flatMap((group) => group.items.map(([id, a, e]) => [id, ar ? a : e])); const custom = Object.entries(results).filter(([id]) => id.startsWith("custom_")).map(([id, value]) => [id, value.label]); return [...standards, ...custom].map(([id, label]) => [st.name, `${checklistCompliance(results)}%`, label, ({ yes: L("نعم", "Yes"), no: L("لا", "No"), note: L("ملاحظة", "Observation") })[results[id]?.status] || L("غير محدد", "Not set"), results[id]?.comment || "—"]); });
    const permitHeaders = [L("المحطة", "Station"), L("النوع", "Type"), L("الوصف", "Description"), L("الفريق", "Team"), L("الاشتراطات", "Requirements"), L("الحالة", "Status"), L("الصلاحية حتى", "Valid until"), L("المعتمد", "Signed by")];
    const permitRows = scopedStations.flatMap((st) => (recFor(st.id)?.permits || []).map((p) => { const status = p.status === "cancelled" ? "cancelled" : new Date(p.validUntil).getTime() < Date.now() ? "expired" : "open"; return [st.name, PERMIT_TYPES.find(([id]) => id === p.type)?.[ar ? 1 : 2] || p.type, p.description, p.team, (p.requirements || []).map((id) => PERMIT_REQUIREMENTS.find(([key]) => key === id)?.[ar ? 1 : 2] || id).join(", "), status, fmt(p.validUntil), `${p.signedBy || "—"} — ${fmt(p.signedAt)}`]; }));
    const stationLabel = stationFilter === "all" ? L("كل المحطات", "All stations") : scopedStations[0]?.name || "";
    const periodLabel = `${stationLabel} • ${fmt(start)} → ${fmt(end)}`;
    return { statusHeaders, statusRows, incidentHeaders, incidentRows, riskHeaders, riskRows, kpiHeaders, kpiRows, checklistHeaders, checklistRows, permitHeaders, permitRows, periodLabel };
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
        r.incidentHeaders, ...r.incidentRows, [],
        [L("مصفوفة تقييم المخاطر", "Risk Assessment Matrix")], r.riskHeaders, ...r.riskRows, [],
        [L("مؤشرات أداء السلامة", "Safety KPIs")], r.kpiHeaders, ...r.kpiRows, [],
        [L("نتائج قوائم التحقق", "Checklist Results")], r.checklistHeaders, ...r.checklistRows, [],
        [L("تصاريح العمل", "Permits to Work")], r.permitHeaders, ...r.permitRows,
      ],
      color,
      dir,
      theme: "executiveGold",
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
      theme: "executiveGold",
      stats: [
        { value: r.statusRows.length, label: L("المحطات", "Stations") },
        { value: critical, label: L("محطات حرجة", "Critical stations") },
        { value: openHazards, label: L("مخاطر مفتوحة", "Open hazards") },
        { value: r.incidentRows.length, label: L("حوادث الفترة", "Incidents in period") },
      ],
      sections: [
        { heading: L("حالة السلامة لكل محطة", "Safety status per station"), headers: r.statusHeaders, rows: r.statusRows },
        { heading: L("سجل الحوادث خلال الفترة", "Incident log in period"), headers: r.incidentHeaders, rows: r.incidentRows.length ? r.incidentRows : [[L("لا توجد حوادث", "No incidents"), "—", "—"]] },
        { heading: L("مصفوفة تقييم المخاطر", "Risk Assessment Matrix"), headers: r.riskHeaders, rows: r.riskRows },
        { heading: L("مؤشرات أداء السلامة", "Safety KPIs"), headers: r.kpiHeaders, rows: r.kpiRows },
        { heading: L("نتائج قوائم التحقق", "Checklist Results"), headers: r.checklistHeaders, rows: r.checklistRows },
        { heading: L("تصاريح العمل", "Permits to Work"), headers: r.permitHeaders, rows: r.permitRows },
        ],
    });
  };

  return (
    <div className="p-4 rounded-xl border border-border bg-card space-y-3">
      <p className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
        <CalendarRange className="w-3.5 h-3.5" /> {L("تقرير السلامة حسب الفترة", "Safety report by period")}
      </p>

      <SafetyStationPicker stations={stations} value={stationFilter} onChange={setStationFilter} lang={lang} />

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

      {preset === "days" && (
        <input
          type="number" min="1" value={customDays}
          onChange={(e) => setCustomDays(e.target.value)}
          placeholder={L("عدد الأيام", "Number of days")}
          className="w-40 px-3 py-2 rounded-md border border-input text-sm font-body"
        />
      )}

      {preset === "custom" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-muted-foreground font-body block mb-1">{L("من تاريخ", "From date")}</label>
            <input type="date" value={customStart} onChange={(e) => setCustomStart(e.target.value)} className="w-full px-3 py-2 rounded-md border border-input text-sm font-body" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground font-body block mb-1">{L("إلى تاريخ", "To date")}</label>
            <input type="date" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)} className="w-full px-3 py-2 rounded-md border border-input text-sm font-body" />
          </div>
        </div>
      )}

      {!selectedApproved && <p className="text-[11px] text-red-600 font-body">{L("لا يمكن التصدير: يجب اعتماد بيانات جميع المحطات المحددة أولًا.", "Export unavailable: approve every selected station first.")}</p>}
      {selectedApproved && !periodValid && <p className="text-[11px] text-red-600 font-body">{L("أدخل فترة زمنية صحيحة.", "Enter a valid date period.")}</p>}
      <div className="flex flex-wrap gap-2 pt-1">
        <button
          type="button" disabled={!canExport} onClick={exportExcel}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-md border border-emerald-300 text-emerald-700 text-xs font-body hover:bg-emerald-50 transition disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <FileSpreadsheet className="w-4 h-4" /> Excel
        </button>
        <button
          type="button" disabled={!canExport} onClick={exportPdf}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-md border border-border text-xs font-body hover:bg-muted transition disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <FileText className="w-4 h-4" /> PDF
        </button>
      </div>
    </div>
  );
}