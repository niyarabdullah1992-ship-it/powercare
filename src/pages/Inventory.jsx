import React, { useEffect, useMemo, useState } from "react";
import { Boxes, ClipboardList, Package, ShoppingCart, Truck } from "lucide-react";
import { useAuth } from "@/lib/PowerCareAuth";
import { useI18n } from "@/lib/i18n";
import { localInventoryCall } from "@/lib/localInventoryFallback";
import { toast } from "@/components/ui/use-toast";
import PlatformStampShell from "@/components/shared/PlatformStampShell";
import ErpSectionFrame from "@/components/erp/ErpSectionFrame";
import { erpKicker } from "@/lib/erpModuleMeta";
import useStationScope, { matchesStationScope } from "@/hooks/useStationScope";
import { MUTED, NAVY, cardShell, field, labelMuted, tableShell, ui, SURFACE } from "@/lib/platformStyles";

const TABS = [
  ["items", "الأصناف", "Items", Package],
  ["purchases", "المشتريات", "Purchases", ShoppingCart],
  ["requests", "الطلبات", "Requests", ClipboardList],
  ["issue", "الصرف للعمل", "Issue to work", Boxes],
  ["movements", "الحركات", "Movements", Truck],
];

function asList(value) {
  return Array.isArray(value) ? value.filter((row) => row && typeof row === "object") : [];
}

function stationIdOf(station) {
  return station?.stationId || station?.id || "";
}

function emptyBoard(stations = [], employees = []) {
  return {
    items: [],
    movements: [],
    purchases: [],
    requests: [],
    stations,
    locations: stations,
    employees,
    canPurchase: true,
    canRequest: true,
    canIssueToWork: true,
    canReviewRequests: true,
    canReverse: true,
  };
}

function readBoard(session, stations) {
  try {
    const next = localInventoryCall(session, "list", { stations });
    return {
      ...emptyBoard(stations),
      ...next,
      items: asList(next.items),
      movements: asList(next.movements),
      purchases: asList(next.purchases),
      requests: asList(next.requests),
      stations: asList(next.stations || next.locations || stations),
      locations: asList(next.locations || next.stations || stations),
      employees: asList(next.employees),
    };
  } catch (error) {
    console.error("NiroVera inventory board:", error);
    return emptyBoard(stations);
  }
}

export default function Inventory() {
  const { session, currentUser, data } = useAuth();
  const { lang } = useI18n();
  const ar = lang === "ar";
  const scope = useStationScope();
  const scopedToOne = scope !== "all";
  const [tab, setTab] = useState("items");
  const [board, setBoard] = useState(() => emptyBoard());
  const [busy, setBusy] = useState(false);

  const stations = asList(board.locations.length ? board.locations : data?.stations);
  const employees = asList(board.employees.length ? board.employees : data?.employees);
  const tree = data?.stations || [];
  const scopedStations = stations.filter((station) => matchesStationScope(stationIdOf(station), scope, tree));
  const lockedStationId = scopedToOne ? scope : "";

  const reload = () => {
    if (!session?.companyId) return;
    setBoard(readBoard(session, asList(data?.stations)));
  };

  useEffect(() => { reload(); }, [session?.companyId, (data?.stations || []).length]);

  const run = (action, payload) => {
    setBusy(true);
    try {
      localInventoryCall(session, action, payload);
      reload();
      toast({ description: ar ? "تم حفظ العملية." : "Saved." });
      return true;
    } catch (error) {
      toast({
        description: error?.response?.data?.error || error.message || (ar ? "تعذّر الحفظ." : "Could not save."),
        variant: "destructive",
      });
      return false;
    } finally {
      setBusy(false);
    }
  };

  if (!currentUser) return null;

  const items = asList(board.items).filter((item) => matchesStationScope(item.currentLocationId, scope, tree));
  const purchases = asList(board.purchases).filter((row) => matchesStationScope(row.toLocationId, scope, tree));
  const requests = asList(board.requests).filter((row) =>
    matchesStationScope(row.stationId, scope, tree) || matchesStationScope(row.sourceStationId, scope, tree),
  );
  const movements = asList(board.movements).filter((row) =>
    matchesStationScope(row.fromLocationId, scope, tree) || matchesStationScope(row.toLocationId, scope, tree),
  );
  const low = items.filter((item) => Number(item.quantity) <= Number(item.minimumStock || 0)).length;
  const pending = requests.filter((request) => request.status === "pending").length;
  const stationName = (id) => stations.find((station) => stationIdOf(station) === id)?.name || "—";
  const itemName = (id) => asList(board.items).find((item) => item.id === id)?.name || "—";
  const personName = (id) => employees.find((row) => row.id === id || row.employeeId === id)?.name || "—";
  const scopedEmployees = employees.filter((row) => !scopedToOne || matchesStationScope(row.stationId, scope, tree));

  const sections = TABS.map(([key, arLabel, enLabel, icon]) => ({
    value: key,
    label: ar ? arLabel : enLabel,
    icon,
    count: key === "requests" ? pending : key === "items" ? low : 0,
  }));

  const stats = [
    { label: ar ? "الأصناف" : "Items", value: items.length },
    { label: ar ? "تحت الحد" : "Low stock", value: low, danger: low > 0 },
    { label: ar ? "طلبات معلقة" : "Pending", value: pending },
    { label: ar ? "الحركات" : "Movements", value: movements.length },
  ];

  return (
    <PlatformStampShell
      ar={ar}
      kicker={erpKicker("/app/inventory", lang)}
      title={ar ? "المخزون" : "Inventory"}
      hint={ar ? "شراء للصنف · رصيد الفرع · صرف للعمل. الفرع من الشريط العلوي." : "Purchase the item · station balance · issue to work. Station comes from the header."}
      sections={sections}
      tool={tab}
      onTool={setTab}
      maxWidth={1600}
    >
      <ErpSectionFrame path="/app/inventory" ar={ar} stats={stats.map((s) => ({
        label: s.label,
        value: s.value,
        tone: s.danger ? "danger" : null,
      }))}>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {tab === "items" && (
          <>
            <InventoryTable
              headers={ar ? ["الصنف", "الكود", "الكمية", "الفرع", "الحالة"] : ["Item", "Code", "Qty", "Station", "Status"]}
              empty={ar ? "لا أصناف في هذا النطاق. أضف شراءً من تبويب المشتريات." : "No items in this scope. Add a purchase first."}
              rows={items.map((item) => [
                item.name,
                item.itemCode,
                item.quantity,
                stationName(item.currentLocationId),
                Number(item.quantity) <= Number(item.minimumStock || 0) ? (ar ? "منخفض" : "Low") : (ar ? "متوفر" : "In stock"),
              ])}
            />
          </>
        )}

        {tab === "purchases" && (
          <>
            <PurchaseForm
              ar={ar}
              busy={busy}
              stations={scopedToOne ? scopedStations : stations}
              lockedStationId={lockedStationId}
              onSubmit={(payload) => run("createItem", payload)}
            />
            <InventoryTable
              headers={ar ? ["الصنف", "المورد", "الكمية", "الفرع", "التكلفة"] : ["Item", "Supplier", "Qty", "Station", "Cost"]}
              empty={ar ? "لا مشتريات في هذا النطاق." : "No purchases in this scope."}
              rows={purchases.map((row) => [
                itemName(row.itemId),
                row.supplierName || "—",
                row.quantity,
                stationName(row.toLocationId),
                row.totalCost != null ? `${row.totalCost} SAR` : "—",
              ])}
            />
          </>
        )}

        {tab === "requests" && (
          <>
            <RequestForm
              ar={ar}
              busy={busy}
              items={asList(board.items)}
              stations={stations}
              lockedStationId={lockedStationId}
              onSubmit={(payload) => run("request", payload)}
            />
            <InventoryTable
              headers={ar ? ["الصنف", "الكمية", "من", "إلى", "الحالة"] : ["Item", "Qty", "From", "To", "Status"]}
              empty={ar ? "لا طلبات في هذا النطاق." : "No requests in this scope."}
              rows={requests.map((row) => [
                itemName(row.itemId),
                row.quantity,
                stationName(row.sourceStationId),
                stationName(row.stationId),
                row.status,
              ])}
            />
          </>
        )}

        {tab === "issue" && (
          <>
            <IssueForm
              ar={ar}
              busy={busy}
              items={asList(board.items)}
              stations={scopedToOne ? scopedStations : stations}
              employees={scopedEmployees.length ? scopedEmployees : employees}
              lockedStationId={lockedStationId}
              onSubmit={(payload) => run("issueToWork", payload)}
            />
            <InventoryTable
              headers={ar ? ["الصنف", "الكمية", "الفرع", "المستلم", "مرجع العمل"] : ["Item", "Qty", "Station", "Recipient", "Work ref"]}
              empty={ar ? "لا صرف مسجّل في هذا النطاق." : "No issues in this scope."}
              rows={movements.filter((row) => row.movementType === "issue").map((row) => [
                itemName(row.itemId),
                row.quantity,
                stationName(row.fromLocationId),
                personName(row.employeeId),
                row.workReference || "—",
              ])}
            />
          </>
        )}

        {tab === "movements" && (
          <InventoryTable
            headers={ar ? ["الحركة", "النوع", "الصنف", "الكمية", "الفرع"] : ["Movement", "Type", "Item", "Qty", "Station"]}
            empty={ar ? "لا حركات في هذا النطاق." : "No movements in this scope."}
            rows={movements.map((row) => [
              row.movementNumber || row.id,
              row.movementType,
              itemName(row.itemId),
              row.quantity,
              stationName(row.fromLocationId || row.toLocationId),
            ])}
          />
        )}
      </div>
      </ErpSectionFrame>
    </PlatformStampShell>
  );
}

function InventoryTable({ headers, rows, empty }) {
  const cols = `repeat(${headers.length}, minmax(88px, 1fr))`;
  if (!rows.length) {
    return (
      <div style={{ ...tableShell, padding: "18px 16px", textAlign: "center", fontSize: 13, color: MUTED }}>
        {empty}
      </div>
    );
  }
  return (
    <div style={{ ...tableShell, overflowX: "auto" }}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: cols,
          gap: 8,
          padding: "10px 16px",
          background: SURFACE,
          borderBottom: "1px solid #E2E8F0",
          fontSize: 10,
          fontWeight: 600,
          color: MUTED,
        }}
      >
        {headers.map((h) => <span key={h}>{h}</span>)}
      </div>
      {rows.map((colsRow, index) => (
        <div
          key={index}
          style={{
            display: "grid",
            gridTemplateColumns: cols,
            gap: 8,
            minHeight: 44,
            alignItems: "center",
            padding: "0 16px",
            borderBottom: index === rows.length - 1 ? "none" : "1px solid #F1F5F9",
            fontSize: 13,
            color: NAVY,
          }}
        >
          {colsRow.map((col, colIndex) => <span key={colIndex} style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{col ?? "—"}</span>)}
        </div>
      ))}
    </div>
  );
}

function StationField({ ar, stations, value, onChange, lockedStationId, label }) {
  const name = stations.find((station) => stationIdOf(station) === (lockedStationId || value))?.name;
  if (lockedStationId) {
    return (
      <div>
        <label style={labelMuted}>{label || (ar ? "الفرع" : "Station")}</label>
        <div style={{ ...field, display: "flex", alignItems: "center", background: SURFACE, color: MUTED }}>
          {name || lockedStationId}
        </div>
      </div>
    );
  }
  return (
    <div>
      <label style={labelMuted}>{label || (ar ? "الفرع" : "Station")}</label>
      <select value={value} onChange={(event) => onChange(event.target.value)} required style={field}>
        <option value="">{ar ? "اختر الفرع" : "Choose station"}</option>
        {stations.map((station) => (
          <option key={stationIdOf(station)} value={stationIdOf(station)}>{station.name}</option>
        ))}
      </select>
    </div>
  );
}

const formGrid = {
  ...cardShell,
  display: "grid",
  gap: 10,
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  padding: 16,
};

function PurchaseForm({ ar, busy, stations, lockedStationId, onSubmit }) {
  const [locationId, setLocationId] = useState(lockedStationId || stationIdOf(stations[0]));
  const [quantity, setQuantity] = useState("");
  const [unitPrice, setUnitPrice] = useState("");
  const total = quantity !== "" && unitPrice !== "" ? (Number(quantity) * Number(unitPrice)).toFixed(2) : "";
  const effectiveLocation = lockedStationId || locationId;

  useEffect(() => {
    if (lockedStationId) setLocationId(lockedStationId);
    else if (!locationId && stations[0]) setLocationId(stationIdOf(stations[0]));
  }, [stations, locationId, lockedStationId]);

  const submit = (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const saved = onSubmit({
      name: String(form.get("name") || "").trim(),
      itemCode: String(form.get("itemCode") || "").trim(),
      supplierName: String(form.get("supplierName") || "").trim(),
      locationId: effectiveLocation,
      quantity: Number(form.get("quantity")),
      unitPrice: Number(form.get("unitPrice")),
      totalCost: Number(form.get("totalCost")),
      minimumStock: Number(form.get("minimumStock") || 0),
      purchaseDate: String(form.get("purchaseDate") || new Date().toISOString().slice(0, 10)),
    });
    if (saved) {
      event.currentTarget.reset();
      setQuantity("");
      setUnitPrice("");
    }
  };

  return (
    <form onSubmit={submit} className="nv-inv-form" style={formGrid}>
      <div style={{ gridColumn: "1 / -1", fontSize: 13, fontWeight: 600, color: NAVY }}>
        {ar ? "تسجيل شراء" : "Record purchase"}
      </div>
      <div>
        <label style={labelMuted}>{ar ? "اسم الصنف" : "Item name"}</label>
        <input name="name" required placeholder={ar ? "اسم الصنف" : "Item name"} style={field} />
      </div>
      <div>
        <label style={labelMuted}>{ar ? "كود الصنف" : "Item code"}</label>
        <input name="itemCode" required placeholder={ar ? "كود الصنف" : "Item code"} style={field} />
      </div>
      <StationField ar={ar} stations={stations} value={locationId} onChange={setLocationId} lockedStationId={lockedStationId} />
      <div>
        <label style={labelMuted}>{ar ? "الكمية" : "Quantity"}</label>
        <input name="quantity" type="number" min="1" required value={quantity} onChange={(event) => setQuantity(event.target.value)} style={field} />
      </div>
      <div>
        <label style={labelMuted}>{ar ? "الحد الأدنى" : "Minimum"}</label>
        <input name="minimumStock" type="number" min="0" defaultValue="0" style={field} />
      </div>
      <div>
        <label style={labelMuted}>{ar ? "سعر القطعة" : "Unit price"}</label>
        <input name="unitPrice" type="number" min="0" step="0.01" required value={unitPrice} onChange={(event) => setUnitPrice(event.target.value)} style={field} />
      </div>
      <div>
        <label style={labelMuted}>{ar ? "الإجمالي" : "Total"}</label>
        <input name="totalCost" readOnly value={total} style={{ ...field, background: SURFACE, fontWeight: 600 }} />
      </div>
      <div>
        <label style={labelMuted}>{ar ? "المورد" : "Supplier"}</label>
        <input name="supplierName" required placeholder={ar ? "اسم المورد" : "Supplier"} style={field} />
      </div>
      <div>
        <label style={labelMuted}>{ar ? "تاريخ الشراء" : "Purchase date"}</label>
        <input name="purchaseDate" type="date" required defaultValue={new Date().toISOString().slice(0, 10)} style={field} />
      </div>
      <div style={{ gridColumn: "1 / -1", display: "flex", justifyContent: "flex-end" }}>
        <button type="submit" disabled={busy || !effectiveLocation} style={{ ...ui.btnPrimary, height: 36, opacity: busy || !effectiveLocation ? 0.45 : 1 }}>
          {busy ? (ar ? "جارٍ الحفظ..." : "Saving...") : (ar ? "حفظ الشراء" : "Save purchase")}
        </button>
      </div>
    </form>
  );
}

function RequestForm({ ar, busy, items, stations, lockedStationId, onSubmit }) {
  const [sourceStationId, setSourceStationId] = useState(lockedStationId || stationIdOf(stations[0]));
  const [stationId, setStationId] = useState(stationIdOf(stations[1]) || "");
  const available = useMemo(
    () => items.filter((item) => Number((item.locationBalances || []).find((row) => row.locationId === sourceStationId)?.quantity || 0) > 0),
    [items, sourceStationId],
  );

  useEffect(() => {
    if (lockedStationId) setSourceStationId(lockedStationId);
  }, [lockedStationId]);

  const submit = (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    onSubmit({
      itemId: String(form.get("itemId") || ""),
      sourceStationId,
      stationId,
      quantity: Number(form.get("quantity")),
      notes: String(form.get("notes") || "").trim(),
    });
  };

  return (
    <form onSubmit={submit} className="nv-inv-form" style={formGrid}>
      <StationField ar={ar} stations={stations} value={sourceStationId} onChange={setSourceStationId} lockedStationId={lockedStationId} label={ar ? "من فرع" : "From station"} />
      <div>
        <label style={labelMuted}>{ar ? "إلى فرع" : "To station"}</label>
        <select value={stationId} onChange={(event) => setStationId(event.target.value)} style={field}>
          <option value="">{ar ? "إلى فرع" : "To station"}</option>
          {stations.filter((station) => stationIdOf(station) !== sourceStationId).map((station) => (
            <option key={stationIdOf(station)} value={stationIdOf(station)}>{station.name}</option>
          ))}
        </select>
      </div>
      <div>
        <label style={labelMuted}>{ar ? "الصنف" : "Item"}</label>
        <select name="itemId" required style={field}>
          <option value="">{ar ? "الصنف" : "Item"}</option>
          {available.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
        </select>
      </div>
      <div>
        <label style={labelMuted}>{ar ? "الكمية" : "Quantity"}</label>
        <input name="quantity" type="number" min="1" required defaultValue="1" style={field} />
      </div>
      <div style={{ gridColumn: "1 / -1" }}>
        <label style={labelMuted}>{ar ? "سبب الطلب" : "Reason"}</label>
        <input name="notes" required placeholder={ar ? "سبب الطلب" : "Reason"} style={field} />
      </div>
      <div style={{ gridColumn: "1 / -1", display: "flex", justifyContent: "flex-end" }}>
        <button type="submit" disabled={busy} style={{ ...ui.btnPrimary, height: 36 }}>{ar ? "إرسال الطلب" : "Send request"}</button>
      </div>
    </form>
  );
}

function IssueForm({ ar, busy, items, stations, employees, lockedStationId, onSubmit }) {
  const [fromLocationId, setFromLocationId] = useState(lockedStationId || stationIdOf(stations[0]));
  const fromId = lockedStationId || fromLocationId;
  const available = items.filter((item) => Number((item.locationBalances || []).find((row) => row.locationId === fromId)?.quantity || item.quantity || 0) > 0);

  useEffect(() => {
    if (lockedStationId) setFromLocationId(lockedStationId);
  }, [lockedStationId]);

  const submit = (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    onSubmit({
      itemId: String(form.get("itemId") || ""),
      fromLocationId: fromId,
      employeeId: String(form.get("employeeId") || ""),
      quantity: Number(form.get("quantity")),
      workReference: String(form.get("workReference") || "").trim(),
      workDate: String(form.get("workDate") || new Date().toISOString().slice(0, 10)),
      notes: String(form.get("notes") || ""),
    });
  };

  return (
    <form onSubmit={submit} className="nv-inv-form" style={formGrid}>
      <StationField ar={ar} stations={stations} value={fromLocationId} onChange={setFromLocationId} lockedStationId={lockedStationId} />
      <div>
        <label style={labelMuted}>{ar ? "الصنف" : "Item"}</label>
        <select name="itemId" required style={field}>
          <option value="">{ar ? "الصنف" : "Item"}</option>
          {available.map((item) => <option key={item.id} value={item.id}>{item.name} · {item.quantity}</option>)}
        </select>
      </div>
      <div>
        <label style={labelMuted}>{ar ? "المستلم" : "Recipient"}</label>
        <select name="employeeId" required style={field}>
          <option value="">{ar ? "المستلم" : "Recipient"}</option>
          {employees.map((row) => <option key={row.id || row.employeeId} value={row.id || row.employeeId}>{row.name}</option>)}
        </select>
      </div>
      <div>
        <label style={labelMuted}>{ar ? "الكمية" : "Quantity"}</label>
        <input name="quantity" type="number" min="1" required defaultValue="1" style={field} />
      </div>
      <div>
        <label style={labelMuted}>{ar ? "مرجع العمل" : "Work reference"}</label>
        <input name="workReference" required placeholder={ar ? "مرجع العمل" : "Work reference"} style={field} />
      </div>
      <div>
        <label style={labelMuted}>{ar ? "تاريخ العمل" : "Work date"}</label>
        <input name="workDate" type="date" required defaultValue={new Date().toISOString().slice(0, 10)} style={field} />
      </div>
      <div style={{ gridColumn: "1 / -1" }}>
        <label style={labelMuted}>{ar ? "ملاحظة" : "Notes"}</label>
        <input name="notes" placeholder={ar ? "ملاحظة" : "Notes"} style={field} />
      </div>
      <div style={{ gridColumn: "1 / -1", display: "flex", justifyContent: "flex-end" }}>
        <button type="submit" disabled={busy} style={{ ...ui.btnPrimary, height: 36 }}>{ar ? "صرف" : "Issue"}</button>
      </div>
    </form>
  );
}
