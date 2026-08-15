import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { X } from "lucide-react";
import { assignEmployeeToOrgStation, nodeAccess, saveOrgNode, setEmployeeReportsTo } from "@/lib/orgTree";
import { toast } from "@/components/ui/use-toast";
import {
  ACCENT,
  SURFACE,
  NAVY,
  closeBtn,
  dialogOverlay,
  hintText,
  labelText,
  saveBtn,
  selectField,
  sheetForm,
  softPanel,
  subtitleStyle,
  titleStyle,
  ui,
} from "@/lib/orgModalStyles";

export default function OrgTreeSimpleEditor({ node, data, companyId, ar, onClose }) {
  const navigate = useNavigate();
  const employee = (data.employees || []).find((e) => e.id === node.refId);
  const stations = data.stations || [];
  const people = (data.orgTree || []).filter((n) => n.type === "employee" && n.id !== node.id);
  const stationNodes = (data.orgTree || []).filter((n) => n.type === "station");
  const existingPerms = nodeAccess(data, node.refId);
  const existingTemplate = (data.smartPositions || []).find((p) => p.employeeId === node.refId)?.templateId || "";
  const currentTitle = node.title || employee?.profile?.position || employee?.position || "";

  const currentStationId = useMemo(() => {
    let cursor = (data.orgTree || []).find((n) => n.id === node.parentId);
    while (cursor && cursor.type !== "station") {
      cursor = (data.orgTree || []).find((n) => n.id === cursor.parentId);
    }
    return cursor?.refId || employee?.stationId || "";
  }, [data.orgTree, node.parentId, employee?.stationId]);

  const [branchId, setBranchId] = useState(currentStationId || "");
  const [reportsToId, setReportsToId] = useState(() => {
    const parent = (data.orgTree || []).find((n) => n.id === node.parentId);
    return parent?.type === "employee" ? parent.id : "";
  });
  const [extraStationIds, setExtraStationIds] = useState(() => {
    const home = currentStationId || employee?.stationId || "";
    return (employee?.managedStations || []).filter((id) => String(id) !== String(home));
  });
  const [busy, setBusy] = useState(false);

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

      saveOrgNode(
        companyId,
        {
          ...node,
          title: currentTitle,
          parentId: reportsToId || stNode.id,
        },
        existingPerms,
        existingTemplate,
        {
          managedStationIds: [...new Set([branchId, ...extraStationIds])],
        },
      );

      toast({
        description: ar
          ? `حُفظ مكان «${employee.name}»`
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
            <h3 style={titleStyle}>{ar ? "مكان العمل" : "Workplace"}</h3>
            <p style={subtitleStyle}>
              {employee.name}
              {currentTitle ? ` · ${currentTitle}` : ""}
              {ar ? " — الفرع والمسؤول فقط. المنصب والدرجة من تبويب التعيين." : " — branch and manager only. Seat and grade are on Assign."}
            </p>
          </div>
          <button type="button" onClick={onClose} style={closeBtn} aria-label={ar ? "إغلاق" : "Close"}>
            <X style={{ width: 16, height: 16 }} />
          </button>
        </div>

        <label style={{ display: "block" }}>
          <span style={labelText}>{ar ? "الفرع" : "Branch"}</span>
          <select value={branchId} onChange={(e) => setBranchId(e.target.value)} style={selectField}>
            <option value="">{ar ? "اختر الفرع" : "Select branch"}</option>
            {stations.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </label>

        {stations.length > 1 ? (
          <div>
            <span style={labelText}>{ar ? "فروع إضافية — منصب موزّع" : "Extra branches — distributed seat"}</span>
            <div style={{ ...softPanel, display: "flex", flexDirection: "column", gap: 8, marginTop: 6 }}>
              {stations.filter((s) => String(s.id) !== String(branchId)).map((s) => {
                const on = extraStationIds.includes(s.id);
                return (
                  <label key={s.id} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 12, color: NAVY }}>
                    <input
                      type="checkbox"
                      checked={on}
                      onChange={() => {
                        setExtraStationIds((prev) => (
                          on ? prev.filter((id) => id !== s.id) : [...prev, s.id]
                        ));
                      }}
                      style={{ width: 15, height: 15, accentColor: ACCENT }}
                    />
                    {s.name}
                  </label>
                );
              })}
              <span style={hintText}>
                {ar
                  ? "الفرع أعلاه مقرّه. الفروع هنا يغطيها نفس المنصب دون تكرار البطاقة."
                  : "The branch above is home. Extra branches share this seat without duplicating the card."}
              </span>
            </div>
          </div>
        ) : null}

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
