import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Network, Search } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/PowerCareAuth";
import { canManageJobCatalog } from "@/lib/jobCatalogApi";
import { orgTerms } from "@/lib/orgTerms";
import OrgTypeToggle from "@/components/hr/orgstructure/OrgTypeToggle";
import OrgStructureTree from "@/components/hr/orgstructure/OrgStructureTree";
import StationsView from "@/components/hr/orgstructure/StationsView";
import TitlesView from "@/components/hr/orgstructure/TitlesView";

export default function OrgStructure() {
  const { lang } = useI18n();
  const ar = lang === "ar";
  const { data, currentUser, company } = useAuth();
  const [tab, setTab] = useState("departments");
  const [query, setQuery] = useState("");
  const [manualExpanded, setManualExpanded] = useState(() => new Set());

  const nodes = data?.orgTree || [];
  const employees = data?.employees || [];
  const stations = data?.stations || [];

  // البحث يفتح مسار العقدة: العقد المطابقة + كل أسلافها تُوسَّع تلقائيًا.
  const { highlightIds, searchExpanded } = useMemo(() => {
    const q = query.trim().toLowerCase();
    const hits = new Set();
    const open = new Set();
    if (!q) return { highlightIds: hits, searchExpanded: open };
    const labelOf = (node) => node.type === "station"
      ? (stations.find((s) => s.id === node.refId)?.name || node.title || "")
      : (employees.find((e) => e.id === node.refId)?.name || "") + " " + (node.title || "");
    for (const node of nodes) {
      if (!labelOf(node).toLowerCase().includes(q)) continue;
      hits.add(node.id);
      let cursor = node;
      while (cursor?.parentId) {
        open.add(cursor.parentId);
        cursor = nodes.find((item) => item.id === cursor.parentId);
      }
    }
    return { highlightIds: hits, searchExpanded: open };
  }, [query, nodes, employees, stations]);

  if (!data || !currentUser) return null;

  // الموظف العادي يرى تسلسله الإداري فقط.
  const canViewStructure = canManageJobCatalog(currentUser, data)
    || ["station_manager", "pgm", "ops_manager", "director"].includes(currentUser.role)
    || !!currentUser.hrLevelId;
  if (!canViewStructure) {
    return (
      <div className="rounded-xl border border-border bg-card p-8 text-center space-y-3">
        <Network className="mx-auto h-8 w-8 text-accent" />
        <p className="text-sm text-muted-foreground">{ar ? "يمكنك الاطلاع على تسلسلك الإداري الخاص فقط." : "You can view your own management chain only."}</p>
        <Link to="/app/chain" className="inline-block rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground">{ar ? "عرض تسلسلي الإداري" : "View my chain"}</Link>
      </div>
    );
  }

  const expanded = new Set([...manualExpanded, ...searchExpanded]);
  const toggle = (id) => setManualExpanded((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const terms = orgTerms(data, lang);
  const tabs = [
    { id: "departments", label: terms.byUnits },
    { id: "stations", label: terms.bySites },
    { id: "titles", label: ar ? "المسميات الوظيفية" : "Job titles" },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-heading text-3xl font-semibold flex items-center gap-2"><Network className="w-7 h-7 text-accent" />{ar ? "الهيكل التنظيمي" : "Organizational structure"}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{ar ? `شجرة كاملة من بيانات ${terms.sites} والإدارات والموظفين — حتى مستوى الموظف الفرد.` : `A full tree built from ${terms.sites.toLowerCase()}, departments and employees — down to the individual employee.`}</p>
      </div>

      {canManageJobCatalog(currentUser, data) && (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card p-3">
          <p className="text-sm font-medium">{ar ? "نوع الجهة" : "Organization type"}</p>
          <OrgTypeToggle companyId={company.id} data={data} lang={lang} />
          <p className="text-xs text-muted-foreground">{ar ? `رأس الهيكل: ${terms.head} · الوحدة: ${terms.unit}` : `Structure head: ${terms.head} · Unit: ${terms.unit}`}</p>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-1 rounded-lg border border-border bg-card p-1">
          {tabs.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)} className={`rounded-md px-4 py-2 text-sm font-medium ${tab === t.id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}>
              {t.label}
            </button>
          ))}
        </div>
        <div className="relative flex-1 min-w-[220px] max-w-sm">
          <Search className="absolute top-1/2 -translate-y-1/2 start-3 w-4 h-4 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={ar ? "ابحث عن موظف أو وحدة — يُفتح مسار العقدة تلقائيًا" : "Search an employee or unit — the node path opens automatically"}
            className="w-full rounded-md border border-input bg-card ps-9 pe-3 py-2 text-sm"
          />
        </div>
      </div>

      {tab === "departments" && (
        <OrgStructureTree nodes={nodes} employees={employees} stations={stations} expanded={expanded} onToggle={toggle} highlightIds={highlightIds} lang={lang} />
      )}
      {tab === "stations" && <StationsView stations={stations} employees={employees} query={query} lang={lang} />}
      {tab === "titles" && <TitlesView employees={employees} smartPositions={data.smartPositions || []} query={query} lang={lang} />}
    </div>
  );
}