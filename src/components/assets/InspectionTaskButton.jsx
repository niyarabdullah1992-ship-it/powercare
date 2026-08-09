import React, { useState } from "react";
import { ClipboardCheck, Loader2, Check } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { getCompanyToken } from "@/lib/store";
import { useAuth } from "@/lib/PowerCareAuth";
import { inspectionDue } from "@/lib/assetAlerts";

// Rule: an asset whose inspection is due turns into a real task with a deadline and
// an owner, instead of a silent alert nobody acts on.
export default function InspectionTaskButton({ asset, lang }) {
  const { company, currentUser } = useAuth();
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const ar = lang === "ar";

  if (!inspectionDue(asset) || !asset.holderId) return null;

  const create = async () => {
    setBusy(true);
    try {
      await base44.functions.invoke("supabaseTargets", {
        action: "createTarget",
        companyId: company.id,
        userId: currentUser.id,
        sessionToken: getCompanyToken(company.id),
        userRole: currentUser.role,
        managerId: currentUser.id,
        title: ar ? `فحص أصل: ${asset.name} (${asset.assetCode})` : `Asset inspection: ${asset.name} (${asset.assetCode})`,
        description: ar
          ? `فحص دوري للأصل ${asset.assetCode} لدى ${asset.holderName || "—"}. أرفق صور الحالة بعد الفحص.`
          : `Scheduled inspection for asset ${asset.assetCode} held by ${asset.holderName || "—"}. Attach condition photos.`,
        section: ar ? "الفحص الدوري للأصول" : "Asset inspections",
        taskTarget: 1,
        assignmentType: "member",
        assignmentId: asset.holderId,
        employeeId: asset.holderId,
        stationId: asset.stationId,
        priority: "high",
        effortWeight: 1,
        completionMode: "onsite",
        startDate: new Date().toISOString(),
        endDate: new Date(asset.nextInspectionDate).toISOString(),
      });
      setDone(true);
    } catch (err) {
      alert(err?.response?.data?.error || (ar ? "تعذر إنشاء مهمة الفحص" : "Could not create the inspection task"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      type="button"
      onClick={create}
      disabled={busy || done}
      className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-2 text-sm font-body hover:bg-muted disabled:opacity-60"
    >
      {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : done ? <Check className="w-4 h-4" /> : <ClipboardCheck className="w-4 h-4" />}
      {done ? (ar ? "تم إنشاء مهمة الفحص" : "Inspection task created") : (ar ? "إنشاء مهمة فحص" : "Create inspection task")}
    </button>
  );
}