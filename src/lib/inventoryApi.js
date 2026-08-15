import { isLocalPreviewActive, LOCAL_PREVIEW_COMPANY_ID } from "@/lib/localPreview";
import {
  forceLocalInventory,
  isForcedLocalInventory,
  localInventoryCall,
} from "@/lib/localInventoryFallback";

const pendingLists = new Map();

function emptyList(session) {
  try {
    return localInventoryCall(session, "list", {});
  } catch {
    return {
      items: [],
      requestItems: [],
      historyItems: [],
      movements: [],
      purchases: [],
      procurementRequests: [],
      purchaseOrders: [],
      requests: [],
      stations: [],
      locations: [],
      transferStations: [],
      employees: [],
      canManage: true,
      canPurchase: true,
      canCreateItem: true,
      canIssueToWork: true,
      canIssueFromAnyStation: true,
      canRequest: true,
      canReviewRequests: true,
      canReviewAllRequests: true,
      canDelete: true,
      canApproveProcurement: false,
      canReceiveProcurement: false,
      canViewAllPurchases: true,
      canWarehouseManage: false,
      canTransfer: false,
      canSetCentralWarehouse: false,
      canReverse: true,
      centralWarehouseId: null,
    };
  }
}

export async function inventoryCall(session, action, payload = {}) {
  forceLocalInventory(session?.companyId);
  if (action !== "list") {
    return localInventoryCall(session, action, payload);
  }

  const key = `${session?.companyId || "none"}:local`;
  if (pendingLists.has(key)) return pendingLists.get(key);
  const pending = Promise.resolve().then(() => {
    try {
      return localInventoryCall(session, action, payload);
    } catch {
      return emptyList(session);
    }
  });
  pendingLists.set(key, pending);
  try {
    return await pending;
  } finally {
    if (pendingLists.get(key) === pending) pendingLists.delete(key);
  }
}

export function isInventoryLocal(session) {
  return isLocalPreviewActive()
    || session?.companyId === LOCAL_PREVIEW_COMPANY_ID
    || isForcedLocalInventory(session?.companyId);
}
