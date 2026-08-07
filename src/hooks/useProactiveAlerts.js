import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { getCompanyToken } from "@/lib/store";
import { inventoryCall } from "@/lib/inventoryApi";
import { visibleEmployees, visibleStations } from "@/lib/permissions";
import { toRiyadhDateKey } from "@/lib/riyadhDate";

const FIVE_MINUTES = 300000;
const isDone = (task) => ["completed", "done"].includes(task.status);

export default function useProactiveAlerts(data, user, session) {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!data || !user || !session?.companyId) return;
    let active = true;
    const load = async () => {
      const employees = visibleEmployees(user, data);
      const employeeIds = employees.map((employee) => employee.id);
      const token = getCompanyToken(session.companyId);
      const [inventoryResult, attendanceResult] = await Promise.allSettled([
        inventoryCall(session, "list"),
        base44.functions.invoke("supabaseAttendance", { action: "listDaily", companyId: session.companyId, sessionToken: token, employeeIds }),
      ]);
      if (!active) return;
      const inventory = inventoryResult.status === "fulfilled" ? inventoryResult.value : { items: [], requests: [] };
      const attendance = attendanceResult.status === "fulfilled" ? attendanceResult.value?.data?.rows || [] : [];
      const stationIds = new Set(visibleStations(user, data).map((station) => station.id));
      const lowStock = (inventory.items || []).reduce((count, item) => {
        if (item.trackingMode === "serialized") {
          const availableByStation = new Map();
          (inventory.units || []).filter((unit) => unit.itemId === item.id && unit.status === "available").forEach((unit) => availableByStation.set(unit.locationId, (availableByStation.get(unit.locationId) || 0) + 1));
          return count + [...stationIds].filter((stationId) => (availableByStation.get(stationId) || 0) < Number(item.minimumStock)).length;
        }
        return count + (item.locationBalances || []).filter((balance) => stationIds.has(balance.locationId) && Number(balance.quantity) < Number(item.minimumStock)).length;
      }, 0);
      const delayedRequests = (inventory.requests || []).filter((request) => request.status === "approved" && Date.now() - new Date(request.reviewedAt || request.updated_date || request.created_date).getTime() > 172800000).length;
      const absent = attendance.filter((row) => row.status === "absent" && !row.excused).length;
      const scopedTasks = (data.tasks || []).filter((task) => user.role === "employee" ? task.assignedTo === user.id : stationIds.has(task.stationId));
      const overdue = scopedTasks.filter((task) => !isDone(task) && (task.dueDate || task.endDate) && toRiyadhDateKey(task.dueDate || task.endDate) < toRiyadhDateKey()).length;
      const day = toRiyadhDateKey();
      const next = [
        ["stock", lowStock, `⚠️ مخزون ناقص: ${lowStock}`, "/app/inventory"],
        ["requests", delayedRequests, `⚠️ طلبات معتمدة لم تُصرف خلال 48 ساعة: ${delayedRequests}`, "/app/inventory"],
        ["absence", absent, `🔴 غياب غير مبرر: ${absent}`, "/app/attendance"],
        ["tasks", overdue, `⏰ مهمة متأخرة: ${overdue}`, "/app/tasks"],
      ].filter(([, count]) => count > 0).map(([category, count, text, to]) => ({ id: `proactive-${day}-${category}`, type: "proactive", category, count, text, to, userId: user.id, read: false, createdAt: new Date().toISOString() }));
      setAlerts(next); setLoading(false);
      window.dispatchEvent(new CustomEvent("powercare:proactive-alerts", { detail: next }));
    };
    load(); const interval = setInterval(load, FIVE_MINUTES);
    return () => { active = false; clearInterval(interval); };
  }, [data, user?.id, session?.companyId]);
  return { alerts, loading };
}