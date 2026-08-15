import React from "react";
import { useSearchParams } from "react-router-dom";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/PowerCareAuth";
import { useOrgTerms } from "@/hooks/useOrgTerms";
import FlexOrgTree from "@/components/hr/FlexOrgTree";
import OrgListWorkbench from "@/components/hr/OrgListWorkbench";
import OrgAssignBoard from "@/components/hr/OrgAssignBoard";
import PlatformStampShell from "@/components/shared/PlatformStampShell";
import { orderedOrgTracks } from "@/lib/orgTracks";

const TABS = [
  { value: "seats", ar: "القائمة", en: "List" },
  { value: "assign", ar: "تعيين", en: "Assign" },
  { value: "tree", ar: "الشجرة", en: "Tree" },
];

const TAB_ALIAS = {
  board: "seats",
  lists: "seats",
  list: "seats",
  grades: "seats",
};

/** Platform `org` — seats with a list column, then assign from the seat, then tree placement. */
export default function OrgStructure() {
  const { lang } = useI18n();
  const ar = lang === "ar";
  const { data, currentUser, company } = useAuth();
  const { terms } = useOrgTerms();
  const [params, setParams] = useSearchParams();
  const requested = TAB_ALIAS[params.get("tab")] || params.get("tab");
  const tool = TABS.some((tab) => tab.value === requested) ? requested : "seats";

  if (!data || !currentUser) return null;

  const tracks = orderedOrgTracks(data);
  const requestedList = params.get("list");
  const listId = tracks.some((track) => track.id === requestedList) ? requestedList : "";

  const setList = (id, tab = tool) => {
    const next = { tab };
    if (id) next.list = id;
    if (params.get("employee") && tab === "assign") next.employee = params.get("employee");
    setParams(next, { replace: true });
  };
  const openAssign = (id) => {
    const next = { tab: "assign" };
    if (id) next.list = id;
    setParams(next, { replace: true });
  };
  const select = (value) => {
    if (value === "tree") {
      setParams({ tab: "tree" }, { replace: true });
      return;
    }
    const next = { tab: value === "assign" ? "assign" : "seats" };
    if (listId) next.list = listId;
    if (value === "assign" && params.get("employee")) next.employee = params.get("employee");
    setParams(next, { replace: true });
  };

  const hint = {
    seats: ar
      ? "كل قائمة بطاقتها: درجاتها ومناصبها معاً."
      : "Each list is one card: its grades and seats together.",
    assign: ar
      ? "موظف ثم منصب. الدرجة من قائمة ذلك المنصب."
      : "Employee, then seat. The grade comes from that seat’s list.",
    tree: ar
      ? `ضع الشخص في فرعه تحت مسؤول · ${terms.stations}`
      : `Place the person in a branch under a manager · ${terms.stations}`,
  }[tool];

  return (
    <PlatformStampShell
      ar={ar}
      title={ar ? "الهيكل التنظيمي" : "Org structure"}
      hint={hint}
      maxWidth={1280}
      sections={TABS.map((tab) => ({ value: tab.value, label: ar ? tab.ar : tab.en }))}
      tool={tool}
      onTool={select}
    >
      {tool === "seats" ? (
        <OrgListWorkbench
          lang={lang}
          trackId={listId}
          onTrackId={(id) => setList(id, "seats")}
          onAssign={openAssign}
        />
      ) : null}
      {tool === "assign" ? (
        <OrgAssignBoard
          lang={lang}
          trackId={listId}
          onTrackId={(id) => setList(id, "assign")}
          initialEmployeeId={params.get("employee") || ""}
        />
      ) : null}
      {tool === "tree" ? <FlexOrgTree data={data} company={company} currentUser={currentUser} lang={lang} /> : null}
    </PlatformStampShell>
  );
}
