import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { X } from "lucide-react";
import { assignEmployeeToOrgStation, nodeAccess, saveOrgNode, setEmployeeReportsTo } from "@/lib/orgTree";
import { BUILT_IN_TEMPLATES } from "@/lib/permissionTemplates";
import { toast } from "@/components/ui/use-toast";
import {
  ACCENT,
  SURFACE,
  MUTED,
  NAVY,
  closeBtn,
  dialogOverlay,
  hintText,
  inputField,
  labelText,
  saveBtn,
  selectField,
  sheetForm,
  softPanel,
  subtitleStyle,
  titleStyle,
  ui,
} from "@/lib/orgModalStyles";

const HR_TEMPLATE = BUILT_IN_TEMPLATES.find((t) => t.id === "hr_officer");
const FIELD_TEMPLATE = BUILT_IN_TEMPLATES.find((t) => t.id === "field");

function isHrOfficer(permissions = {}, templateId = "") {
  return templateId === "hr_officer" || permissions.hr === "manage";
}

export default function OrgTreeSimpleEditor({ node, data, companyId, ar, onClose }) {
  const navigate = useNavigate();
  const employee = (data.employees || []).find((e) => e.id === node.refId);
  const stations = data.stations || [];
  const people = (data.orgTree || []).filter((n) => n.type === "employee" && n.id !== node.id);
  const stationNodes = (data.orgTree || []).filter((n) => n.type === "station");
  const existingPerms = nodeAccess(data, node.refId);
  const existingTemplate = (data.smartPositions || []).find((p) => p.employeeId === node.refId)?.templateId || "";

  const currentStationId = useMemo(() => {
    let cursor = (data.orgTree || []).find((n) => n.id === node.parentId);
    while (cursor && cursor.type !== "station") {
      cursor = (data.orgTree || []).find((n) => n.id === cursor.parentId);
    }
    return cursor?.refId || employee?.stationId || "";
  }, [data.orgTree, node.parentId, employee?.stationId]);

  const [title, setTitle] = useState(
    node.title || employee?.profile?.position || employee?.position || "",
  );
  const [branchId, setBranchId] = useState(currentStationId || "");
  const [reportsToId, setReportsToId] = useState(() => {
    const parent = (data.orgTree || []).find((n) => n.id === node.parentId);
    return parent?.type === "employee" ? parent.id : "";
  });
  const [hrRole, setHrRole] = useState(isHrOfficer(existingPerms, existingTemplate));
  const [busy, setBusy] = useState(false);

  const resolveAccess = () => {
    if (hrRole) {
      return {
        permissions: { ...(HR_TEMPLATE?.permissions || { hr: "manage", employees: "manage" }) },
        templateId: "hr_officer",
      };
    }
    if (isHrOfficer(existingPerms, existingTemplate)) {
      return {
        permissions: { ...(FIELD_TEMPLATE?.permissions || {}) },
        templateId: "field",
      };
    }
    return {
      permissions: { ...existingPerms },
      templateId: existingTemplate || "",
    };
  };

  const save = ({ openFile } = {}) => {
    if (!employee) return;
    if (!branchId) {
      toast({
        description: ar ? "اختر الفرع أولًا." : "Choose a branch first.",
        variant: "destructive",
      });
      return;
    }
    setBusy(true);
    try {
      const stNode = stationNodes.find((n) => String(n.refId) === String(branchId));
      if (!stNode) {
        toast({
          description: ar ? "الفرع غير موجود في الشجرة." : "Branch not found in the tree.",
          variant: "destructive",
        });
        return;
      }

      const moved = assignEmployeeToOrgStation(companyId, employee.id, stNode.id);
      if (!moved?.ok) {
        toast({
          description: ar ? (moved?.reason || "تعذّر ربط الفرع") : (moved?.reasonEn || "Could not set branch"),
          variant: "destructive",
        });
        return;
      }

      if (reportsToId) {
        const report = setEmployeeReportsTo(companyId, employee.id, reportsToId);
        if (!report?.ok) {
          toast({
            description: ar ? (report?.reason || "تعذّر ضبط المسؤول") : (report?.reasonEn || "Could not set manager"),
            variant: "destructive",
          });
          return;
        }
      }

      const { permissions, templateId } = resolveAccess();
      let nextTitle = title.trim();
      if (hrRole && !nextTitle) {
        nextTitle = ar ? (HR_TEMPLATE?.ar || "مسؤول موارد بشرية") : (HR_TEMPLATE?.en || "HR officer");
      }

      saveOrgNode(
        companyId,
        {
          ...node,
          title: nextTitle,
          parentId: reportsToId || stNode.id,
        },
        permissions,
        templateId,
      );

      toast({
        description: ar
          ? hrRole
            ? `حُفظ تنظيم «${employee.name}» — مفعّل كموارد بشرية لهذا الفرع`
            : `حُفظ تنظيم «${employee.name}»`
          : hrRole
            ? `Saved «${employee.name}» — HR for this branch`
            : `Saved placement for «${employee.name}»`,
      });
      onClose();
      if (openFile) {
        navigate(`/app/employees/${encodeURIComponent(employee.id)}?complete=1`);
      }
    } finally {
      setBusy(false);
    }
  };

  if (!employee) return null;

  return (
    <div style={{ ...dialogOverlay, zIndex: 80 }} onClick={onClose}>
      <div
        dir={ar ? "rtl" : "ltr"}
        onClick={(e) => e.stopPropagation()}
        style={{ ...sheetForm, maxWidth: 440 }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
          <div>
            <h3 style={titleStyle}>{ar ? "تنظيم الموظف" : "Organize employee"}</h3>
            <p style={subtitleStyle}>{employee.name}</p>
          </div>
          <button type="button" onClick={onClose} style={closeBtn} aria-label={ar ? "إغلاق" : "Close"}>
            <X style={{ width: 16, height: 16 }} />
          </button>
        </div>

        <label style={{ display: "block" }}>
          <span style={labelText}>{ar ? "المسمى الوظيفي" : "Job title"}</span>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={ar ? "مثال: مدير فرع" : "e.g. Branch manager"}
            style={inputField}
          />
          <span style={hintText}>
            {ar ? "يُحفظ في الشجرة وملف الموظف معًا." : "Saved to the tree and the employee file together."}
          </span>
        </label>

        <label style={{ display: "block" }}>
          <span style={labelText}>{ar ? "الفرع" : "Branch"}</span>
          <select value={branchId} onChange={(e) => setBranchId(e.target.value)} style={selectField}>
            <option value="">{ar ? "اختر الفرع" : "Select branch"}</option>
            {stations.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </label>

        <label style={{ display: "block" }}>
          <span style={labelText}>{ar ? "المسؤول المباشر" : "Direct manager"}</span>
          <select value={reportsToId} onChange={(e) => setReportsToId(e.target.value)} style={selectField}>
            <option value="">{ar ? "لا أحد — تحت الفرع مباشرة" : "None — directly under branch"}</option>
            {people.map((p) => {
              const emp = (data.employees || []).find((e) => e.id === p.refId);
              return (
                <option key={p.id} value={p.id}>
                  {emp?.name || p.id}{p.title ? ` · ${p.title}` : ""}
                </option>
              );
            })}
          </select>
        </label>

        <div style={softPanel}>
          <label style={{ display: "flex", alignItems: "flex-start", gap: 10, cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={hrRole}
              onChange={(e) => {
                const on = e.target.checked;
                setHrRole(on);
                if (on && !title.trim()) {
                  setTitle(ar ? "مسؤول موارد بشرية" : "HR officer");
                }
              }}
              style={{ marginTop: 3, width: 16, height: 16, accentColor: ACCENT }}
            />
            <span>
              <span style={{ display: "block", fontSize: 13, fontWeight: 600, color: NAVY }}>
                {ar ? "مسؤول موارد بشرية لهذا الفرع" : "HR officer for this branch"}
              </span>
              <span style={{ display: "block", marginTop: 4, fontSize: 11, lineHeight: 1.65, color: MUTED }}>
                {ar
                  ? "يفعّل صلاحية ملء ملفات موظفي نفس الفرع. المالك والمدير يملآن دائمًا بدون هذا الخيار."
                  : "Lets them fill employee files in the same branch. Owner and director can always fill without this."}
              </span>
            </span>
          </label>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ display: "flex", gap: 8 }}>
            <button type="button" onClick={onClose} style={{ ...ui.btnSecondary, flex: 1, height: 42 }}>
              {ar ? "إلغاء" : "Cancel"}
            </button>
            <button
              type="button"
              disabled={busy || !branchId}
              onClick={() => save()}
              style={{ ...saveBtn, flex: 1.4, opacity: busy || !branchId ? 0.4 : 1 }}
            >
              {ar ? "حفظ" : "Save"}
            </button>
          </div>
          <button
            type="button"
            disabled={busy || !branchId}
            onClick={() => save({ openFile: true })}
            style={{
              ...ui.btnSecondary,
              width: "100%",
              height: 40,
              background: SURFACE,
              opacity: busy || !branchId ? 0.4 : 1,
            }}
          >
            {ar ? "حفظ وافتح الملف للإكمال" : "Save and open file to complete"}
          </button>
        </div>
      </div>
    </div>
  );
}
