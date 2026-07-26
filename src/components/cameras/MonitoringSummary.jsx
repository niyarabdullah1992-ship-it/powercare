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
  return <section className="camera-health-ribbon"><div className="camera-panel-heading"><div><p>{ar ? "حالة البنية الأمنية" : "Security infrastructure"}</p><h2>{ar ? "شريط صحة الأنظمة" : "System Health Ribbon"}</h2></div><span>{ar ? "مراقبة مباشرة" : "LIVE MONITORING"}</span></div><div className="camera-health-grid">{cards.map(({ label, value, icon: Icon, tone }) => <div key={label} className="camera-health-cell"><span className="camera-health-icon"><Icon className={`h-5 w-5 ${tone}`} /></span><div><p className="camera-health-value">{value}</p><p className="camera-health-label">{label}</p></div><span className="camera-health-pulse" /></div>)}</div></section>;
}