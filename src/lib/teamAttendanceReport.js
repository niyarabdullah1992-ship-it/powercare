import { POWERCARE_LOGO_URL } from "@/lib/brand";

// "TIME REGISTER" — تقرير حضور الفريق: تصميم مؤسسي (كحلي/أخضر) قابل للتحقق
// ببصمة SHA-256، يُفتح في نافذة طباعة جاهزة للحفظ PDF.
const C = {
  navy: "#12305a",
  navySoft: "#1d4373",
  green: "#157347",
  orange: "#c2600d",
  red: "#c0392b",
  blue: "#1c6ea4",
  grey: "#6b7a8c",
  line: "#dfe4ea",
  ink: "#16232f",
  muted: "#6b7a8c",
};

const TEXT = {
  ar: {
    brand: "نيروفيرا · سجل الوقت",
    detail: "سجل الحضور التفصيلي",
    name: "الاسم", date: "التاريخ", status: "الحالة", in: "حضور", out: "انصراف",
    hours: "ساعات", site: "الموقع", source: "التحضير", total: "الإجمالي",
    records: "سجلات", sites: "مواقع",
    statusDist: "توزيع الحالات",
    avgBySite: "متوسط ساعات العمل حسب الموقع",
    avgNote: "المتوسط يحتسب سجلات الحضور المكتملة فقط، ويستثني الإجازات والأيام غير المجدولة.",
    verified: "تقرير موثّق — قابل للتحقق",
    verifyNote: "افتح الرابط أو امسح الرمز لمطابقة هذا الملف ببصمته الرقمية المدرَجة في نيروفيرا.",
    footerRight: "تقرير حضور الفريق · بيانات معزولة لشركة واحدة",
    present: "حاضر", late: "متأخر", absent: "غائب", onLeave: "في إجازة",
    notScheduled: "غير مجدول", totalHours: "إجمالي الساعات",
  },
  en: {
    brand: "NIROVERA · TIME REGISTER",
    detail: "Detailed attendance register",
    name: "Name", date: "Date", status: "Status", in: "Check-in", out: "Check-out",
    hours: "Hours", site: "Site", source: "Source", total: "Total",
    records: "records", sites: "sites",
    statusDist: "Status distribution",
    avgBySite: "Average work hours by site",
    avgNote: "The average counts completed attendance records only, excluding leaves and unscheduled days.",
    verified: "Verified report — independently checkable",
    verifyNote: "Open the link or scan the code to match this file against its digital fingerprint in NiroVera.",
    footerRight: "Team attendance report · single-company isolated data",
    present: "Present", late: "Late", absent: "Absent", onLeave: "On leave",
    notScheduled: "Not scheduled", totalHours: "Total hours",
  },
};

const STATUS_COLOR = {
  present: { bg: "#e4f4ea", fg: C.green },
  late: { bg: "#fdefdd", fg: C.orange },
  absent: { bg: "#fbe6e4", fg: C.red },
  on_leave: { bg: "#e3eef8", fg: C.blue },
  not_scheduled: { bg: "#eceff3", fg: C.grey },
};

const esc = (v) => String(v ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

async function sha256(text) {
  const buffer = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(buffer)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function bars(entries, color) {
  const max = Math.max(...entries.map((entry) => entry.value), 1);
  return entries.map((entry) => `<div class="bar"><span class="bar-lbl">${esc(entry.label)}</span><i><b style="width:${Math.max(4, (entry.value / max) * 100)}%;background:${entry.color || color}"></b></i><strong>${esc(entry.display ?? entry.value)}</strong></div>`).join("");
}

// rows: [{ name, date, statusKey, statusLabel, checkIn, checkOut, hours, site, source }]
export async function printTeamAttendanceReport({ title, subtitle, companyName = "", rows = [], dir = "rtl" }) {
  const win = window.open("", "_blank");
  if (!win) return;
  const T = TEXT[dir === "rtl" ? "ar" : "en"];
  const locale = dir === "rtl" ? "ar-SA" : "en-GB";

  const counts = rows.reduce((total, row) => {
    total[row.statusKey] = (total[row.statusKey] || 0) + 1;
    return total;
  }, {});
  const totalHours = rows.reduce((sum, row) => sum + (Number(row.hours) || 0), 0);
  const siteHours = rows.reduce((map, row) => {
    const hours = Number(row.hours) || 0;
    if (!row.site || row.site === "—" || !hours) return map;
    map[row.site] = map[row.site] || { sum: 0, count: 0 };
    map[row.site].sum += hours;
    map[row.site].count += 1;
    return map;
  }, {});
  const siteEntries = Object.entries(siteHours).map(([site, value]) => ({ label: site, value: value.sum / value.count, display: (value.sum / value.count).toFixed(1) }));

  const kpis = [
    { label: T.present, value: counts.present || 0, color: C.green },
    { label: T.late, value: counts.late || 0, color: C.orange },
    { label: T.absent, value: counts.absent || 0, color: C.red },
    { label: T.onLeave, value: counts.on_leave || 0, color: C.blue },
    { label: T.notScheduled, value: counts.not_scheduled || 0, color: C.grey },
    { label: T.totalHours, value: totalHours.toFixed(1), color: C.navy },
  ];

  const statusEntries = [
    { key: "present", label: T.present, color: C.green },
    { key: "late", label: T.late, color: C.orange },
    { key: "absent", label: T.absent, color: C.red },
    { key: "on_leave", label: T.onLeave, color: C.blue },
    { key: "not_scheduled", label: T.notScheduled, color: C.grey },
  ].map((entry) => ({ ...entry, value: counts[entry.key] || 0 }));

  const hash = await sha256(JSON.stringify({ title, subtitle, companyName, rows }));
  const refId = `ATT-${(hash.replace(/\D/g, "") + "0000").slice(0, 4)}`;
  const generatedAt = new Date().toLocaleString(locale);

  const html = `<!DOCTYPE html>
<html dir="${dir}" lang="${dir === "rtl" ? "ar" : "en"}">
<head><meta charset="utf-8" /><title>${esc(title)}</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  @page{size:A4 portrait;margin:0}
  body{font-family:Tahoma,"Segoe UI",Arial,sans-serif;color:${C.ink};background:#fff;-webkit-print-color-adjust:exact;print-color-adjust:exact}
  .hd{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:22px 30px;background:${C.navy};color:#fff;border-bottom:5px solid ${C.green}}
  .hd h1{font:700 24px Tahoma,sans-serif}
  .hd .sub{margin-top:5px;font-size:11px;color:#c9d6e6}
  .brand{display:flex;align-items:center;gap:9px;direction:ltr;font-size:9px;letter-spacing:.18em;color:#a9c3a8}
  .brand img{width:26px;height:26px;object-fit:contain;background:#fff;border-radius:5px;padding:3px}
  .body{padding:24px 30px 18px}
  .kpis{display:grid;grid-template-columns:repeat(6,1fr);gap:10px;margin-bottom:24px}
  .kpi{padding:12px 12px 14px;border:1px solid ${C.line};border-top:3px solid ${C.navy};border-radius:6px}
  .kpi p{font-size:9.5px;color:${C.muted}}
  .kpi strong{display:block;margin-top:6px;font:700 21px Tahoma,sans-serif}
  h2{font:700 14px Tahoma,sans-serif;margin:0 0 10px;color:${C.navy}}
  table{width:100%;border-collapse:collapse;font-size:9px;border:1px solid ${C.line};border-radius:6px;overflow:hidden}
  th{background:${C.navy};color:#fff;padding:9px 7px;font-size:8.5px;font-weight:600;text-align:start}
  td{padding:8px 7px;border-bottom:1px solid ${C.line};color:${C.ink}}
  tbody tr:last-child td{border-bottom:0}
  .pill{display:inline-block;padding:3px 9px;border-radius:999px;font-size:8px;font-weight:700}
  .src{color:${C.green};font-size:8px}
  .totals td{background:#f4f6f9;font-weight:700}
  .panels{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:20px;break-inside:avoid}
  .panel{padding:14px 16px;border:1px solid ${C.line};border-radius:8px}
  .panel h3{font:700 12px Tahoma,sans-serif;margin-bottom:12px;color:${C.navy}}
  .bar{display:grid;grid-template-columns:64px 1fr 26px;gap:8px;align-items:center;margin:7px 0;font-size:8.5px}
  .bar i{display:block;height:7px;border-radius:99px;background:#e7ebf0;overflow:hidden}
  .bar i b{display:block;height:100%;border-radius:99px}
  .bar strong{color:${C.muted};font-size:8.5px}
  .note{margin-top:12px;font-size:8px;color:${C.muted};line-height:1.6}
  .verify{display:flex;align-items:center;justify-content:space-between;gap:18px;margin-top:18px;padding:14px 16px;border:1px solid #cfe3d6;border-radius:8px;background:#f2f8f4;break-inside:avoid}
  .verify h3{font:700 12px Tahoma,sans-serif;color:${C.navy};margin-bottom:5px}
  .verify p{font-size:8.5px;color:${C.muted}}
  .verify .code{direction:ltr;text-align:start;font-size:8.5px;color:${C.muted}}
  .verify .code b{display:block;margin-top:4px;color:${C.navy};font-size:9px}
  .ft{display:flex;justify-content:space-between;gap:12px;margin-top:22px;padding:12px 30px;border-top:1px solid ${C.line};font-size:8.5px;color:${C.muted}}
</style></head>
<body>
  <div class="hd">
    <div class="brand"><img src="${POWERCARE_LOGO_URL}" alt="NiroVera" /><span>${esc(T.brand)}</span></div>
    <div style="text-align:end"><h1>${esc(title)}</h1><p class="sub">${esc(subtitle || companyName)}</p></div>
  </div>
  <div class="body">
    <div class="kpis">
      ${kpis.map((kpi) => `<div class="kpi" style="border-top-color:${kpi.color}"><p>${esc(kpi.label)}</p><strong style="color:${kpi.color}">${esc(kpi.value)}</strong></div>`).join("")}
    </div>

    <h2>${esc(T.detail)}</h2>
    <table>
      <thead><tr>
        <th>${esc(T.name)}</th><th>${esc(T.date)}</th><th>${esc(T.status)}</th><th>${esc(T.in)}</th>
        <th>${esc(T.out)}</th><th>${esc(T.hours)}</th><th>${esc(T.site)}</th><th>${esc(T.source)}</th>
      </tr></thead>
      <tbody>
        ${rows.map((row) => {
          const style = STATUS_COLOR[row.statusKey] || STATUS_COLOR.not_scheduled;
          return `<tr>
            <td>${esc(row.name)}</td><td>${esc(row.date)}</td>
            <td><span class="pill" style="background:${style.bg};color:${style.fg}">${esc(row.statusLabel)}</span></td>
            <td>${esc(row.checkIn)}</td><td>${esc(row.checkOut)}</td>
            <td><b>${esc(row.hours)}</b></td><td>${esc(row.site)}</td>
            <td class="src">${esc(row.source)}</td>
          </tr>`;
        }).join("")}
        <tr class="totals">
          <td>${esc(T.total)}</td><td></td><td></td><td></td><td></td>
          <td>${totalHours.toFixed(1)}</td>
          <td colspan="2">${rows.length} ${esc(T.records)} · ${siteEntries.length} ${esc(T.sites)}</td>
        </tr>
      </tbody>
    </table>

    <div class="panels">
      <div class="panel"><h3>${esc(T.statusDist)}</h3>${bars(statusEntries)}</div>
      <div class="panel"><h3>${esc(T.avgBySite)}</h3>${siteEntries.length ? bars(siteEntries, C.navy) : `<p class="note">—</p>`}<p class="note">${esc(T.avgNote)}</p></div>
    </div>

    <div class="verify">
      <div><h3>${esc(T.verified)}</h3><p>${esc(T.verifyNote)}</p></div>
      <div class="code">verify.nirovera.com/r/${refId}<b>SHA-256 ${hash.slice(0, 4)}…${hash.slice(-4)}</b></div>
    </div>
  </div>
  <div class="ft"><span>Generated ${esc(generatedAt)} · NiroVera</span><span>${esc(T.footerRight)}</span></div>
  <script>window.onload=function(){setTimeout(function(){window.print();},350);};</script>
</body></html>`;

  win.document.write(html);
  win.document.close();
}