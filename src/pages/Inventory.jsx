import React, { useEffect, useState } from "react";
import { Warehouse } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/PowerCareAuth";
import { useI18n } from "@/lib/i18n";
import { inventoryCall } from "@/lib/inventoryApi";
import PageHeader from "@/components/PageHeader";
import InventoryStats from "@/components/inventory/InventoryStats";
import InventoryDataFiles from "@/components/inventory/InventoryDataFiles";
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
import StationInventoryReportExport from "@/components/inventory/StationInventoryReportExport";
import { toast } from "@/components/ui/use-toast";

const emptyData = { items: [], requestItems: [], historyItems: [], movements: [], purchases: [], requests: [], stations: [], locations: [], transferStations: [], employees: [], procurementRequests: [], purchaseOrders: [], canManage: false, canPurchase: false, canCreateItem: false, canIssueToWork: false, canIssueFromAnyStation: false, canRequest: false, canReviewRequests: false, canReviewAllRequests: false, canDelete: false, canApproveProcurement: false, canReceiveProcurement: false, canViewAllPurchases: false, canWarehouseManage: false, canTransfer: false, canSetCentralWarehouse: false, canReverse: false, centralWarehouseId: null };

export default function Inventory() {
  const { session, currentUser, data } = useAuth();
  const { lang } = useI18n();
  const ar = lang === "ar";
  const [active, setActive] = useState("overview");
  const [state, setState] = useState(emptyData);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedStation, setSelectedStation] = useState("");
  const [selectedInventoryStations, setSelectedInventoryStations] = useState([]);
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
    } catch (error) {
      const code = error?.response?.data?.code;
      const reversalErrors = {
        INSUFFICIENT_REVERSAL_STOCK: ar ? "لا يمكن التراجع لأن الرصيد الحالي لا يكفي؛ ربما تم استهلاك الكمية أو نقلها." : "Cannot reverse because current stock is insufficient; the quantity may have been consumed or moved.",
        REVERSAL_HAS_DEPENDENCIES: ar ? "انتقلت هذه الكمية أو صُرفت لاحقًا. تراجع عن الحركات الأحدث أولًا." : "This quantity was transferred or issued later. Reverse the newer movements first.",
        MOVEMENT_ALREADY_REVERSED: ar ? "تم التراجع عن هذه الحركة مسبقاً." : "This movement has already been reversed.",
        REVERSAL_REASON_REQUIRED: ar ? "سبب التراجع مطلوب." : "A reversal reason is required.",
      };
      toast({ description: reversalErrors[code] || error?.response?.data?.error || error.message, variant: "destructive" }); return false;
    }
  };

  const updateImages = async (itemId, imageUrls) => {
    try { await base44.entities.InventoryItem.update(itemId, { imageUrls }); await load(); toast({ description: ar ? "تم تحديث الصور." : "Images updated." }); }
    catch (error) { toast({ description: error.message, variant: "destructive" }); }
  };

  if (!currentUser) return null;
  const tabFromWorkflow = { purchase: "purchases", items: "items", requests: "requests", consumption: "consumption" };
  const stationIds = state.locations.map((station) => station.stationId || station.id);
  const allStationsSelected = selectedStation === "all" && state.locations.length > 1;
  const activeStation = allStationsSelected ? "all" : stationIds.includes(selectedStation) ? selectedStation : (state.locations[0]?.stationId || state.locations[0]?.id || currentUser.stationId || "");
  const visibleInventoryStations = selectedInventoryStations.length ? selectedInventoryStations : stationIds;
  const stationItems = state.items.flatMap((item) => {
    const balances = (item.locationBalances || []).filter((balance) => visibleInventoryStations.includes(balance.locationId));
    if (balances.length) return balances.map((balance) => ({ ...item, displayKey: `${item.id}-${balance.locationId}`, quantity: Number(balance.quantity) || 0, currentLocationId: balance.locationId }));
    if (!(item.locationBalances || []).length && visibleInventoryStations.includes(item.currentLocationId)) return [{ ...item, displayKey: `${item.id}-${item.currentLocationId}` }];
    return [];
  });

  return <div className="space-y-6">
    <PageHeader title={ar ? "المخزون" : "Inventory"} description={ar ? "إدارة الأصناف والحركات والطلبات والمشتريات حسب صلاحياتك." : "Manage items, movements, requests and purchases based on your role."} icon={Warehouse} actions={<StationInventoryReportExport reportData={state} ar={ar} />} />
    {loading ? <div className="h-40 animate-pulse rounded-xl bg-muted" /> : <>
      <InventoryWorkflow ar={ar} onNavigate={(key) => setActive(tabFromWorkflow[key])} />
      <GlobalInventorySearch items={state.items} stations={state.stations} stationIds={selectedInventoryStations} onStationIdsChange={setSelectedInventoryStations} onOpen={(item, stationId) => setSelectedItem({ ...item, quantity: Number(item.locationBalances?.find((balance) => balance.locationId === stationId)?.quantity || 0), currentLocationId: stationId })} ar={ar} />
      <InventoryTabs active={active} onChange={setActive} ar={ar} />
      {active === "overview" && <div className="space-y-4"><InventoryStats items={stationItems} requests={state.requests} movements={state.movements} ar={ar} /><InventoryDataFiles movements={state.movements} items={state.historyItems} stations={state.transferStations} employees={state.employees} ar={ar} /></div>}
      {active === "purchases" && <div className="space-y-4">
        {state.canPurchase && <ItemForm stations={state.locations} defaultStationId={allStationsSelected ? "" : activeStation} onSubmit={(payload) => run("createItem", payload)} ar={ar} />}
        <PurchasesTab purchases={state.purchases} items={state.historyItems} stations={state.transferStations} activeStation={activeStation} canViewAll={state.canViewAllPurchases} ar={ar} />
      </div>}
      {active === "items" && <ItemList items={stationItems} stations={state.stations} onSelect={setSelectedItem} ar={ar} />}
      {active === "requests" && <div className="space-y-4">
        {state.canRequest && <MaterialRequestForm items={state.requestItems} purchases={state.purchases} stations={state.transferStations} stationId={state.canReviewAllRequests ? "" : activeStation} onSubmit={(payload) => run("request", payload)} ar={ar} />}
        <RequestsList requests={state.requests} items={state.historyItems} employees={state.employees} stations={state.transferStations} canReview={state.canReviewRequests} canReviewAll={state.canReviewAllRequests} reviewerStationId={activeStation} onReview={(requestId, decision) => run("reviewRequest", { requestId, decision })} ar={ar} />
      </div>}
      {active === "consumption" && <WorkIssueTab items={stationItems} historyItems={state.historyItems} movements={state.movements} employees={state.employees} stations={state.locations} historyStations={state.transferStations} stationId={activeStation} canIssue={state.canIssueToWork} canChooseStation={state.canIssueFromAnyStation} onSubmit={(payload) => run("issueToWork", payload)} ar={ar} />}
      {active === "movements" && <MovementList movements={state.movements} items={state.historyItems} employees={state.employees} stations={state.transferStations} canReverse={state.canReverse} onReverse={(movementId, reversalReason) => run("reverseMovement", { movementId, reversalReason })} ar={ar} />}
    </>}
    <ItemDetails item={selectedItem} stations={state.stations} canDelete={state.canDelete} onDelete={async (itemId) => { if (await run("deleteItem", { itemId })) setSelectedItem(null); }} onImagesChange={updateImages} onClose={() => setSelectedItem(null)} ar={ar} />
  </div>;
}