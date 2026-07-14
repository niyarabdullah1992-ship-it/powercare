import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, Pencil, Ban, RotateCcw, XCircle, AlertTriangle } from "lucide-react";
import EditSubscriptionDialog from "@/components/owner/EditSubscriptionDialog";

const STATUS_STYLES = {
  active: "bg-emerald-100 text-emerald-700",
  trialing: "bg-blue-100 text-blue-700",
  past_due: "bg-red-100 text-red-700",
  unpaid: "bg-red-100 text-red-700",
  canceled: "bg-gray-200 text-gray-600",
  incomplete: "bg-amber-100 text-amber-700",
  no_subscription: "bg-gray-100 text-gray-500",
  manual_active: "bg-emerald-100 text-emerald-700",
};

const STATUS_EN = {
  manual_active: "active (manual)",
};

const STATUS_AR = {
  active: "نشط",
  trialing: "تجريبي",
  past_due: "متأخر الدفع",
  unpaid: "غير مدفوع",
  canceled: "ملغى",
  incomplete: "غير مكتمل",
  no_subscription: "بدون اشتراك",
  manual_active: "نشط (يدوي)",
};

export default function SubscriberRow({ row, ar, onChanged }) {
  const [busy, setBusy] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  const fmt = (ts) => (ts ? new Date(ts).toLocaleDateString(ar ? "ar" : "en", { year: "numeric", month: "short", day: "numeric" }) : "—");

  const act = async (action) => {
    if (busy) return;
    setBusy(true);
    try {
      await base44.functions.invoke("subscriptionOverview", { action, subscriptionId: row.id });
      await onChanged();
    } finally {
      setBusy(false);
    }
  };

  const isStripe = !!row.id;
  const expiringSoon = row.daysLeft != null && row.daysLeft >= 0 && row.daysLeft <= 14;

  return (
    <tr className="border-b border-[#3a2f22]/5 last:border-0">
      <td className="px-4 py-3" data-label={ar ? "الشركة" : "Company"}>
        <div className="min-w-0">
          <p className="font-medium text-[#3a2f22] truncate">{row.companyName || "—"}</p>
          <p className="text-xs text-[#3a2f22]/40 truncate" dir="ltr">{row.email}</p>
        </div>
      </td>
      <td className="px-4 py-3 text-[#3a2f22]/70" data-label={ar ? "الباقة" : "Plan"}>
        {row.plan === "Custom" ? (ar ? "مخصص" : "Custom") : row.plan}
        {row.billing ? ` · ${ar ? (row.billing === "yearly" ? "سنوي" : "شهري") : row.billing}` : ""}
        {row.plan === "Custom" && row.customPrice != null ? ` · $${row.customPrice}/${ar ? "شهر" : "mo"}` : ""}
      </td>
      <td className="px-4 py-3" data-label={ar ? "الحالة" : "Status"}>
        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold ${STATUS_STYLES[row.status] || "bg-gray-100 text-gray-600"}`}>
          {ar ? (STATUS_AR[row.status] || row.status) : (STATUS_EN[row.status] || row.status)}
        </span>
        {row.cancelAtPeriodEnd && (
          <span className="block text-[10px] text-red-500 mt-0.5">{ar ? "يُلغى عند نهاية الفترة" : "cancels at period end"}</span>
        )}
      </td>
      <td className="px-4 py-3 text-[#3a2f22]/70" data-label={ar ? "بداية الاشتراك" : "Start"}>{fmt(row.startedAt)}</td>
      <td className="px-4 py-3 text-[#3a2f22]/70" data-label={ar ? "نهاية الاشتراك" : "End"}>{fmt(row.endsAt)}</td>
      <td className="px-4 py-3" data-label={ar ? "المتبقي" : "Left"}>
        {row.daysLeft != null ? (
          <span className={expiringSoon ? "text-red-600 font-semibold inline-flex items-center gap-1" : "text-[#3a2f22]/70"}>
            {expiringSoon && <AlertTriangle className="w-3 h-3" />}
            {ar ? `${row.daysLeft} يوم` : `${row.daysLeft} days`}
          </span>
        ) : "—"}
      </td>
      <td className="px-4 py-3" data-label={ar ? "إجراءات" : "Actions"}>
        <div className="flex items-center gap-1">
          {busy ? (
            <Loader2 className="w-4 h-4 animate-spin text-landing-gold" />
          ) : (
            <>
              {row.accountId && (
                <button onClick={() => setEditOpen(true)} title={ar ? "تعديل الباقة والتواريخ" : "Edit plan & dates"} className="p-1.5 text-landing-gold hover:bg-landing-bg rounded-md">
                  <Pencil className="w-4 h-4" />
                </button>
              )}
              {isStripe && !row.cancelAtPeriodEnd && row.status !== "canceled" && (
                <button onClick={() => act("cancelAtPeriodEnd")} title={ar ? "إلغاء عند نهاية الفترة" : "Cancel at period end"} className="p-1.5 text-amber-600 hover:bg-landing-bg rounded-md">
                  <Ban className="w-4 h-4" />
                </button>
              )}
              {isStripe && row.cancelAtPeriodEnd && (
                <button onClick={() => act("reactivate")} title={ar ? "إعادة تفعيل" : "Reactivate"} className="p-1.5 text-emerald-600 hover:bg-landing-bg rounded-md">
                  <RotateCcw className="w-4 h-4" />
                </button>
              )}
              {isStripe && row.status !== "canceled" && (
                <button
                  onClick={() => { if (confirm(ar ? "إلغاء الاشتراك فورًا؟" : "Cancel subscription immediately?")) act("cancelNow"); }}
                  title={ar ? "إلغاء فوري" : "Cancel now"}
                  className="p-1.5 text-red-500 hover:bg-landing-bg rounded-md"
                >
                  <XCircle className="w-4 h-4" />
                </button>
              )}
            </>
          )}
        </div>
        <EditSubscriptionDialog open={editOpen} onOpenChange={setEditOpen} row={row} ar={ar} onSaved={onChanged} />
      </td>
    </tr>
  );
}