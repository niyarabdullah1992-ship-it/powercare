import React, { useEffect, useState } from "react";
import { Warehouse } from "lucide-react";
import { useAuth } from "@/lib/PowerCareAuth";
import { useI18n } from "@/lib/i18n";
import { inventoryCall } from "@/lib/inventoryApi";
import PageHeader from "@/components/PageHeader";
import InventoryStats from "@/components/inventory/InventoryStats";
import InventoryTabs from "@/components/inventory/InventoryTabs";
import ItemForm from "@/components/inventory/ItemForm";
import ItemList from "@/components/inventory/ItemList";
import ItemDetails from "@/components/inventory/ItemDetails";
import MaterialRequestForm from "@/components/inventory/MaterialRequestForm";
import RequestsList from "@/components/inventory/RequestsList";
import MovementForm from "@/components/inventory/MovementForm";
import MovementList from "@/components/inventory/MovementList";
import IssueScanner from "@/components/inventory/IssueScanner";
import StationWarehousePicker from "@/components/inventory/StationWarehousePicker";
import InventoryWorkflow from "@/components/inventory/InventoryWorkflow";
import InventoryExportButtons from "@/components/inventory/InventoryExportButtons";
import GlobalInventorySearch from "@/components/inventory/GlobalInventorySearch";
import { toast } from "@/components/ui/use-toast";

const emptyData = { items: [], units: [], movements: [], requests: [], stations: [], transferStations: [], employees: [], canManage: false };

export default function Inventory() {
  const { session, currentUser } = useAuth();
  const { lang } = useI18n();
  const ar = lang === "ar";
  const [active, setActive] = useState("overview");
  const [state, setState] = useState(emptyData);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedRequest, setSelectedRequest] = useState("");
  const [selectedStation, setSelectedStation] = useState(currentUser?.stationId || "");

  const load = async () => { setLoading(true); try { setState(await inventoryCall(session, "list")); } finally { setLoading(false); } };
  useEffect(() => { load(); }, [session?.token]);
  useEffect(() => {
    if (!selectedStation && state.stations.length) setSelectedStation(currentUser?.stationId || state.stations[0].stationId);
  }, [state.stations, currentUser?.stationId, selectedStation]);

  const run = async (action, payload) => {
    try { await inventoryCall(session, action, payload); await load(); toast({ description: ar ? "تم حفظ العملية بنجاح." : "Operation saved." }); return true; }
    catch (error) { toast({ description: error?.response?.data?.error || error.message, variant: "destructive" }); return false; }
  };
  const activeStation = currentUser?.role === "employee" ? (currentUser.stationId || selectedStation) : selectedStation;
  const stationUnits = state.units.filter((unit) => unit.locationId === activeStation);
  const stationItems = state.items.filter((item) => item.currentLocationId === activeStation || item.locationBalances?.some((balance) => balance.locationId === activeStation) || stationUnits.some((unit) => unit.itemId === item.id)).map((item) => {
    const inbound = state.movements.find((movement) => movement.itemId === item.id && movement.toLocationId === activeStation && ["receive", "transfer"].includes(movement.movementType));
    return {
      ...item,
      quantity: item.trackingMode === "serialized" ? stationUnits.filter((unit) => unit.itemId === item.id && unit.status === "available").length : Number(item.locationBalances?.find((balance) => balance.locationId === activeStation)?.quantity || 0),
      sourceType: inbound?.movementType === "transfer" ? "transfer" : "purchase",
      sourceLocationId: inbound?.movementType === "transfer" ? inbound.fromLocationId : null,
    };
  });
  const stationMovements = state.movements.filter((movement) => movement.fromLocationId === activeStation || movement.toLocationId === activeStation);
  const stationRequests = state.requests.filter((request) => request.stationId === activeStation);
  const selected = stationItems.find((item) => item.id === selectedItem?.id) || null;
  const changeStation = (stationId) => { setSelectedStation(stationId); setSelectedItem(null); setSelectedRequest(""); };
  const openIssue = (id) => { setSelectedRequest(id); setActive("scanner"); };

  return <div className="space-y-6">
    <PageHeader title={ar ? "المخزن الصناعي" : "Industrial Inventory"} description={ar ? "إدارة الأصناف والحركات وطلبات المواد عبر المحطات." : "Manage items, movements and material requests across stations."} icon={Warehouse} actions={<InventoryExportButtons items={stationItems} stations={state.stations} ar={ar} />} />
    {!loading && <><GlobalInventorySearch items={state.items} units={state.units} stations={state.stations} ar={ar} onOpen={(item, stationId) => { changeStation(stationId); setActive("items"); setSelectedItem(item); }} /><StationWarehousePicker stations={state.stations} value={activeStation} onChange={changeStation} locked={currentUser?.role === "employee"} ar={ar} /></>}
    <InventoryStats items={stationItems} requests={stationRequests} movements={stationMovements} ar={ar} />
    <InventoryTabs active={active} onChange={setActive} canManage={state.canManage} ar={ar} />
    {loading ? <div className="h-40 animate-pulse rounded-xl bg-muted" /> : <>
      {active === "overview" && <div className="space-y-4"><InventoryWorkflow canManage={state.canManage} onNavigate={setActive} ar={ar} /><ItemList items={stationItems.filter((item) => Number(item.quantity) <= Number(item.minimumStock))} stations={state.stations} onSelect={setSelectedItem} ar={ar} /></div>}
      {active === "items" && <div className="space-y-4">{state.canManage && <ItemForm key={activeStation} items={state.items} units={state.units} stations={state.stations} defaultStationId={activeStation} onSubmit={(payload) => run("createItem", payload)} onTransfer={(payload) => run("transfer", payload)} ar={ar} />}<ItemList items={stationItems} stations={state.stations} onSelect={setSelectedItem} ar={ar} /></div>}
      {active === "requests" && <div className="space-y-4"><MaterialRequestForm items={stationItems} stationId={activeStation} onSubmit={(payload) => run("request", payload)} ar={ar} /><RequestsList requests={stationRequests} items={state.items} employees={state.employees} canManage={state.canManage} onReview={(requestId, decision) => run("reviewRequest", { requestId, decision })} onIssue={openIssue} ar={ar} /></div>}
      {active === "movements" && <div className="space-y-4">{state.canManage && <MovementForm key={activeStation} items={stationItems} stations={state.stations} transferStations={state.transferStations} stationId={activeStation} onSubmit={(action, payload) => run(action, payload)} ar={ar} />}<MovementList movements={stationMovements} items={state.items} stations={state.transferStations} ar={ar} /></div>}
      {active === "scanner" && <IssueScanner key={`${activeStation}-${selectedRequest}`} requests={stationRequests} items={state.items} selectedRequest={selectedRequest} onIssue={(requestId, qrCode) => run("issueRequest", { requestId, qrCode })} ar={ar} />}
    </>}
    <ItemDetails item={selected} units={stationUnits} stations={state.stations} onClose={() => setSelectedItem(null)} ar={ar} />
  </div>;
}