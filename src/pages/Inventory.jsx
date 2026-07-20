import React, { useEffect, useState } from "react";
import { Warehouse } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/PowerCareAuth";
import { useI18n } from "@/lib/i18n";
import { inventoryCall } from "@/lib/inventoryApi";
import PageHeader from "@/components/PageHeader";
import ItemForm from "@/components/inventory/ItemForm";
import ItemList from "@/components/inventory/ItemList";
import ItemDetails from "@/components/inventory/ItemDetails";
import MaterialRequestForm from "@/components/inventory/MaterialRequestForm";
import RequestsList from "@/components/inventory/RequestsList";
import PurchasesTab from "@/components/inventory/PurchasesTab";
import StationInventoryTabs from "@/components/inventory/StationInventoryTabs";
import CentralInventoryDashboard from "@/components/inventory/CentralInventoryDashboard";
import BudgetAlert from "@/components/inventory/BudgetAlert";
import InventoryExportButtons from "@/components/inventory/InventoryExportButtons";
import { toast } from "@/components/ui/use-toast";

const emptyData = { items: [], requestItems: [], movements: [], purchases: [], requests: [], stations: [], locations: [], transferStations: [], employees: [], canCreateItem: false, canDelete: false, canTransfer: false, isCentralView: false, budgetThreshold: 50000 };

export default function Inventory() {
  const { session, currentUser, data } = useAuth();
  const { lang } = useI18n();
  const ar = lang === "ar";
  const [active, setActive] = useState("stock");
  const [state, setState] = useState(emptyData);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);
  const stationVersion = (data?.stations || []).map((station) => station.id).sort().join("|");
  const load = async () => { setLoading(true); try { setState(await inventoryCall(session, "list", { stations: data?.stations || [] })); } finally { setLoading(false); } };
  useEffect(() => { load(); }, [session?.companyId, stationVersion]);
  const run = async (action, payload) => { try { const imageUrls = payload.imageUrls || []; await inventoryCall(session, action, payload); let next = await inventoryCall(session, "list"); if (imageUrls.length && action === "createItem") { const item = next.items.find((entry) => entry.itemCode === payload.itemCode); const purchase = next.movements.find((entry) => entry.movementType === "purchase" && entry.itemId === item?.id); await Promise.all([item && base44.entities.InventoryItem.update(item.id, { imageUrls: [...(item.imageUrls || []), ...imageUrls].slice(-10) }), purchase && base44.entities.StockMovement.update(purchase.id, { imageUrls })].filter(Boolean)); next = await inventoryCall(session, "list"); } setState(next); toast({ description: ar ? "تم حفظ العملية بنجاح." : "Operation saved." }); return true; } catch (error) { toast({ description: error?.response?.data?.error || error.message, variant: "destructive" }); return false; } };
  const stationId = state.locations[0]?.stationId || currentUser?.stationId || "";
  const stationItems = state.items.map((item) => ({ ...item, quantity: Number(item.locationBalances?.find((balance) => balance.locationId === stationId)?.quantity || 0) })).filter((item) => item.quantity > 0);
  const incoming = state.requests.filter((request) => request.sourceStationId === stationId);
  const outgoing = state.requests.filter((request) => request.stationId === stationId);
  const selected = stationItems.find((item) => item.id === selectedItem?.id) || null;
  const review = (requestId, decision) => run("reviewRequest", { requestId, decision });
  const updateImages = async (itemId, imageUrls) => { await base44.entities.InventoryItem.update(itemId, { imageUrls }); await load(); };
  return <div className="space-y-6"><PageHeader title={ar ? "مخزون المحطات" : "Station Inventory"} description={state.isCentralView ? (ar ? "مراقبة المخزون والمشتريات والتحويلات عبر جميع المحطات." : "Monitor inventory, purchases and transfers across every station.") : (ar ? "إدارة مخزون محطتك وطلب التحويل والشراء المباشر." : "Manage your station stock, transfer requests and direct purchases.")} icon={Warehouse} actions={!state.isCentralView && <InventoryExportButtons items={stationItems} stations={state.stations} ar={ar} />} />
    {loading ? <div className="h-40 animate-pulse rounded-xl bg-muted" /> : state.isCentralView ? <><BudgetAlert purchases={state.purchases} threshold={state.budgetThreshold} ar={ar} /><CentralInventoryDashboard state={state} ar={ar} /></> : <><StationInventoryTabs active={active} onChange={setActive} ar={ar} incomingCount={incoming.filter((request) => request.status === "pending").length} />
      {active === "stock" && <ItemList items={stationItems} stations={state.locations} onSelect={setSelectedItem} ar={ar} />}
      {active === "incoming" && <RequestsList requests={incoming} items={state.requestItems} employees={state.employees} stations={state.transferStations} canReview={state.canTransfer} onReview={review} ar={ar} />}
      {active === "outgoing" && <div className="space-y-4"><MaterialRequestForm items={state.requestItems} stations={state.transferStations} stationId={stationId} onSubmit={(payload) => run("request", payload)} ar={ar} /><RequestsList requests={outgoing} items={state.requestItems} employees={state.employees} stations={state.transferStations} canReview={false} ar={ar} /></div>}
      {active === "purchases" && <div className="space-y-4">{state.canCreateItem && <ItemForm stations={state.locations} defaultStationId={stationId} onSubmit={(payload) => run("createItem", payload)} ar={ar} />}<PurchasesTab purchases={state.purchases} items={state.requestItems} stations={state.locations} activeStation={stationId} canViewAll={false} ar={ar} /></div>}</>}
    <ItemDetails item={selected} stations={state.locations} canDelete={state.canDelete} onDelete={async (itemId) => { if (await run("deleteItem", { itemId })) setSelectedItem(null); }} onImagesChange={updateImages} onClose={() => setSelectedItem(null)} ar={ar} />
  </div>;
}