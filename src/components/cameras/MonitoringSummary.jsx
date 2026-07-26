import React from "react";
import { AlertTriangle, Camera, CircleOff, Radio } from "lucide-react";

export default function MonitoringSummary({ cameras, statuses, unreadAlerts, ar }) {
  const online = cameras.filter((item) => statuses[item.id] === "online").length;
  const offline = cameras.filter((item) => statuses[item.id] === "offline").length;
  const cards = [
    { label: ar ? "إجمالي الكاميرات" : "Total cameras", value: cameras.length, icon: Camera, tone: "text-primary-foreground" },
    { label: ar ? "كاميرات متصلة" : "Online cameras", value: online, icon: Radio, tone: "text-emerald-400" },
    { label: ar ? "كاميرات منقطعة" : "Offline cameras", value: offline, icon: CircleOff, tone: "text-red-400" },
    { label: ar ? "تنبيهات غير مقروءة" : "Unread alerts", value: unreadAlerts, icon: AlertTriangle, tone: "text-amber-300" },
  ];
  return <section className="rounded-xl border border-accent/35 bg-primary p-5 text-primary-foreground shadow-elevated"><div className="mb-4"><p className="text-xs font-semibold uppercase tracking-widest text-accent">{ar ? "ملخص المراقبة" : "Monitoring summary"}</p><h2 className="mt-1 font-heading text-2xl font-semibold">{ar ? "الوضع الأمني الآن" : "Security status now"}</h2></div><div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{cards.map(({ label, value, icon: Icon, tone }) => <div key={label} className="rounded-lg border border-primary-foreground/15 bg-primary-foreground/5 p-4"><Icon className={`h-5 w-5 ${tone}`} /><p className="mt-3 text-3xl font-bold">{value}</p><p className="mt-1 text-xs text-primary-foreground/65">{label}</p></div>)}</div></section>;
}