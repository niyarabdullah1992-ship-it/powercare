import React from "react";
import { levelName } from "@/lib/hrLevels";
import HROrgEmployeeNode from "@/components/hr/HROrgEmployeeNode";
import HROrgStationRow from "@/components/hr/HROrgStationRow";
import HROrgSupportBranch from "@/components/hr/HROrgSupportBranch";

export default function HROrgManagerBranch({ group, ar, lang }) {
  return <section className="relative flex min-w-[280px] flex-col items-center pt-8 before:absolute before:start-1/2 before:top-0 before:h-8 before:w-px before:bg-accent/30">
    <HROrgEmployeeNode employee={group.manager} ar={ar} title={levelName(group.level, lang)} variant="manager" />
    {group.assistants.length > 0 && <><div className="h-7 w-px bg-accent/30" /><div className="flex items-start justify-center gap-5 border-t border-accent/30 px-4">{group.assistants.map((item) => <HROrgSupportBranch key={item.employee.id} item={item} ar={ar} lang={lang} />)}</div></>}
    <HROrgStationRow stations={group.stations} ar={ar} lang={lang} />
  </section>;
}