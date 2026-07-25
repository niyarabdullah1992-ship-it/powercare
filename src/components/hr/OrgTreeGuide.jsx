import React, { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import ComplaintEscalationGuide from "@/components/hr/ComplaintEscalationGuide";
import OrgTreeDetailedSections from "@/components/hr/OrgTreeDetailedSections";

export default function OrgTreeGuide({ ar }) {
  const [open, setOpen] = useState(false);
  return <div className="border-b border-accent/20 bg-secondary/45 px-4 py-4"><button type="button" onClick={() => setOpen(!open)} aria-expanded={open} className="flex w-full items-center justify-between gap-3 text-start"><div><h3 className="text-sm font-semibold">{ar ? "كيف تعمل شجرة الموارد البشرية؟" : "How does the HR tree work?"}</h3><p className="mt-1 text-xs text-muted-foreground">{ar ? "اضغط لعرض شرح الشجرة ومسار تصعيد الشكاوى." : "Select to view the tree and complaint escalation guide."}</p></div>{open ? <ChevronUp className="h-5 w-5 shrink-0 text-accent" /> : <ChevronDown className="h-5 w-5 shrink-0 text-accent" />}</button>{open && <div className="mt-4"><OrgTreeDetailedSections ar={ar} /><ComplaintEscalationGuide ar={ar} /></div>}</div>;
}