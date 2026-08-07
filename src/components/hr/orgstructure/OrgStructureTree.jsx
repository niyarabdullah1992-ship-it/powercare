import React from "react";
import { Building2, ChevronDown, ChevronLeft, User } from "lucide-react";

// عقدة شجرية قابلة للطي/التوسيع تُبنى من data.orgTree حتى مستوى الموظف الفرد.
function TreeNode({ node, nodes, employees, stations, expanded, onToggle, highlightIds, depth }) {
  const children = nodes.filter((item) => (item.parentId || null) === node.id).sort((a, b) => a.order - b.order);
  const isOpen = expanded.has(node.id);
  const isHit = highlightIds.has(node.id);
  const isStation = node.type === "station";
  const label = isStation
    ? stations.find((s) => s.id === node.refId)?.name || node.title || "—"
    : employees.find((e) => e.id === node.refId)?.name || "—";

  return (
    <div style={{ marginInlineStart: depth ? 20 : 0 }} className={depth ? "border-s border-border ps-3" : ""}>
      <button
        onClick={() => children.length && onToggle(node.id)}
        className={`flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-start text-sm hover:bg-muted ${isHit ? "bg-accent/10 ring-1 ring-accent/40" : ""}`}
      >
        {children.length > 0 ? (isOpen ? <ChevronDown className="w-3.5 h-3.5 shrink-0 text-muted-foreground" /> : <ChevronLeft className="w-3.5 h-3.5 shrink-0 text-muted-foreground rtl:rotate-0 ltr:rotate-180" />) : <span className="w-3.5" />}
        <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md ${isStation ? "bg-primary text-primary-foreground" : "bg-accent/15 text-accent-text"}`}>
          {isStation ? <Building2 className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
        </span>
        <span className="min-w-0">
          <span className="block truncate font-medium">{label}</span>
          {!isStation && node.title && <span className="block truncate text-xs text-muted-foreground">{node.title}</span>}
        </span>
        {children.length > 0 && <span className="ms-auto text-xs text-muted-foreground">{children.length}</span>}
      </button>
      {isOpen && children.map((child) => (
        <TreeNode key={child.id} node={child} nodes={nodes} employees={employees} stations={stations} expanded={expanded} onToggle={onToggle} highlightIds={highlightIds} depth={depth + 1} />
      ))}
    </div>
  );
}

export default function OrgStructureTree({ nodes, employees, stations, expanded, onToggle, highlightIds, lang }) {
  const roots = nodes.filter((node) => !node.parentId).sort((a, b) => a.order - b.order);
  if (!roots.length) return <p className="text-sm text-muted-foreground text-center py-8">{lang === "ar" ? "لم يُبن الهيكل بعد — رتّب الشجرة من صفحة الموارد البشرية." : "No structure yet — arrange the tree from the HR page."}</p>;
  return (
    <div className="rounded-xl border border-border bg-card p-3 space-y-1">
      {roots.map((node) => (
        <TreeNode key={node.id} node={node} nodes={nodes} employees={employees} stations={stations} expanded={expanded} onToggle={onToggle} highlightIds={highlightIds} depth={0} />
      ))}
    </div>
  );
}