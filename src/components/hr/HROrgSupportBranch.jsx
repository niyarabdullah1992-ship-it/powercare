import React from "react";
import { levelName } from "@/lib/hrLevels";
import HROrgEmployeeNode from "@/components/hr/HROrgEmployeeNode";
import HROrgStationRow from "@/components/hr/HROrgStationRow";

export default function HROrgSupportBranch({ item, ar, lang }) {
  return <div className="relative flex flex-col items-center pt-7 before:absolute before:start-1/2 before:top-0 before:h-7 before:w-px before:bg-accent/30">
    <HROrgEmployeeNode employee={item.employee} ar={ar} title={levelName(item.level, lang)} variant="assistant" />
    <HROrgStationRow stations={item.stations} ar={ar} lang={lang} />
  </div>;
}