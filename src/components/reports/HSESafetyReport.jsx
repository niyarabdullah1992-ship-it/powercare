import React from "react";
import { Link } from "react-router-dom";
import { ShieldCheck, ShieldAlert, Timer, Printer, BadgeCheck, PenLine } from "lucide-react";
import { printReport } from "@/lib/printReport";
import { formatDate, formatDateTime } from "@/lib/dateFormat";
import moment from "moment";

// HSE monthly safety report per station — calculated from the approved data entered
// in the Safety (HSE) section: incidents log, hazards, safety level and a live
// "hours without incidents" counter, exportable as a branded printable PDF.
export default function HSESafetyReport({ data, company, stations, lang, dir }) {
  const ar = lang === "ar";
  const now = Date.now();
  const monthStart = moment().startOf("month");

  const recFor = (sid) => (data.safety || []).find((s) => s.stationId === sid) || null;
  const baselineOf = (station, rec) => rec?.lastIncidentAt || station.createdAt || new Date().toISOString();
  const hoursSafe = (station, rec) => Math.max(0, Math.floor((now - new Date(baselineOf(station, rec)).getTime()) / 3600000));
  const incidentsThisMonth = (rec) => (rec?.incidentLog || []).filter((i) => moment(i.at).isSameOrAfter(monthStart)).length;
  const allApproved = stations.length > 0 && stations.every((station) => !!recFor(station.id)?.approvedBy);

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
        { label: ar ? "إجمالي الحوادث" : "Total incidents", value: (rec?.incidentLog || []).length },
        { label: ar ? "مستوى السلامة" : "Safety level", value: levelLabel(rec?.level) },
        { label: ar ? "حالة الاعتماد" : "Approval", value: rec?.approvedBy ? `${ar ? "معتمد —" : "Approved —"} ${rec.approvedBy}` : (ar ? "غير معتمد" : "Not approved") },
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
          return [s.name, hoursSafe(s, rec).toLocaleString(), incidentsThisMonth(rec), (rec?.incidentLog || []).length, levelLabel(rec?.level)];
        }),
      }],
      logoUrl: branding.logoUrl,
      color: branding.color,
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <p className="text-sm text-muted-foreground font-body">
          {ar ? "تُحسب هذه التقارير من البيانات المُدخلة والمعتمدة في قسم السلامة (HSE)." : "These reports are calculated from the data entered and approved in the Safety (HSE) section."}
        </p>
        <div className="flex items-center gap-2">
          <Link to="/app/safety" className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border text-xs font-body hover:bg-muted">
            <PenLine className="w-3.5 h-3.5" /> {ar ? "قسم السلامة" : "Safety section"}
          </Link>
          <button disabled={!allApproved} onClick={printAll} title={!allApproved ? (ar ? "اعتمد بيانات جميع المحطات أولًا" : "Approve all stations first") : undefined} className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border text-xs font-body hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed">
            <Printer className="w-3.5 h-3.5" /> {ar ? "PDF لجميع المحطات" : "All stations PDF"}
          </button>
        </div>
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

              <p className="text-[11px] font-body flex items-center gap-1.5">
                <BadgeCheck className={`w-3.5 h-3.5 ${rec?.approvedBy ? "text-emerald-600" : "text-muted-foreground"}`} />
                {rec?.approvedBy
                  ? <span className="text-muted-foreground">{ar ? "اعتمده" : "Approved by"} <span className="font-semibold text-foreground">{rec.approvedBy}</span>{rec.approvedAt ? ` — ${formatDateTime(rec.approvedAt, lang)}` : ""}</span>
                  : <span className="text-amber-600">{ar ? "البيانات غير معتمدة بعد — اعتمدها من قسم السلامة" : "Data not approved yet — approve it in the Safety section"}</span>}
              </p>

              <button disabled={!rec?.approvedBy} onClick={() => printStation(station)} className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-md border border-border text-xs font-body hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed">
                <Printer className="w-3.5 h-3.5" /> {ar ? "تقرير شهري PDF" : "Monthly PDF"}
              </button>
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