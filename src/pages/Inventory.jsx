import React, { useEffect, useState } from "react";
import { Warehouse } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/PowerCareAuth";
import { useI18n } from "@/lib/i18n";
import { inventoryCall } from "@/lib/inventoryApi";
import PageHeader from "@/components/PageHeader";
import InventoryStats from "@/components/inventory/InventoryStats";
import ItemForm from "@/components/inventory/ItemForm";
import MaterialRequestForm from "@/components/inventory/MaterialRequestForm";
import RequestsList from "@/components/inventory/RequestsList";
import ItemList from "@/components/inventory/ItemList";
import ItemDetails from "@/components/inventory/ItemDetails";
import GlobalInventorySearch from "@/components/inventory/GlobalInventorySearch";
import MovementList from "@/components/inventory/MovementList";
import PurchasesTab from "@/components/inventory/PurchasesTab";
import WorkIssueTab from "@/components/inventory/WorkIssueTab";
import InventoryTabs from "@/components/inventory/InventoryTabs";
import InventoryWorkflow from "@/components/inventory/InventoryWorkflow";
import StationWarehousePicker from "@/components/inventory/StationWarehousePicker";
import InventoryExportButtons from "@/components/inventory/InventoryExportButtons";
import { toast } from "@/components/ui/use-toast";

const emptyData = { items: [], requestItems: [], historyItems: [], movements: [], purchases: [], requests: [], stations: [], locations: [], transferStations: [], employees: [], procurementRequests: [], purchaseOrders: [], canManage: false, canPurchase: false, canCreateItem: false, canIssueToWork: false, canRequest: false, canReviewRequests: false, canReviewAllRequests: false, canDelete: false, canApproveProcurement: false, canReceiveProcurement: false, canViewAllPurchases: false, canWarehouseManage: false, canTransfer: false, canSetCentralWarehouse: false, centralWarehouseId: null };

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

  const load = async () => {
    setLoading(true);
    try { setState(await inventoryCall(session, "list", { stations: data?.stations || [] })); }
    catch (error) { toast({ description: error?.response?.data?.error || error.message, variant: "destructive" }); }
    finally { setLoading(false); }
  };
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
  const tabFromWorkflow = { purchase: "purchases", items: "items", requests: "requests", consumption: "consumption" };
  const stationIds = state.locations.map((station) => station.stationId || station.id);
  const activeStation = stationIds.includes(selectedStation) ? selectedStation : (state.locations[0]?.stationId || state.locations[0]?.id || currentUser.stationId || "");
  const stationItems = state.items
    .filter((item) => (item.locationBalances || []).some((balance) => balance.locationId === activeStation) || (!(item.locationBalances || []).length && item.currentLocationId === activeStation))
    .map((item) => ({
      ...item,
      quantity: (item.locationBalances || []).find((balance) => balance.locationId === activeStation)?.quantity ?? item.quantity,
      currentLocationId: activeStation,
    }));

  return <div className="space-y-6">
    <PageHeader title={ar ? "المخزون" : "Inventory"} description={ar ? "إدارة الأصناف والحركات والطلبات والمشتريات حسب صلاحياتك." : "Manage items, movements, requests and purchases based on your role."} icon={Warehouse} actions={<InventoryExportButtons items={state.items} stations={state.stations} ar={ar} />} />
    {loading ? <div className="h-40 animate-pulse rounded-xl bg-muted" /> : <>
      <GlobalInventorySearch items={state.items} stations={state.stations} onOpen={(item, stationId) => setSelectedItem({ ...item, quantity: Number(item.locationBalances?.find((balance) => balance.locationId === stationId)?.quantity || 0), currentLocationId: stationId })} ar={ar} />
      <StationWarehousePicker stations={state.locations} value={activeStation} onChange={setSelectedStation} locked={state.locations.length <= 1} ar={ar} />
      <InventoryWorkflow ar={ar} onNavigate={(key) => setActive(tabFromWorkflow[key])} />
      <InventoryTabs active={active} onChange={setActive} ar={ar} />
      {active === "overview" && <InventoryStats items={stationItems} requests={state.requests} movements={state.movements} ar={ar} />}
      {active === "purchases" && <div className="space-y-4">
        {state.canPurchase && <ItemForm stations={state.locations} defaultStationId={activeStation} onSubmit={(payload) => run("createItem", payload)} ar={ar} />}
        <PurchasesTab purchases={state.purchases} items={state.historyItems} stations={state.transferStations} activeStation={activeStation} canViewAll={state.canViewAllPurchases} ar={ar} />
      </div>}
      {active === "items" && <ItemList items={stationItems} stations={state.stations} onSelect={setSelectedItem} ar={ar} />}
      {active === "requests" && <div className="space-y-4">
        {state.canRequest && <MaterialRequestForm items={state.requestItems} stations={state.transferStations} stationId={state.canManage ? activeStation : ""} onSubmit={(payload) => run("request", payload)} ar={ar} />}
        <RequestsList requests={state.requests} items={state.historyItems} employees={state.employees} stations={state.transferStations} canReview={state.canReviewRequests} canReviewAll={state.canReviewAllRequests} reviewerStationId={activeStation} onReview={(requestId, decision) => run("reviewRequest", { requestId, decision })} ar={ar} />
      </div>}
      {active === "consumption" && <WorkIssueTab items={stationItems} stations={state.locations} employees={state.employees} stationId={activeStation} canIssue={state.canIssueToWork} movements={state.movements} onSubmit={(payload) => run("issueToWork", payload)} ar={ar} />}
      {active === "movements" && <MovementList movements={state.movements} items={state.historyItems} employees={state.employees} stations={state.transferStations} ar={ar} />}
    </>}
    <ItemDetails item={selectedItem} stations={state.stations} canDelete={state.canDelete} onDelete={async (itemId) => { if (await run("deleteItem", { itemId })) setSelectedItem(null); }} onImagesChange={updateImages} onClose={() => setSelectedItem(null)} ar={ar} />
  </div>;
}