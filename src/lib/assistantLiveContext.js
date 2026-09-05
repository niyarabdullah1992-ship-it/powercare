import { inventoryCall } from "@/lib/inventoryApi";
import { expensesCall } from "@/lib/expensesApi";
import { movementNumber } from "@/lib/movementNumber";

export async function enrichAssistantContext(context, { session, data }) {
  const stationName = (id) => data.stations.find((entry) => entry.id === id)?.name || id || "—";
  const [inventory, expenses] = await Promise.allSettled([
    inventoryCall(session, "list", { stations: data.stations || [] }),
    expensesCall(session, "list", { stations: data.stations || [] }),
  ]);
  if (inventory.status === "fulfilled") {
    const state = inventory.value;
    const itemName = (id) => state.historyItems.find((entry) => entry.id === id)?.name || id;
    context.inventory = (state.items || []).map((item) => ({ code: item.itemCode, name: item.name, totalQuantity: item.quantity, minimumStock: item.minimumStock, balances: (item.locationBalances || []).map((balance) => ({ station: stationName(balance.locationId), quantity: balance.quantity })) }));
    context.inventoryMovements = (state.movements || []).slice(0, 100).map((entry) => ({ number: movementNumber(entry), item: itemName(entry.itemId), type: entry.movementType, quantity: entry.quantity, from: stationName(entry.fromLocationId), to: stationName(entry.toLocationId), performedBy: entry.performedBy, date: entry.created_date }));
    context.materialRequests = (state.requests || []).map((entry) => ({ id: entry.id, item: itemName(entry.itemId), quantity: entry.quantity, source: stationName(entry.sourceStationId), destination: stationName(entry.stationId), status: entry.status, reason: entry.notes, value: entry.totalCost }));
    context.inventoryPermissions = Object.fromEntries(Object.entries(state).filter(([key]) => key.startsWith("can") && typeof state[key] === "boolean"));
  } else context.inventoryUnavailable = true;
  if (expenses.status === "fulfilled") {
    const state = expenses.value;
    context.expenses = (state.claims || []).map((claim) => ({ id: claim.id, requester: claim.requesterName, stations: (claim.stationIds || [claim.stationId]).map(stationName), type: claim.customExpenseType || claim.expenseType, amount: claim.totalAmount || claim.amount, date: claim.expenseDate, status: claim.status, description: claim.description }));
    context.expensePermissions = { canManagerReview: state.canManagerReview, canFinanceReview: state.canFinanceReview, canPickStations: state.canPickStations };
  } else context.expensesUnavailable = true;
  return context;
}