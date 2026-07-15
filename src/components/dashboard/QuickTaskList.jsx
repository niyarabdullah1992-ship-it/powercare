import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { addNotification } from "@/lib/store";
import { toast } from "@/components/ui/use-toast";
import { Plus, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";

// The user's top active tasks with a one-tap "+1" progress button.
export default function QuickTaskList({ targets, currentUser, data, company, t, ar }) {
  const [busyId, setBusyId] = useState(null);
  const [extra, setExtra] = useState({}); // optimistic local progress per task

  const canLog = (tg) => {
    if (tg.assignment_type === "member") return tg.employee_id === currentUser.id;
    if (tg.assignment_type === "station_team") return tg.assignment_id === currentUser.stationId;
    if (tg.assignment_type === "hq_team") return !currentUser.stationId;
    return tg.employee_id === currentUser.id;
  };
  const mine = targets.filter((tg) => tg.status === "active" && canLog(tg)).slice(0, 3);
  if (mine.length === 0) return null;

  const logOne = async (tg) => {
    setBusyId(tg.id);
    try {
      await base44.functions.invoke("supabaseTargets", {
        action: "updateProgress",
        targetId: tg.id,
        amount: 1,
        userId: currentUser.id,
        managerId: data.directorId,
        employeeName: currentUser.name,
        proofFiles: [],
      });
      setExtra((p) => ({ ...p, [tg.id]: (p[tg.id] || 0) + 1 }));
      addNotification(company.id, tg.manager_id || data.directorId, `${currentUser.name} → ${tg.title}: +1 ${t("tasksUnit")}.`);
    } catch (err) {
      const code = err?.response?.data?.error;
      toast({ description: code === "PROOF_REQUIRED" ? t("proofRequired") : (code || "Failed"), variant: "destructive" });
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-2">
      <p className="text-[11px] uppercase tracking-widest-xl text-muted-foreground font-body">{ar ? "مهامي النشطة" : "My active tasks"}</p>
      {mine.map((tg) => {
        const done = (tg.completed_tasks || 0) + (extra[tg.id] || 0);
        const total = tg.task_target || 1;
        const pct = Math.min(100, Math.round((done / total) * 100));
        return (
          <div key={tg.id} className="flex items-center gap-3 p-2.5 rounded-lg border border-border bg-background">
            <Link to="/app/tasks" className="flex-1 min-w-0">
              <p className="text-sm font-body font-medium truncate">{tg.title}</p>
              <div className="flex items-center gap-2 mt-1">
                <div className="h-1.5 flex-1 rounded-full bg-muted overflow-hidden">
                  <div className="h-full rounded-full bg-accent" style={{ width: `${pct}%` }} />
                </div>
                <span className="text-[10px] text-muted-foreground font-body shrink-0">{done}/{total}</span>
              </div>
            </Link>
            <button
              onClick={() => logOne(tg)}
              disabled={busyId === tg.id || done >= total}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-foreground text-background text-xs font-body disabled:opacity-40 shrink-0"
            >
              {busyId === tg.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />} 1
            </button>
          </div>
        );
      })}
    </div>
  );
}