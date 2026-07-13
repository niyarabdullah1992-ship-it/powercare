import React from "react";
import { BarChart3, Building2, CheckCircle2, FileSignature, FolderKanban, LockKeyhole, MapPin, MessageSquare, ShieldCheck, Sparkles, Users } from "lucide-react";

const icons = { dashboard: BarChart3, location: MapPin, tasks: FolderKanban, hierarchy: Users, analytics: BarChart3, messages: MessageSquare, signature: FileSignature, assistant: Sparkles, security: LockKeyhole, brand: Building2, document: ShieldCheck };

export default function PresentationVisual({ type, steps = [] }) {
  if (type === "cover") return <div className="pc-orbit"><div className="pc-orbit-core">PC</div><span /><span /><span /></div>;
  if (type === "flow") return <div className="pc-before-after"><div><b>BEFORE</b><i /><i /><i /></div><strong>→</strong><div className="is-after"><b>POWERCARE</b><CheckCircle2 /></div></div>;
  if (type === "steps") return <div className="pc-step-flow">{steps.map(([n, ar, en]) => <div key={n}><b>{n}</b><span>{ar}</span><small>{en}</small></div>)}</div>;
  const Icon = icons[type] || BarChart3;
  return <div className={`pc-device pc-${type}`}><div className="pc-device-bar"><span /><span /><span /></div><aside><div className="pc-mini-logo">P</div>{[1,2,3,4,5].map((n) => <i key={n} />)}</aside><main><div className="pc-visual-title"><Icon /><b>PowerCare</b></div><div className="pc-kpis"><span /><span /><span /></div><div className="pc-chart"><i /><i /><i /><i /><i /></div></main></div>;
}