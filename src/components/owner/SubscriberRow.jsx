import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, MoreHorizontal, Pencil, Snowflake, Sun, Ban, RotateCcw, XCircle } from "lucide-react";
import EditSubscriptionDialog from "@/components/owner/EditSubscriptionDialog";
import OwnerConfirmActionDialog from "@/components/owner/OwnerConfirmActionDialog";
import SubscriptionInvoice from "@/components/owner/SubscriptionInvoice";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

const styles = { active: "bg-emerald-100 text-emerald-700", trialing: "bg-blue-100 text-blue-700", manual_active: "bg-emerald-100 text-emerald-700", past_due: "bg-red-100 text-red-700", unpaid: "bg-red-100 text-red-700", canceled: "bg-red-100 text-red-700", no_subscription: "bg-gray-100 text-gray-500", frozen: "bg-slate-200 text-slate-700" };
const labels = { active: "نشط", trialing: "تجريبي", manual_active: "نشط يدوي", past_due: "متأخر", unpaid: "غير مدفوع", canceled: "ملغى", no_subscription: "بدون اشتراك", frozen: "مجمّد" };

export default function SubscriberRow({ row, ar, onChanged }) {
  const [busy, setBusy] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const fmt = (value) => value ? new Date(value).toLocaleDateString(ar ? "ar-SA" : "en-GB") : "—";
  const act = async (action, reason = "") => {
    setBusy(true);
    try { await base44.functions.invoke("subscriptionOverview", { action, subscriptionId: row.id, accountId: row.accountId, reason }); await onChanged(); }
    finally { setBusy(false); }
  };
  const status = row.frozen ? "frozen" : row.status;
  const dialog = confirmAction === "freeze" ? { title: ar ? "تجميد اشتراك الشركة" : "Freeze company subscription", description: ar ? "سيتوقف وصول جميع مستخدمي الشركة حتى إعادة التفعيل." : "All company users will lose access until reactivated.", reason: true } : { title: ar ? "إلغاء الاشتراك فورًا" : "Cancel subscription now", description: ar ? "سيتم إلغاء الاشتراك المدفوع فورًا ولا يمكن التراجع تلقائيًا." : "The paid subscription will be canceled immediately.", reason: false };
  return <tr className="border-b border-border/60 last:border-0">
    <td className="px-4 py-3" data-label={ar ? "الشركة" : "Company"}><p className="truncate font-medium">{row.companyName || "—"}</p><p className="truncate text-xs text-muted-foreground" dir="ltr">{row.email}</p></td>
    <td className="px-4 py-3 text-muted-foreground" data-label={ar ? "الباقة" : "Plan"}>{row.plan}{row.customPrice != null ? ` · $${row.customPrice}` : ""}</td>
    <td className="px-4 py-3" data-label={ar ? "الحالة" : "Status"}><span className={`rounded-full px-2 py-1 text-[10px] font-semibold ${styles[status] || styles.no_subscription}`}>{ar ? (labels[status] || status) : status.replaceAll("_", " ")}</span>{row.cancelAtPeriodEnd && <p className="mt-1 text-[10px] text-amber-700">{ar ? "إلغاء بنهاية الدورة" : "Cancels at period end"}</p>}</td>
    <td className="px-4 py-3 text-muted-foreground" data-label={ar ? "البداية" : "Start"}>{fmt(row.startedAt)}</td><td className="px-4 py-3 text-muted-foreground" data-label={ar ? "النهاية" : "End"}>{fmt(row.endsAt)}</td><td className="px-4 py-3 text-muted-foreground" data-label={ar ? "المتبقي" : "Left"}>{row.daysLeft == null ? "—" : `${row.daysLeft} ${ar ? "يوم" : "days"}`}</td>
    <td className="px-4 py-3" data-label={ar ? "الفاتورة" : "Invoice"}><SubscriptionInvoice row={row} ar={ar} /></td>
    <td className="px-4 py-3" data-label={ar ? "إجراءات" : "Actions"}>{busy ? <Loader2 className="h-4 w-4 animate-spin text-landing-gold" /> : <DropdownMenu><DropdownMenuTrigger className="rounded-lg border border-border p-2"><MoreHorizontal className="h-4 w-4" /></DropdownMenuTrigger><DropdownMenuContent align="end" className="w-56" dir={ar ? "rtl" : "ltr"}>{row.accountId && <DropdownMenuItem onSelect={() => setEditOpen(true)}><Pencil />{ar ? "ترقية الشركة يدويًا" : "Upgrade company manually"}</DropdownMenuItem>}{row.accountId && !row.frozen && <DropdownMenuItem onSelect={() => setConfirmAction("freeze")} className="text-slate-700"><Snowflake />{ar ? "تجميد مؤقت" : "Freeze temporarily"}</DropdownMenuItem>}{row.accountId && row.frozen && <DropdownMenuItem onSelect={() => act("unfreeze")}><Sun />{ar ? "إعادة التفعيل" : "Unfreeze"}</DropdownMenuItem>}<DropdownMenuSeparator />{row.id && !row.cancelAtPeriodEnd && row.status !== "canceled" && <DropdownMenuItem onSelect={() => act("cancelAtPeriodEnd")}><Ban />{ar ? "إلغاء بنهاية الدورة" : "Cancel at period end"}</DropdownMenuItem>}{row.id && row.cancelAtPeriodEnd && <DropdownMenuItem onSelect={() => act("reactivate")}><RotateCcw />{ar ? "إلغاء طلب الإلغاء" : "Reactivate subscription"}</DropdownMenuItem>}{row.id && row.status !== "canceled" && <DropdownMenuItem onSelect={() => setConfirmAction("cancelNow")} className="text-destructive"><XCircle />{ar ? "إلغاء فوري" : "Cancel immediately"}</DropdownMenuItem>}</DropdownMenuContent></DropdownMenu>}
    <EditSubscriptionDialog open={editOpen} onOpenChange={setEditOpen} row={row} ar={ar} onSaved={onChanged} /><OwnerConfirmActionDialog open={!!confirmAction} onOpenChange={(open) => !open && setConfirmAction(null)} title={dialog.title} description={dialog.description} ar={ar} requireReason={dialog.reason} destructive onConfirm={(reason) => act(confirmAction, reason)} /></td>
  </tr>;
}