import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, CheckCircle2, Loader2 } from "lucide-react";
import { assetsCall } from "@/lib/assetsApi";

// Rule: no clearance stamp while the employee still holds custody of company assets.
export default function OffboardingAssetsGate({ companyId, employee, ar, onChange }) {
  const [held, setHeld] = useState(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await assetsCall({ companyId }, "list");
        const mine = (res?.assets || []).filter(
          (a) => a.holderId && (a.holderId === employee.id || a.holderId === employee.employeeId) && !["retired"].includes(a.status)
        );
        if (!alive) return;
        setHeld(mine);
        onChange?.(mine.length);
      } catch {
        if (alive) { setHeld([]); onChange?.(0); }
      }
    })();
    return () => { alive = false; };
  }, [companyId, employee.id]);

  if (held === null) {
    return <p className="flex items-center gap-2 text-xs text-muted-foreground"><Loader2 className="h-3.5 w-3.5 animate-spin" />{ar ? "جارٍ فحص العهد..." : "Checking custody..."}</p>;
  }

  if (held.length === 0) {
    return (
      <p className="flex items-center gap-2 rounded-lg border border-green-300 bg-green-50 p-3 text-sm text-green-800">
        <CheckCircle2 className="h-4 w-4" />{ar ? "لا توجد عهد مسجلة باسم الموظف." : "No assets are registered to this employee."}
      </p>
    );
  }

  return (
    <div className="space-y-2 rounded-lg border border-amber-300 bg-amber-50 p-3">
      <p className="flex items-center gap-2 text-sm font-medium text-amber-900">
        <AlertTriangle className="h-4 w-4" />
        {ar ? `لا يمكن ختم إخلاء الطرف: ${held.length} عهدة ما زالت باسم الموظف.` : `Clearance blocked: ${held.length} asset(s) still in this employee's custody.`}
      </p>
      <ul className="space-y-1 text-xs text-amber-900">
        {held.map((a) => <li key={a.id}>• {a.assetCode} — {a.name}</li>)}
      </ul>
      <Link to="/app/assets" className="inline-block text-xs underline">{ar ? "الذهاب إلى الأصول والعهد لتسليمها" : "Go to Assets & custody to hand them over"}</Link>
    </div>
  );
}