import React from "react";
import { Activity, CheckCircle2, HardHat, HeartPulse, Leaf, ShieldCheck, Users } from "lucide-react";

const standards = ["ISO 45001", "PPE", "Risk Control"];
const modules = ["Attendance", "Tasks", "HR", "Payroll", "Reports"];

export default function HsePromoScene({ scene }) {
  if (scene === 0) return <div className="hse-scene"><div className="hse-orbit"><ShieldCheck /><span /><span /></div><h3>التزام راسخ بمعايير HSE</h3><p>السلامة والصحة المهنية في قلب كل عملية</p><div className="hse-pills">{standards.map((item) => <span key={item}><CheckCircle2 />{item}</span>)}</div></div>;
  if (scene === 1) return <div className="hse-scene"><div className="hse-risk-grid">{[HardHat, Activity, HeartPulse].map((Icon, index) => <span key={index}><Icon /><i /></span>)}</div><h3>الوقاية قبل المخاطر</h3><p>رصد استباقي، بلاغات فورية، ومتابعة واضحة</p></div>;
  if (scene === 2) return <div className="hse-scene"><div className="hse-platform-core"><ShieldCheck />{modules.map((item, index) => <span key={item} style={{ "--item": index }}>{item}</span>)}</div><h3>منصة واحدة لكل أعمالك</h3><p>تشغيل مترابط من الحضور حتى القرار التنفيذي</p></div>;
  return <div className="hse-scene"><div className="hse-commitment"><Users /><ShieldCheck /><Leaf /></div><h3>نحمي الإنسان ونرفع الأداء</h3><p>امتثال مستمر، فرق أكثر أمانًا، ومستقبل مستدام</p><div className="hse-sweep" /></div>;
}