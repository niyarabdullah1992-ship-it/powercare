import React, { useEffect, useState } from "react";
import { Warehouse } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/PowerCareAuth";
import { useI18n } from "@/lib/i18n";
import { inventoryCall } from "@/lib/inventoryApi";
import PageHeader from "@/components/PageHeader";
import InventoryStats from "@/components/inventory/InventoryStats";
import ItemForm from "@/components/inventory/ItemForm";
import MovementForm from "@/components/inventory/MovementForm";
import MaterialRequestForm from "@/components/inventory/MaterialRequestForm";
import ItemList from "@/components/inventory/ItemList";
import ItemDetails from "@/components/inventory/ItemDetails";
import RequestsList from "@/components/inventory/RequestsList";
import MovementList from "@/components/inventory/MovementList";
import PurchasesTab from "@/components/inventory/PurchasesTab";
import ProcurementTab from "@/components/inventory/ProcurementTab";
import WorkIssueTab from "@/components/inventory/WorkIssueTab";
import InventoryTabs from "@/components/inventory/InventoryTabs";
import InventoryWorkflow from "@/components/inventory/InventoryWorkflow";
import CentralWarehouseSelector from "@/components/inventory/CentralWarehouseSelector";
import StationWarehousePicker from "@/components/inventory/StationWarehousePicker";
import InventoryExportButtons from "@/components/inventory/InventoryExportButtons";
import { toast } from "@/components/ui/use-toast";

const emptyData = { items: [], requestItems: [], movements: [], purchases: [], requests: [], stations: [], locations: [], transferStations: [], employees: [], procurementRequests: [], purchaseOrders: [], canManage: false, canPurchase: false, canCreateItem: false, canIssueToWork: false, canDelete: false, canApproveProcurement: false, canReceiveProcurement: false, canViewAllPurchases: false, canWarehouseManage: false, canTransfer: false, canSetCentralWarehouse: false, centralWarehouseId: null };

export default function Inventory() {
  const { session, currentUser, data } = useAuth();
  const { lang } = useI18n();
  const ar = lang === "ar";
  const [active, setActive] = useState("overview");
  const [state, setState] = useState(emptyData);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedStation, setSelectedStation] = useState("");
  const stationVersion = (data?.stations || []).map((station) => station.id).sort().join("|");

  const load = async () => { setLoading(true); try { setState(await inventoryCall(session, "list", { stations: data?.stations || [] })); } finally { setLoading(false); } };
  useEffect(() => { load(); }, [session?.companyId, stationVersion]);

  const run = async (action, payload) => {
    try {
      const imageUrls = payload.imageUrls || [];
      await inventoryCall(session, action, payload);
      let next = await inventoryCall(session, "list");
      if (imageUrls.length && action === "createItem") {
        const item = next.items.find((entry) => entry.itemCode === payload.itemCode);
        const purchase = next.movements.find((entry) => entry.movementType === "purchase" && entry.itemId === item?.id);
        await Promise.all([
          item && base44.entities.InventoryItem.update(item.id, { imageUrls: [...(item.imageUrls || []), ...imageUrls].slice(-10) }),
          purchase && base44.entities.StockMovement.update(purchase.id, { imageUrls }),
        ].filter(Boolean));
        next = await inventoryCall(session, "list");
      }
      setState(next);
      toast({ description: ar ? "تم حفظ العملية بنجاح." : "Operation saved." });
      return true;
    } catch (error) { toast({ description: error?.response?.data?.error || error.message, variant: "destructive" }); return false; }
  };

  const updateImages = async (itemId, imageUrls) => {
    try { await base44.entities.InventoryItem.update(itemId, { imageUrls }); await load(); toast({ description: ar ? "تم تحديث الصور." : "Images updated." }); }
    catch (error) { toast({ description: error.message, variant: "destructive" }); }
  };

  if (!currentUser) return null;
  const issueRequest = (requestId) => run("issueRequest", { requestId });
  const tabFromWorkflow = { purchase: "purchases", transfer: "transfers", issue: "transfers", history: "movements" };
  const stationIds = state.locations.map((station) => station.stationId || station.id);
  const activeStation = stationIds.includes(selectedStation) ? selectedStation : (state.locations[0]?.stationId || state.locations[0]?.id || currentUser.stationId || "");

  return <div className="space-y-6">
    <PageHeader title={ar ? "المخزون" : "Inventory"} description={ar ? "إدارة الأصناف والحركات والطلبات والمشتريات حسب صلاحياتك." : "Manage items, movements, requests and purchases based on your role."} icon={Warehouse} actions={<InventoryExportButtons items={state.items} stations={state.stations} ar={ar} />} />
    {loading ? <div className="h-40 animate-pulse rounded-xl bg-muted" /> : <>
      {state.canSetCentralWarehouse && <CentralWarehouseSelector stations={state.transferStations} value={state.centralWarehouseId} onChange={(stationId) => run("setCentralWarehouse", { stationId })} ar={ar} />}
      <StationWarehousePicker stations={state.locations} value={activeStation} onChange={setSelectedStation} locked={state.locations.length <= 1} ar={ar} />
      <InventoryWorkflow ar={ar} onSelect={(key) => setActive(tabFromWorkflow[key])} />
      <InventoryTabs active={active} onChange={setActive} ar={ar} />
      {active === "overview" && <InventoryStats items={state.items} requests={state.requests} movements={state.movements} ar={ar} />}
      {active === "purchases" && <div className="space-y-4">
        {state.canPurchase && <ItemForm stations={state.locations} defaultStationId={activeStation} onSubmit={(payload) => run("createItem", payload)} ar={ar} />}
        <PurchasesTab purchases={state.purchases} items={state.requestItems} stations={state.transferStations} activeStation={activeStation} canViewAll={state.canViewAllPurchases} ar={ar} />
        {(state.canApproveProcurement || state.canReceiveProcurement) && <ProcurementTab state={state} run={run} ar={ar} />}
      </div>}
      {active === "items" && <ItemList items={state.items} stations={state.stations} onSelect={setSelectedItem} ar={ar} />}
      {active === "transfers" && <div className="space-y-4">
        {state.canTransfer && <MovementForm items={state.items} stations={state.transferStations} defaultFrom={activeStation} onSubmit={(payload) => run("transfer", payload)} ar={ar} />}
        {state.canIssueToWork && <WorkIssueTab items={state.items} stations={state.locations} employees={state.employees} defaultStationId={activeStation} movements={state.movements} onSubmit={(payload) => run("issueToWork", payload)} ar={ar} />}
        {state.canManage && <MaterialRequestForm items={state.requestItems} stations={state.transferStations} stationId={activeStation} onSubmit={(payload) => run("request", payload)} ar={ar} />}
        <RequestsList requests={state.requests} items={state.requestItems} employees={state.employees} stations={state.transferStations} canReview={state.canManage} canIssue={state.canWarehouseManage} onReview={(requestId, decision) => run("reviewRequest", { requestId, decision })} onIssue={issueRequest} ar={ar} />
      </div>}
      {active === "movements" && <MovementList movements={state.movements} items={state.requestItems} employees={state.employees} stations={state.transferStations} ar={ar} />}
    </>}
    <ItemDetails item={selectedItem} stations={state.stations} canDelete={state.canDelete} onDelete={async (itemId) => { if (await run("deleteItem", { itemId })) setSelectedItem(null); }} onImagesChange={updateImages} onClose={() => setSelectedItem(null)} ar={ar} />
  </div>;
}