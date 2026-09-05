import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { deleteStationWithData, getStationDependencySummary } from "@/lib/stationData";
import { isCompanyRootStation } from "@/lib/stationTree";

export default function useStationDeletion(company, data, stationId) {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadSummary = async () => {
    setLoading(true);
    setError("");
    const local = getStationDependencySummary(data, stationId);
    try {
      const [attendance, targets] = await Promise.all([
        base44.functions.invoke("supabaseAttendance", { action: "stationDataSummary", stationId }),
        base44.functions.invoke("supabaseTargets", { action: "stationDataSummary", stationId }),
      ]);
      setSummary({ ...local, attendance: attendance?.data?.attendance || 0, openTasks: Math.max(local.openTasks, targets?.data?.openTasks || 0) });
    } catch {
      setSummary(local);
    } finally {
      setLoading(false);
    }
  };

  const remove = async (mode, targetStationId) => {
    const station = (data?.stations || []).find((item) => String(item.id) === String(stationId));
    if (isCompanyRootStation(station)) {
      setError("المنشأة فرع رئيسي ثابت ولا تُحذف.");
      return false;
    }
    setLoading(true);
    setError("");
    try {
      await Promise.all([
        base44.functions.invoke("supabaseAttendance", { action: "removeStationData", stationId, mode, targetStationId }),
        base44.functions.invoke("supabaseTargets", { action: "removeStationData", stationId, mode, targetStationId }),
      ]);
      deleteStationWithData(company.id, stationId, { mode, targetStationId });
      return true;
    } catch (err) {
      setError(err?.response?.data?.error || err?.message || "Failed to delete station");
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { summary, loading, error, loadSummary, remove };
}