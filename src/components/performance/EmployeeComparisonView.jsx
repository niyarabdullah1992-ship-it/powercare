import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/lib/PowerCareAuth";
import { base44 } from "@/api/base44Client";
import GroupVsGroupComparison from "@/components/reports/GroupVsGroupComparison";

// Employee-level group-vs-group comparison, available to everyone who can see
// this page (unlike the owner-only full Employee Report table).
export default function EmployeeComparisonView({ t }) {
  const { data, currentUser } = useAuth();
  const [targets, setTargets] = useState([]);

  useEffect(() => {
    if (!currentUser) return;
    (async () => {
      try {
        const res = await base44.functions.invoke("supabaseTargets", {
          action: "listTargets",
          userRole: currentUser.role,
          userId: currentUser.id,
          stationId: currentUser.stationId || null,
          managedStations: currentUser.managedStations || [],
        });
        setTargets(res?.data?.targets || []);
      } catch {
        setTargets([]);
      }
    })();
  }, [currentUser?.id]);

  const rows = useMemo(() => {
    if (!data) return [];
    return data.employees.map((e) => {
      const memberTargets = targets.filter((tg) => tg.assignment_type === "member" && tg.employee_id === e.id);
      const leaves = e.leaveRequests || [];
      return {
        id: e.id,
        points: e.points || 0,
        completed: memberTargets.filter((tg) => tg.status === "completed").length,
        overdue: memberTargets.filter((tg) => tg.status === "overdue").length,
        certificates: (e.certificates || []).length,
        leaveRequests: leaves.length,
        approvedDays: leaves.filter((r) => r.status === "approved").reduce((sum, r) => sum + (r.days || 0), 0),
      };
    });
  }, [data, targets]);

  if (!data) return null;

  const employees = data.employees.map((e) => ({ id: e.id, name: e.name }));

  return <GroupVsGroupComparison rows={rows} employees={employees} t={t} />;
}