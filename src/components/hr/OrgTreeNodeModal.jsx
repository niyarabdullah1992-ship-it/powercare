import React, { useMemo, useState } from "react";
import { Loader2, MapPin, Sparkles, Trash2, X } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useI18n } from "@/lib/i18n";
import { canAddStation } from "@/lib/planLimits";
import OrgTreeNodeFields from "@/components/hr/OrgTreeNodeFields";
import OrgTreeCreateFields from "@/components/hr/OrgTreeCreateFields";
import EmployeeManagerField from "@/components/hr/EmployeeManagerField";
import OrgParentPicker from "@/components/hr/OrgParentPicker";
import StationLocationEditor from "@/components/stations/StationLocationEditor";
import { createOrgRecord, deleteOrgNode, nodeAccess, positionManagerInOrgTree, saveOrgNode, saveOrgStationLocation, saveOrgStationName } from "@/lib/orgTree";
import { assignStationManager, setStationManager } from "@/lib/store";
import { INHERIT_TEMPLATE_ID, inheritedPermissions, samePermissions, stationForParentNode, templateById } from "@/lib/permissionTemplates";
import { isCompanyOwner } from "@/lib/permissions";

const empty = { name: "", email: "", stationId: "", location: "", stationType: "", managerId: "" };
export default function OrgTreeNodeModal({ initial, data, company, companyId, currentUser, lang, onClose }) {
  const { t } = useI18n();
  const ar = lang === "ar";
  const [type, setType] = useState(initial?.type || "employee");
  const [refId] = useState(initial?.refId || "");
  const [title, setTitle] = useState(initial?.title || "");
  const [parentId, setParentId] = useState(initial?.parentId || null);
  const [form, setForm] = useState(empty);
  const station = initial?.type === "station" ? data.stations.find((item) => item.id === initial.refId) : null;
  const [stationName, setStationName] = useState(station?.name || "");
  const [managerId, setManagerId] = useState(station?.managerId || "");
  const [mapLocation, setMapLocation] = useState(station ? { lat: station.lat, lng: station.lng, radiusMeters: station.radiusMeters } : { lat: null, lng: null, radiusMeters: 200 });
  const [showMap, setShowMap] = useState(false);
  const [permissions, setPermissions] = useState(initial ? nodeAccess(data, initial.refId) : {});
  const employee = initial?.type === "employee" ? data.employees.find((item) => item.id === initial.refId) : null;
  const initialManagerStations = employee ? [...new Set([...(employee.managedStations || []), ...(data.stations || []).filter((item) => item.managerId === employee.id).map((item) => item.id)])] : [];
  const [managerStationIds, setManagerStationIds] = useState(initialManagerStations);
  const [managerPlacement, setManagerPlacement] = useState("none");
  const [suggesting, setSuggesting] = useState(false);
  const [templateId, setTemplateId] = useState(initial ? (data.smartPositions || []).find((item) => item.employeeId === initial.refId)?.templateId || "" : "");
  const nodes = data.orgTree || [];
  const ownerMode = isCompanyOwner(currentUser, data);
  const grantable = ownerMode ? null : nodeAccess(data, currentUser?.id);
  const inherited = useMemo(() => inheritedPermissions(data, parentId), [data, parentId]);
  const derivedStation = useMemo(() => stationForParentNode(data, parentId), [data, parentId]);
  const templatePermissions = templateId === INHERIT_TEMPLATE_ID ? inherited : templateById(data, templateId)?.permissions;
  const customized = Boolean(templateId) && !samePermissions(permissions, templatePermissions || {});
  const titleSuggestions = useMemo(() => [...new Set((data.jobGrades || []).map((grade) => grade.name).concat((data.smartPositions || []).map((item) => item.title)))].filter(Boolean), [data.jobGrades, data.smartPositions]);
  const applyTemplate = (id) => {
    setTemplateId(id);
    setPermissions(id === INHERIT_TEMPLATE_ID ? { ...inherited } : { ...(templateById(data, id)?.permissions || {}) });
  };
  const suggest = async () => {
    const employeeName = initial ? data.employees.find((employee) => employee.id === refId)?.name : form.name;
    if (!employeeName || type !== "employee") return;
    setSuggesting(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({ prompt: `Suggest one concise professional job title in ${ar ? "Arabic" : "English"}. Employee: ${employeeName}. Department permissions: ${JSON.stringify(permissions)}. Return only the title.` });
      setTitle(String(result).trim().replace(/^['"]|['"]$/g, ""));
    } catch { alert(ar ? "تعذر اقتراح المسمى الآن." : "Could not suggest a title right now."); }
    setSuggesting(false);
  };
  const submit = (event) => {
    event.preventDefault();
    if (initial) {
      const order = parentId === initial.parentId ? initial.order : nodes.filter((node) => (node.parentId || null) === parentId).length;
      saveOrgNode(companyId, { ...initial, title: title.trim(), parentId, order }, permissions, templateId);
      if (type === "station") {
        saveOrgStationName(companyId, refId, stationName.trim());
        saveOrgStationLocation(companyId, refId, mapLocation);
        setStationManager(companyId, refId, managerId || null);
      } else {
        if ([...managerStationIds].sort().join() !== [...initialManagerStations].sort().join()) assignStationManager(companyId, refId, managerStationIds);
        if (managerPlacement !== "none") positionManagerInOrgTree(companyId, refId, managerStationIds);
      }
    } else {
      if (type === "station" && !canAddStation(company, data)) return alert(ar ? "تم بلوغ حد المحطات في الباقة." : "The plan station limit has been reached.");
      const email = form.email.trim().toLowerCase();
      const allowed = (data.settings?.allowedEmails || []).map((item) => String(item).trim().toLowerCase());
      if (type === "employee" && data.employees.some((employee) => employee.email?.toLowerCase() === email)) return alert(ar ? "البريد مستخدم مسبقًا." : "Email already exists.");
      if (type === "employee" && allowed.length && !allowed.includes(email)) return alert(ar ? "البريد غير موجود في القائمة المسموحة." : "Email is not on the allowed list.");
      const createdStationId = createOrgRecord(companyId, { ...form, ...mapLocation, stationId: derivedStation?.id || "", email, type, title: title.trim(), parentId, templateId }, permissions);
      if (type === "station" && createdStationId) setStationManager(companyId, createdStationId, form.managerId || null);
    }
    onClose();
  };
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-primary/45 p-4" onClick={onClose}><form onSubmit={submit} onClick={(event) => event.stopPropagation()} dir={ar ? "rtl" : "ltr"} className="max-h-[92vh] w-full max-w-2xl space-y-4 overflow-auto rounded-xl border border-accent/40 bg-card p-5 shadow-elevated"><div className="flex items-start justify-between"><div><h3 className="font-heading text-2xl font-semibold">{initial ? (ar ? "تعديل العقدة" : "Edit node") : (ar ? "إنشاء مباشر" : "Create directly")}</h3><p className="text-xs text-muted-foreground">{ar ? "أنشئ محطة أو موظفًا وأضفه للشجرة فورًا" : "Create a station or employee and add it to the tree"}</p></div><button type="button" onClick={onClose} className="rounded-md p-2 hover:bg-muted"><X className="h-4 w-4" /></button></div>
    {initial ? <OrgTreeNodeFields type={type} refId={refId} setRefId={() => {}} title={title} setTitle={setTitle} stationName={stationName} setStationName={setStationName} managerId={managerId} setManagerId={setManagerId} permissions={permissions} setPermissions={setPermissions} employees={data.employees || []} stations={data.stations || []} usedEmployees={[]} editing ar={ar} data={data} companyId={companyId} templateId={templateId} onTemplate={applyTemplate} hasParent={Boolean(parentId)} customized={customized} ownerMode={ownerMode} grantable={grantable} titleSuggestions={titleSuggestions} /> : <OrgTreeCreateFields type={type} setType={setType} form={form} setForm={setForm} title={title} setTitle={setTitle} permissions={permissions} setPermissions={setPermissions} stations={data.stations || []} employees={data.employees || []} ar={ar} data={data} companyId={companyId} templateId={templateId} onTemplate={applyTemplate} hasParent={Boolean(parentId)} customized={customized} ownerMode={ownerMode} grantable={grantable} derivedStation={derivedStation} titleSuggestions={titleSuggestions} />}
    {initial?.type === "employee" && <EmployeeManagerField value={managerStationIds} onChange={setManagerStationIds} placement={managerPlacement} onPlacementChange={setManagerPlacement} stations={data.stations || []} ar={ar} />}
    <OrgParentPicker nodes={nodes} employees={data.employees || []} stations={data.stations || []} currentId={initial?.id} value={parentId} onChange={setParentId} ar={ar} />
    {type === "station" && <button type="button" onClick={() => setShowMap(true)} className="flex w-full items-center justify-center gap-2 rounded-md border border-accent/40 bg-accent/5 px-4 py-2 text-sm font-semibold text-accent"><MapPin className="h-4 w-4" />{mapLocation.lat != null ? (ar ? "تعديل الموقع على الخريطة" : "Edit location on map") : (ar ? "تحديد الموقع على الخريطة" : "Set location on map")}</button>}
    {type === "employee" && <button type="button" onClick={suggest} disabled={!(initial ? refId : form.name.trim()) || suggesting} className="flex w-full items-center justify-center gap-2 rounded-md border border-accent/40 bg-accent/5 px-4 py-2 text-sm font-semibold text-accent disabled:opacity-40">{suggesting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}{ar ? "اقتراح مسمى بالذكاء الاصطناعي" : "Suggest title with AI"}</button>}
    <div className="flex gap-2">{initial && <button type="button" onClick={() => { if (confirm(ar ? "حذف العقدة من الشجرة؟" : "Remove this node from the tree?")) { deleteOrgNode(companyId, initial.id); onClose(); } }} className="flex items-center gap-2 rounded-md border border-destructive/40 px-4 py-2 text-sm text-destructive"><Trash2 className="h-4 w-4" />{ar ? "حذف" : "Delete"}</button>}<button type="submit" disabled={initial ? !title.trim() || (type === "station" && !stationName.trim()) : !form.name.trim() || (type === "employee" && (!form.email.trim() || !title.trim()))} className="flex-1 rounded-md bg-accent px-4 py-2.5 text-sm font-semibold text-accent-foreground disabled:opacity-40">{ar ? "حفظ" : "Save"}</button></div></form>{showMap && <StationLocationEditor t={t} station={{ name: station?.name || form.name || (ar ? "محطة جديدة" : "New station"), ...mapLocation }} onSave={(location) => { setMapLocation(location); setShowMap(false); }} onCancel={() => setShowMap(false)} />}</div>;
}