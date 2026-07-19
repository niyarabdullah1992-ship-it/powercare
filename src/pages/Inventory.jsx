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
import MovementForm from "@/components/inventory/MovementForm";
import MovementList from "@/components/inventory/MovementList";
import StationWarehousePicker from "@/components/inventory/StationWarehousePicker";
import InventoryWorkflow from "@/components/inventory/InventoryWorkflow";
import InventoryExportButtons from "@/components/inventory/InventoryExportButtons";
import GlobalInventorySearch from "@/components/inventory/GlobalInventorySearch";
import PurchasesTab from "@/components/inventory/PurchasesTab";
import { toast } from "@/components/ui/use-toast";

const emptyData = { items: [], requestItems: [], movements: [], purchases: [], procurementRequests: [], purchaseOrders: [], requests: [], stations: [], locations: [], transferStations: [], employees: [], canManage: false, canPurchase: false, canDelete: false, canApproveProcurement: false, canReceiveProcurement: false, canViewAllPurchases: false, canWarehouseManage: false, canTransfer: false, centralWarehouseId: null };

export default function Inventory() {
  const { session, currentUser } = useAuth();
  const { lang } = useI18n();
  const ar = lang === "ar";
  const [active, setActive] = useState("overview");
  const [state, setState] = useState(emptyData);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedStation, setSelectedStation] = useState(currentUser?.stationId || "");

  const load = async () => { setLoading(true); try { setState(await inventoryCall(session, "list")); } finally { setLoading(false); } };
  useEffect(() => { load(); }, [session?.token]);
  useEffect(() => {
    if (!selectedStation && state.locations.length) setSelectedStation(currentUser?.stationId || state.locations[0].stationId);
  }, [state.locations, currentUser?.stationId, selectedStation]);

  const run = async (action, payload) => {
    try { await inventoryCall(session, action, payload); await load(); toast({ description: ar ? "تم حفظ العملية بنجاح." : "Operation saved." }); return true; }
    catch (error) { toast({ description: error?.response?.data?.error || error.message, variant: "destructive" }); return false; }
  };
  const activeStation = selectedStation || currentUser?.stationId || "";
  const stationItems = state.items.filter((item) => item.currentLocationId === activeStation || item.locationBalances?.some((balance) => balance.locationId === activeStation)).map((item) => {
    const inbound = state.movements.find((movement) => movement.itemId === item.id && movement.toLocationId === activeStation && ["receive", "transfer"].includes(movement.movementType));
    return {
      ...item,
      quantity: Number(item.locationBalances?.find((balance) => balance.locationId === activeStation)?.quantity || 0),
      sourceType: inbound?.movementType === "transfer" ? "transfer" : "purchase",
      sourceLocationId: inbound?.movementType === "transfer" ? inbound.fromLocationId : null,
    };
  });
  const stationMovements = state.movements.filter((movement) => movement.fromLocationId === activeStation || movement.toLocationId === activeStation);
  const visibleRequests = state.requests.filter((request) => request.stationId === activeStation);
  const selected = stationItems.find((item) => item.id === selectedItem?.id) || null;
  const changeStation = (stationId) => { setSelectedStation(stationId); setSelectedItem(null); };

  return <div className="space-y-6">
    <PageHeader title={ar ? "المخزن الصناعي" : "Industrial Inventory"} description={ar ? "إدارة مشتريات وأرصدة وحركات كل محطة بشكل مستقل." : "Manage each station's purchases, stock and transfers independently."} icon={Warehouse} actions={<InventoryExportButtons items={stationItems} stations={state.stations} ar={ar} />} />
    {!loading && <><GlobalInventorySearch items={state.items} stations={state.locations} ar={ar} onOpen={(item, stationId) => { changeStation(stationId); setActive("items"); setSelectedItem(item); }} /><StationWarehousePicker stations={state.locations} value={activeStation} onChange={changeStation} locked={!state.canViewAllPurchases && !state.canManage} ar={ar} /></>}
    <InventoryStats items={stationItems} requests={visibleRequests} movements={stationMovements} ar={ar} />
    <InventoryTabs active={active} onChange={setActive} canManage={state.canManage} ar={ar} />
    {loading ? <div className="h-40 animate-pulse rounded-xl bg-muted" /> : <>
      {active === "overview" && <div className="space-y-4"><InventoryWorkflow canManage={state.canManage} onNavigate={setActive} ar={ar} /><ItemList items={stationItems.filter((item) => Number(item.quantity) <= Number(item.minimumStock))} stations={state.stations} onSelect={setSelectedItem} ar={ar} /></div>}
      {active === "items" && <div className="space-y-4">{state.canPurchase && <ItemForm key={activeStation} stations={state.locations} defaultStationId={activeStation} onSubmit={(payload) => run("createItem", payload)} ar={ar} />}<ItemList items={stationItems} stations={state.locations} onSelect={setSelectedItem} ar={ar} /></div>}
      {active === "purchases" && <PurchasesTab purchases={state.purchases} items={state.requestItems} stations={state.locations} activeStation={activeStation} canViewAll={state.canViewAllPurchases} ar={ar} />}
      {active === "movements" && <div className="space-y-4">{state.canTransfer && <MovementForm key={activeStation} items={stationItems} stations={state.transferStations} stationId={activeStation} onSubmit={(action, payload) => run(action, payload)} ar={ar} />}<MovementList movements={stationMovements} items={state.requestItems} stations={state.transferStations.length ? state.transferStations : state.locations} employees={state.employees} ar={ar} /></div>}
    </>}
    <ItemDetails item={selected} stations={state.locations} canDelete={state.canDelete} onDelete={async (itemId) => { if (await run("deleteItem", { itemId })) setSelectedItem(null); }} onClose={() => setSelectedItem(null)} ar={ar} />
  </div>;
}