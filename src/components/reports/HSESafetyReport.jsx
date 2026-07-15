import React, { useState } from "react";
import { ShieldCheck, ShieldAlert, Timer, Printer, AlertTriangle } from "lucide-react";
import { printReport } from "@/lib/printReport";
import { formatDate, formatDateTime } from "@/lib/dateFormat";
import { recordSafetyIncident } from "@/lib/store";
import moment from "moment";

// HSE monthly safety report per station: incidents log, hazards, safety level and a
// live "hours without incidents" counter — exportable as a branded printable PDF.
export default function HSESafetyReport({ data, company, stations, canEdit, lang, dir }) {
  const ar = lang === "ar";
  const [logFor, setLogFor] = useState(null);
  const [desc, setDesc] = useState("");
  const now = Date.now();
  const monthStart = moment().startOf("month");

  const recFor = (sid) => (data.safety || []).find((s) => s.stationId === sid) || null;
  const baselineOf = (station, rec) => rec?.lastIncidentAt || station.createdAt || new Date().toISOString();
  const hoursSafe = (station, rec) => Math.max(0, Math.floor((now - new Date(baselineOf(station, rec)).getTime()) / 3600000));
  const incidentsThisMonth = (rec) => (rec?.incidentLog || []).filter((i) => moment(i.at).isSameOrAfter(monthStart)).length;

  const levelStyle = (level) => ({
    green: "bg-emerald-100 text-emerald-700 border-emerald-300",
    amber: "bg-amber-100 text-amber-700 border-amber-300",
    red: "bg-red-100 text-red-700 border-red-300",
  }[level] || "bg-muted text-muted-foreground border-border");

  const levelLabel = (level) => ({
    green: ar ? "آمنة" : "Safe",
    amber: ar ? "تحت المراقبة" : "Watch",
    red: ar ? "حرجة" : "Critical",
  }[level] || (ar ? "غير مقيّمة" : "Not assessed"));

  const branding = {
    logoUrl: data.reportBranding?.logoUrl || "",
    color: data.reportBranding?.color || "#b07d3f",
    companyName: data.name || company?.name || "",
  };

  const printStation = (station) => {
    const rec = recFor(station.id);
    const logRows = (rec?.incidentLog || [])
      .filter((i) => moment(i.at).isSameOrAfter(monthStart))
      .map((i) => [formatDateTime(i.at, lang), i.description || "—"]);
    printReport({
      title: `${ar ? "تقرير السلامة الشهري (HSE)" : "Monthly HSE Safety Report"} — ${station.name}`,
      companyName: branding.companyName,
      periodLabel: monthStart.format("MMMM YYYY"),
      dir,
      stats: [
        { label: ar ? "ساعات بدون حوادث" : "Hours without incidents", value: hoursSafe(station, rec).toLocaleString() },
        { label: ar ? "حوادث هذا الشهر" : "Incidents this month", value: incidentsThisMonth(rec) },
        { label: ar ? "إجمالي الحوادث" : "Total incidents", value: rec?.incidents || 0 },
        { label: ar ? "مستوى السلامة" : "Safety level", value: levelLabel(rec?.level) },
      ],
      sections: [
        {
          heading: ar ? "سجل حوادث الشهر" : "This month's incident log",
          headers: [ar ? "التاريخ" : "Date", ar ? "الوصف" : "Description"],
          rows: logRows.length ? logRows : [[monthStart.format("MMMM YYYY"), ar ? "لا توجد حوادث مسجلة هذا الشهر ✓" : "No incidents recorded this month ✓"]],
        },
        {
          heading: ar ? "المخاطر المرصودة" : "Open hazards",
          headers: [ar ? "الخطر" : "Hazard"],
          rows: (rec?.hazards || []).length ? rec.hazards.map((h) => [h]) : [[ar ? "لا توجد مخاطر مفتوحة" : "No open hazards"]],
        },
        {
          heading: ar ? "بيانات التفتيش" : "Inspection data",
          headers: [ar ? "آخر تفتيش" : "Last inspection", ar ? "آخر حادث" : "Last incident"],
          rows: [[
            rec?.lastInspection ? formatDate(rec.lastInspection, lang) : "—",
            rec?.lastIncidentAt ? formatDateTime(rec.lastIncidentAt, lang) : (ar ? "لا يوجد" : "None"),
          ]],
        },
      ],
      logoUrl: branding.logoUrl,
      color: branding.color,
    });
  };

  const printAll = () => {
    printReport({
      title: ar ? "تقرير السلامة الشهري (HSE) — جميع المحطات" : "Monthly HSE Safety Report — All Stations",
      companyName: branding.companyName,
      periodLabel: monthStart.format("MMMM YYYY"),
      dir,
      stats: [
        { label: ar ? "المحطات" : "Stations", value: stations.length },
        { label: ar ? "حوادث هذا الشهر" : "Incidents this month", value: stations.reduce((a, s) => a + incidentsThisMonth(recFor(s.id)), 0) },
        { label: ar ? "محطات حرجة" : "Critical stations", value: stations.filter((s) => recFor(s.id)?.level === "red").length },
      ],
      sections: [{
        heading: ar ? "ملخص السلامة حسب المحطة" : "Safety summary by station",
        headers: [ar ? "المحطة" : "Station", ar ? "ساعات بدون حوادث" : "Hours w/o incidents", ar ? "حوادث الشهر" : "Month incidents", ar ? "إجمالي الحوادث" : "Total", ar ? "المستوى" : "Level"],
        rows: stations.map((s) => {
          const rec = recFor(s.id);
          return [s.name, hoursSafe(s, rec).toLocaleString(), incidentsThisMonth(rec), rec?.incidents || 0, levelLabel(rec?.level)];
        }),
      }],
      logoUrl: branding.logoUrl,
      color: branding.color,
    });
  };

  const submitIncident = (stationId) => {
    recordSafetyIncident(company.id, stationId, desc.trim());
    setLogFor(null);
    setDesc("");
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <p className="text-sm text-muted-foreground font-body">
          {ar ? "تقرير شهري للسلامة لكل محطة مع سجل ساعات بدون حوادث." : "Monthly per-station safety report with an hours-without-incidents record."}
        </p>
        <button onClick={printAll} className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border text-xs font-body hover:bg-muted">
          <Printer className="w-3.5 h-3.5" /> {ar ? "PDF لجميع المحطات" : "All stations PDF"}
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {stations.map((station) => {
          const rec = recFor(station.id);
          const hrs = hoursSafe(station, rec);
          return (
            <div key={station.id} className="rounded-xl border border-border bg-card p-4 shadow-sm space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  {rec?.level === "red" ? <ShieldAlert className="w-4 h-4 text-red-500 shrink-0" /> : <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />}
                  <h3 className="font-body font-semibold text-sm truncate">{station.name}</h3>
                </div>
                <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] border shrink-0 ${levelStyle(rec?.level)}`}>{levelLabel(rec?.level)}</span>
              </div>

              <div className="rounded-lg bg-muted/60 p-3 flex items-center gap-3">
                <Timer className="w-5 h-5 text-accent shrink-0" />
                <div>
                  <p className="text-xl font-heading font-semibold leading-none">{hrs.toLocaleString()}</p>
                  <p className="text-[11px] text-muted-foreground font-body mt-1">{ar ? "ساعة بدون حوادث" : "hours without incidents"}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center">
                <MiniStat label={ar ? "حوادث الشهر" : "This month"} value={incidentsThisMonth(rec)} />
                <MiniStat label={ar ? "الإجمالي" : "Total"} value={rec?.incidents || 0} />
                <MiniStat label={ar ? "مخاطر مفتوحة" : "Hazards"} value={(rec?.hazards || []).length} />
              </div>

              {logFor === station.id ? (
                <div className="space-y-2">
                  <input
                    value={desc}
                    onChange={(e) => setDesc(e.target.value)}
                    placeholder={ar ? "وصف الحادث…" : "Incident description…"}
                    autoFocus
                    className="w-full px-3 py-2 rounded-md border border-input bg-background text-xs font-body focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                  <div className="flex items-center gap-2">
                    <button onClick={() => submitIncident(station.id)} className="flex-1 py-1.5 rounded-md bg-red-600 text-white text-xs font-body font-semibold hover:opacity-90">
                      {ar ? "تسجيل الحادث" : "Log incident"}
                    </button>
                    <button onClick={() => { setLogFor(null); setDesc(""); }} className="px-3 py-1.5 rounded-md border border-border text-xs font-body hover:bg-muted">
                      {ar ? "إلغاء" : "Cancel"}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <button onClick={() => printStation(station)} className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md border border-border text-xs font-body hover:bg-muted">
                    <Printer className="w-3.5 h-3.5" /> {ar ? "تقرير شهري PDF" : "Monthly PDF"}
                  </button>
                  {canEdit && (
                    <button onClick={() => setLogFor(station.id)} className="flex items-center gap-1 px-3 py-1.5 rounded-md border border-red-200 text-red-600 text-xs font-body hover:bg-red-50">
                      <AlertTriangle className="w-3.5 h-3.5" /> {ar ? "حادث" : "Incident"}
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
      {stations.length === 0 && (
        <p className="text-sm text-muted-foreground font-body text-center py-6">{ar ? "لا توجد محطات ضمن الفلتر المحدد." : "No stations in the selected filter."}</p>
      )}
    </div>
  );
}

function MiniStat({ label, value }) {
  return (
    <div className="rounded-lg border border-border/60 py-2">
      <p className="text-sm font-heading font-semibold">{value}</p>
      <p className="text-[10px] text-muted-foreground font-body">{label}</p>
    </div>
  );
}