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
import { toast } from "@/components/ui/use-toast";

const emptyData = { items: [], units: [], movements: [], requests: [], stations: [], employees: [], canManage: false };
export default function Inventory() {
  const { session } = useAuth(); const { lang } = useI18n(); const ar = lang === "ar";
  const [active, setActive] = useState("overview"); const [state, setState] = useState(emptyData); const [loading, setLoading] = useState(true); const [selectedItem, setSelectedItem] = useState(null); const [selectedRequest, setSelectedRequest] = useState("");
  const load = async () => { setLoading(true); try { setState(await inventoryCall(session, "list")); } finally { setLoading(false); } };
  useEffect(() => { load(); }, [session?.token]);
  const run = async (action, payload) => { try { await inventoryCall(session, action, payload); await load(); toast({ description: ar ? "تم حفظ العملية بنجاح." : "Operation saved." }); return true; } catch (error) { toast({ description: error?.response?.data?.error || error.message, variant: "destructive" }); return false; } };
  const openIssue = (id) => { setSelectedRequest(id); setActive("scanner"); };
  return <div className="space-y-6"><PageHeader title={ar ? "المخزن الصناعي" : "Industrial Inventory"} description={ar ? "إدارة الأصناف والحركات وطلبات المواد عبر المحطات." : "Manage items, movements and material requests across stations."} icon={Warehouse} />
    <InventoryStats items={state.items} requests={state.requests} movements={state.movements} ar={ar} /><InventoryTabs active={active} onChange={setActive} canManage={state.canManage} ar={ar} />
    {loading ? <div className="h-40 animate-pulse rounded-xl bg-muted" /> : <>
      {active === "overview" && <ItemList items={state.items.filter((item) => Number(item.quantity) <= Number(item.minimumStock))} stations={state.stations} onSelect={setSelectedItem} ar={ar} />}
      {active === "items" && <div className="space-y-4">{state.canManage && <ItemForm stations={state.stations} onSubmit={(payload) => run("createItem", payload)} ar={ar} />}<ItemList items={state.items} stations={state.stations} onSelect={setSelectedItem} ar={ar} /></div>}
      {active === "requests" && <div className="space-y-4"><MaterialRequestForm items={state.items} onSubmit={(payload) => run("request", payload)} ar={ar} /><RequestsList requests={state.requests} items={state.items} employees={state.employees} canManage={state.canManage} onReview={(requestId, decision) => run("reviewRequest", { requestId, decision })} onIssue={openIssue} ar={ar} /></div>}
      {active === "movements" && <div className="space-y-4">{state.canManage && <MovementForm items={state.items} stations={state.stations} onSubmit={(action, payload) => run(action, payload)} ar={ar} />}<MovementList movements={state.movements} items={state.items} stations={state.stations} ar={ar} /></div>}
      {active === "scanner" && <IssueScanner key={selectedRequest} requests={state.requests} items={state.items} selectedRequest={selectedRequest} onIssue={(requestId, qrCode) => run("issueRequest", { requestId, qrCode })} ar={ar} />}
    </>}
    <ItemDetails item={selectedItem} units={state.units} stations={state.stations} onClose={() => setSelectedItem(null)} ar={ar} />
  </div>;
}