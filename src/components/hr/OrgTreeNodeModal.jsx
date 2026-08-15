import React, { useEffect, useMemo, useState } from "react";
import { Loader2, MapPin, Sparkles, Trash2, X } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useI18n } from "@/lib/i18n";
import { canAddStation } from "@/lib/planLimits";
import OrgTreeNodeFields from "@/components/hr/OrgTreeNodeFields";
import OrgTreeCreateFields from "@/components/hr/OrgTreeCreateFields";
import EmployeeManagerField from "@/components/hr/EmployeeManagerField";
import OrgParentPicker from "@/components/hr/OrgParentPicker";
import StationLocationEditor from "@/components/stations/StationLocationEditor";
import {
  createOrgRecord,
  deleteOrgNode,
  nodeAccess,
  positionManagerInOrgTree,
  saveOrgNode,
  saveOrgStationLocation,
  saveOrgStationName,
} from "@/lib/orgTree";
import { assignStationManager, setStationManager } from "@/lib/store";
import {
  CUSTOM_TEMPLATE_ID,
  INHERIT_TEMPLATE_ID,
  inheritedPermissions,
  samePermissions,
  stationForParentNode,
  templateById,
} from "@/lib/permissionTemplates";
import { isCompanyOwner } from "@/lib/permissions";
import {
  ACCENT,
  MUTED,
  closeBtn,
  dialogOverlay,
  mapBtn,
  saveBtn,
  sheetForm,
  subtitleStyle,
  titleStyle,
  ui,
} from "@/lib/orgModalStyles";

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
  const [mapLocation, setMapLocation] = useState(
    station
      ? { lat: station.lat, lng: station.lng, radiusMeters: station.radiusMeters }
      : { lat: null, lng: null, radiusMeters: 200 },
  );
  const [showMap, setShowMap] = useState(false);
  const [permissions, setPermissions] = useState(() => {
    if (initial) return nodeAccess(data, initial.refId);
    return {};
  });
  const employee = initial?.type === "employee" ? data.employees.find((item) => item.id === initial.refId) : null;
  const initialManagerStations = employee
    ? [...new Set([
      ...(employee.managedStations || []),
      ...(data.stations || []).filter((item) => item.managerId === employee.id).map((item) => item.id),
    ])]
    : [];
  const [managerStationIds, setManagerStationIds] = useState(initialManagerStations);
  const [managerPlacement, setManagerPlacement] = useState("none");
  const [suggesting, setSuggesting] = useState(false);
  const [templateId, setTemplateId] = useState(() => {
    if (initial) {
      return (data.smartPositions || []).find((item) => item.employeeId === initial.refId)?.templateId || CUSTOM_TEMPLATE_ID;
    }
    return CUSTOM_TEMPLATE_ID;
  });
  const [branchStationId, setBranchStationId] = useState("");
  const [reportsToNodeId, setReportsToNodeId] = useState("");
  const [positionId, setPositionId] = useState("");

  const nodes = data.orgTree || [];
  const ownerMode = isCompanyOwner(currentUser, data);
  const grantable = ownerMode ? null : nodeAccess(data, currentUser?.id);
  const inherited = useMemo(() => inheritedPermissions(data, parentId), [data, parentId]);
  const derivedStation = useMemo(() => stationForParentNode(data, parentId), [data, parentId]);
  const templatePermissions = templateId === INHERIT_TEMPLATE_ID
    ? inherited
    : templateById(data, templateId)?.permissions;
  const customized = Boolean(templateId) && !samePermissions(permissions, templatePermissions || {});
  const titleSuggestions = useMemo(
    () => [...new Set(
      (data.jobGrades || []).map((grade) => grade.name)
        .concat((data.orgPositions || []).map((item) => item.title))
        .concat((data.smartPositions || []).map((item) => item.title)),
    )].filter(Boolean),
    [data.jobGrades, data.smartPositions],
  );

  const applyTemplate = (id) => {
    const nextId = id || CUSTOM_TEMPLATE_ID;
    setTemplateId(nextId);
    if (nextId === CUSTOM_TEMPLATE_ID) {
      setPermissions({});
      return;
    }
    if (nextId === INHERIT_TEMPLATE_ID) {
      setPermissions({ ...inherited });
      return;
    }
    const tpl = templateById(data, nextId);
    setPermissions({ ...(tpl?.permissions || {}) });
  };

  useEffect(() => {
    if (initial || type !== "employee") return;
    if (!branchStationId) {
      setParentId(null);
      return;
    }
    const stNode = nodes.find((n) => n.type === "station" && String(n.refId) === String(branchStationId));
    setParentId(reportsToNodeId || stNode?.id || null);
  }, [initial, type, branchStationId, reportsToNodeId, nodes]);

  const suggest = async () => {
    const employeeName = initial ? data.employees.find((e) => e.id === refId)?.name : form.name;
    if (!employeeName || type !== "employee") return;
    setSuggesting(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Suggest one concise professional job title in ${ar ? "Arabic" : "English"}. Employee: ${employeeName}. Department permissions: ${JSON.stringify(permissions)}. Return only the title.`,
      });
      setTitle(String(result).trim().replace(/^['"]|['"]$/g, ""));
    } catch {
      alert(ar ? "تعذر اقتراح المسمى الآن." : "Could not suggest a title right now.");
    }
    setSuggesting(false);
  };

  const resolveCreateAccess = () => ({
    permissions,
    templateId: positionId || templateId || CUSTOM_TEMPLATE_ID,
  });

  const submit = (event) => {
    event.preventDefault();
    if (initial) {
      const order = parentId === initial.parentId
        ? initial.order
        : nodes.filter((node) => (node.parentId || null) === parentId).length;
      saveOrgNode(companyId, { ...initial, title: title.trim(), parentId, order }, permissions, templateId);
      if (type === "station") {
        saveOrgStationName(companyId, refId, stationName.trim());
        saveOrgStationLocation(companyId, refId, mapLocation);
        setStationManager(companyId, refId, managerId || null);
      } else {
        if ([...managerStationIds].sort().join() !== [...initialManagerStations].sort().join()) {
          assignStationManager(companyId, refId, managerStationIds);
        }
        if (managerPlacement !== "none") positionManagerInOrgTree(companyId, refId, managerStationIds);
      }
    } else {
      if (type === "station" && !canAddStation(company, data)) {
        return alert(ar ? "تم بلوغ حد الفروع في الباقة." : "The plan station limit has been reached.");
      }
      const email = form.email.trim().toLowerCase();
      const allowed = (data.settings?.allowedEmails || []).map((item) => String(item).trim().toLowerCase());
      if (type === "employee" && data.employees.some((e) => e.email?.toLowerCase() === email)) {
        return alert(ar ? "البريد مستخدم مسبقًا." : "Email already exists.");
      }
      if (type === "employee" && allowed.length && !allowed.includes(email)) {
        return alert(ar ? "البريد غير موجود في القائمة المسموحة." : "Email is not on the allowed list.");
      }
      if (type === "employee" && !branchStationId) {
        return alert(ar ? "اختر الفرع أولًا." : "Choose a branch first.");
      }

      const access = type === "employee" ? resolveCreateAccess() : { permissions: {}, templateId: "" };
      const nextTitle = title.trim();

      const createdStationId = createOrgRecord(
        companyId,
        {
          ...form,
          ...mapLocation,
          stationId: type === "employee" ? branchStationId : (derivedStation?.id || ""),
          email,
          type,
          title: nextTitle,
          parentId,
          templateId: access.templateId,
        },
        access.permissions,
      );
      if (type === "station" && createdStationId) setStationManager(companyId, createdStationId, form.managerId || null);
    }
    onClose();
  };

  const createEmployee = !initial && type === "employee";
  const saveDisabled = initial
    ? !title.trim() || (type === "station" && !stationName.trim())
    : !form.name.trim()
      || (type === "employee" && (!form.email.trim() || !title.trim() || !branchStationId));

  return (
    <div style={dialogOverlay} onClick={onClose}>
      <form
        onSubmit={submit}
        onClick={(event) => event.stopPropagation()}
        dir={ar ? "rtl" : "ltr"}
        style={sheetForm}
      >
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
          <div style={{ minWidth: 0 }}>
            <h3 style={titleStyle}>
              {initial ? (ar ? "تعديل العقدة" : "Edit node") : (ar ? "إنشاء مباشر" : "Create directly")}
            </h3>
            <p style={subtitleStyle}>
              {createEmployee
                ? (ar ? "اختر منصباً من الجدول، ثم الفرع والمسؤول." : "Pick a position from the table, then branch and manager.")
                : (ar ? "أنشئ فرعًا أولاً إن لزم، ثم أضف الموظف تحت ذلك الفرع." : "Create a branch first if needed, then add the employee under it.")}
            </p>
          </div>
          <button type="button" onClick={onClose} style={closeBtn} aria-label={ar ? "إغلاق" : "Close"}>
            <X style={{ width: 16, height: 16 }} />
          </button>
        </div>

        {initial ? (
          <OrgTreeNodeFields
            type={type}
            refId={refId}
            setRefId={() => {}}
            title={title}
            setTitle={setTitle}
            stationName={stationName}
            setStationName={setStationName}
            managerId={managerId}
            setManagerId={setManagerId}
            permissions={permissions}
            setPermissions={setPermissions}
            employees={data.employees || []}
            stations={data.stations || []}
            usedEmployees={[]}
            editing
            ar={ar}
            data={data}
            companyId={companyId}
            templateId={templateId}
            onTemplate={applyTemplate}
            hasParent={Boolean(parentId)}
            customized={customized}
            ownerMode={ownerMode}
            grantable={grantable}
            titleSuggestions={titleSuggestions}
          />
        ) : (
          <OrgTreeCreateFields
            type={type}
            setType={setType}
            form={form}
            setForm={setForm}
            title={title}
            setTitle={setTitle}
            permissions={permissions}
            setPermissions={setPermissions}
            stations={data.stations || []}
            employees={data.employees || []}
            ar={ar}
            data={data}
            companyId={companyId}
            templateId={templateId}
            onTemplate={applyTemplate}
            hasParent={Boolean(parentId)}
            customized={customized}
            ownerMode={ownerMode}
            grantable={grantable}
            titleSuggestions={titleSuggestions}
            branchStationId={branchStationId}
            setBranchStationId={setBranchStationId}
            reportsToNodeId={reportsToNodeId}
            setReportsToNodeId={setReportsToNodeId}
            positionId={positionId}
            setPositionId={setPositionId}
          />
        )}

        {initial?.type === "employee" && (
          <EmployeeManagerField
            value={managerStationIds}
            onChange={setManagerStationIds}
            placement={managerPlacement}
            onPlacementChange={setManagerPlacement}
            stations={data.stations || []}
            ar={ar}
          />
        )}

        {!createEmployee && (
          <OrgParentPicker
            nodes={nodes}
            employees={data.employees || []}
            stations={data.stations || []}
            currentId={initial?.id}
            value={parentId}
            onChange={setParentId}
            ar={ar}
          />
        )}

        {type === "station" && (
          <button type="button" onClick={() => setShowMap(true)} style={mapBtn}>
            <MapPin style={{ width: 16, height: 16 }} />
            {mapLocation.lat != null
              ? (ar ? "تعديل الموقع على الخريطة" : "Edit location on map")
              : (ar ? "تحديد الموقع على الخريطة" : "Set location on map")}
          </button>
        )}

        {type === "employee" && (
          <button
            type="button"
            onClick={suggest}
            disabled={!(initial ? refId : form.name.trim()) || suggesting}
            style={{
              alignSelf: "flex-start",
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              border: "none",
              background: "transparent",
              padding: 0,
              fontSize: 11,
              fontWeight: 500,
              color: MUTED,
              cursor: suggesting ? "wait" : "pointer",
              fontFamily: "inherit",
              opacity: (!(initial ? refId : form.name.trim()) || suggesting) ? 0.4 : 1,
            }}
          >
            {suggesting
              ? <Loader2 style={{ width: 14, height: 14, color: ACCENT }} className="animate-spin" />
              : <Sparkles style={{ width: 14, height: 14, color: ACCENT }} />}
            {ar ? "اقتراح مسمى" : "Suggest title"}
          </button>
        )}

        <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
          {initial && (
            <button
              type="button"
              onClick={() => {
                if (confirm(ar ? "حذف العقدة من الشجرة؟" : "Remove this node from the tree?")) {
                  deleteOrgNode(companyId, initial.id);
                  onClose();
                }
              }}
              style={{ ...ui.btnDanger, display: "inline-flex", alignItems: "center", gap: 6, height: 42 }}
            >
              <Trash2 style={{ width: 15, height: 15 }} />
              {ar ? "حذف" : "Delete"}
            </button>
          )}
          <button
            type="submit"
            disabled={saveDisabled}
            style={{ ...saveBtn, flex: 1, opacity: saveDisabled ? 0.4 : 1, cursor: saveDisabled ? "not-allowed" : "pointer" }}
          >
            {ar ? "حفظ" : "Save"}
          </button>
        </div>
      </form>

      {showMap && (
        <StationLocationEditor
          t={t}
          station={{ name: station?.name || form.name || (ar ? "فرع جديدة" : "New station"), ...mapLocation }}
          onSave={(location) => { setMapLocation(location); setShowMap(false); }}
          onCancel={() => setShowMap(false)}
        />
      )}
    </div>
  );
}
