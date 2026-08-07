import { useEffect, useMemo, useState } from "react";
import { expensesCall } from "@/lib/expensesApi";
import { inventoryCall } from "@/lib/inventoryApi";

export default function useSmartOperationsAnalytics(session, data) {
  const [remote, setRemote] = useState({ claims: [], items: [], movements: [] });
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!session?.companyId) return;
    let active = true;
    setLoading(true);
    Promise.allSettled([
      expensesCall(session, "list", { stations: data?.stations || [] }),
      inventoryCall(session, "list", { stations: data?.stations || [] }),
    ]).then(([expenses, inventory]) => {
      if (!active) return;
      setRemote({
        claims: expenses.status === "fulfilled" ? expenses.value?.claims || [] : [],
        items: inventory.status === "fulfilled" ? inventory.value?.items || [] : [],
        movements: inventory.status === "fulfilled" ? inventory.value?.movements || [] : [],
      });
      setLoading(false);
    });
    return () => { active = false; };
  }, [session?.companyId, data?.stations?.length]);
  const complaints = useMemo(() => [...(data?.anonymousReports || []), ...(data?.publicReports || [])], [data]);
  return { ...remote, complaints, loading };
}