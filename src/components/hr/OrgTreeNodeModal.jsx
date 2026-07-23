import React, { useMemo, useState } from "react";
import { Loader2, Sparkles, Trash2, X } from "lucide-react";
import { base44 } from "@/api/base44Client";
import OrgTreeNodeFields from "@/components/hr/OrgTreeNodeFields";
import { deleteOrgNode, nodeAccess, saveOrgNode } from "@/lib/orgTree";

export default function OrgTreeNodeModal({ initial, data, companyId, lang, onClose }) {
  const ar = lang === "ar";
  const [type, setType] = useState(initial?.type || "employee");
  const [refId, setRefId] = useState(initial?.refId || "");
  const [title, setTitle] = useState(initial?.title || "");
  const [permissions, setPermissions] = useState(initial ? nodeAccess(data, initial.refId) : {});
  const [suggesting, setSuggesting] = useState(false);
  const nodes = data.orgTree || [];
  const usedEmployees = useMemo(() => nodes.filter((node) => node.type === "employee" && node.id !== initial?.id).map((node) => node.refId), [nodes, initial]);
  const suggest = async () => {
    if (!refId || type !== "employee") return;
    setSuggesting(true);
    const parent = nodes.find((node) => node.id === initial?.parentId);
    const children = nodes.filter((node) => node.parentId === initial?.id);
    const nameFor = (node) => node?.type === "employee" ? data.employees.find((e) => e.id === node.refId)?.name : data.stations.find((s) => s.id === node?.refId)?.name;
    try {
      const result = await base44.integrations.Core.InvokeLLM({ prompt: `Suggest one concise professional job title in ${ar ? "Arabic" : "English"}. Employee: ${data.employees.find((e) => e.id === refId)?.name}. Parent: ${nameFor(parent) || "none"}. Direct reports: ${children.map(nameFor).filter(Boolean).join(", ") || "none"}. Department permissions: ${JSON.stringify(permissions)}. Return only the title.` });
      setTitle(String(result).trim().replace(/^['"]|['"]$/g, ""));
    } catch { alert(ar ? "تعذر اقتراح المسمى الآن." : "Could not suggest a title right now."); }
    setSuggesting(false);
  };
  const hasPermission = type !== "employee" || Object.values(permissions).some(Boolean);
  const submit = (event) => { event.preventDefault(); if (!hasPermission) return; const parentId = initial?.parentId || null; const order = initial?.order ?? nodes.filter((node) => (node.parentId || null) === parentId).length; saveOrgNode(companyId, { id: initial?.id || `org_${crypto.randomUUID()}`, type, refId, title: title.trim(), parentId, order }, permissions); onClose(); };
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-primary/45 p-4" onClick={onClose}><form onSubmit={submit} onClick={(event) => event.stopPropagation()} dir={ar ? "rtl" : "ltr"} className="max-h-[92vh] w-full max-w-2xl space-y-4 overflow-auto rounded-xl border border-accent/40 bg-card p-5 shadow-elevated"><div className="flex items-start justify-between"><div><h3 className="font-heading text-2xl font-semibold">{initial ? (ar ? "تعديل العقدة" : "Edit node") : (ar ? "إضافة عقدة" : "Add node")}</h3><p className="text-xs text-muted-foreground">{ar ? "الموضع في الشجرة لا يغيّر الصلاحيات" : "Tree position does not change permissions"}</p></div><button type="button" onClick={onClose} className="rounded-md p-2 hover:bg-muted"><X className="h-4 w-4" /></button></div>
    <OrgTreeNodeFields type={type} setType={setType} refId={refId} setRefId={setRefId} title={title} setTitle={setTitle} permissions={permissions} setPermissions={setPermissions} employees={data.employees || []} stations={data.stations || []} usedEmployees={usedEmployees} editing={!!initial} ar={ar} />
    {type === "employee" && <button type="button" onClick={suggest} disabled={!refId || suggesting} className="flex w-full items-center justify-center gap-2 rounded-md border border-accent/40 bg-accent/5 px-4 py-2 text-sm font-semibold text-accent disabled:opacity-40">{suggesting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}{ar ? "اقتراح مسمى بالذكاء الاصطناعي" : "Suggest title with AI"}</button>}
    <div className="flex gap-2">{initial && <button type="button" onClick={() => { if (confirm(ar ? "حذف العقدة من الشجرة؟" : "Remove this node from the tree?")) { deleteOrgNode(companyId, initial.id); onClose(); } }} className="flex items-center gap-2 rounded-md border border-destructive/40 px-4 py-2 text-sm text-destructive"><Trash2 className="h-4 w-4" />{ar ? "حذف" : "Delete"}</button>}<button type="submit" disabled={!refId || !title.trim() || !hasPermission} className="flex-1 rounded-md bg-accent px-4 py-2.5 text-sm font-semibold text-accent-foreground disabled:opacity-40">{ar ? "حفظ" : "Save"}</button></div></form></div>;
}