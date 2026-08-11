import React, { useEffect, useState } from "react";
import { Loader2, Package, ShoppingCart } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/PowerCareAuth";
import { checkRaisePoGate } from "@/lib/inventoryDerivations";
import { toast } from "@/components/ui/use-toast";

async function stockApi(payload) {
  const res = await base44.functions.invoke("stock", payload);
  return res?.data ?? res;
}

const STATUS_LABEL = {
  critical: { ar: "حرج", en: "Critical", cls: "border-red-200 bg-red-50 text-red-700" },
  low: { ar: "منخفض", en: "Low", cls: "border-amber-200 bg-amber-50 text-amber-900" },
  ok: { ar: "متوفر", en: "In stock", cls: "border-emerald-200 bg-emerald-50 text-emerald-800" },
  on_order: { ar: "قيد التوريد", en: "On order", cls: "border-border bg-muted text-muted-foreground" },
};

export default function StockAlertBoard({ lang = "ar" }) {
  const ar = lang === "ar";
  const { company, data, currentUser } = useAuth();
  const [items, setItems] = useState([]);
  const [alert, setAlert] = useState(null);
  const [poRaised, setPoRaised] = useState(false);
  const [busy, setBusy] = useState(false);

  const stationName = (id) => data?.stations?.find((s) => s.id === id)?.name || id || "—";

  const applyRemote = (remote) => {
    if (Array.isArray(remote?.items)) setItems(remote.items);
    if (remote?.alert) setAlert(remote.alert);
    setPoRaised(!!remote?.poRaised);
  };

  const load = async () => {
    if (!company?.id) return;
    try {
      let remote = await stockApi({ action: "list", companyId: company.id, scope: "all" });
      if (Array.isArray(remote?.items) && remote.items.length === 0) {
        remote = await stockApi({ action: "seedDemo", companyId: company.id });
      }
      applyRemote(remote);
    } catch {
      setItems([]);
    }
  };

  useEffect(() => { load(); }, [company?.id]);

  const run = async (payload, okMsg) => {
    if (!company?.id) return;
    setBusy(true);
    try {
      const remote = await stockApi({ ...payload, companyId: company.id, scope: "all" });
      if (remote?.error) {
        toast({
          description: ar ? (remote.reason || remote.error) : (remote.reasonEn || remote.reason || remote.error),
          variant: "destructive",
        });
      } else {
        if (okMsg) toast({ description: okMsg });
        applyRemote(remote);
      }
    } catch (err) {
      toast({ description: String(err?.message || err), variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  const raisePo = async () => {
    const gate = checkRaisePoGate(items, { alreadyRaised: poRaised });
    if (!gate.ok) {
      toast({ description: ar ? gate.reason : gate.reasonEn, variant: "destructive" });
      return;
    }
    await run(
      { action: "raisePo" },
      ar
        ? `أُنشئ أمر شراء لـ ${gate.skuKeys.length} أصناف · أطول مهلة ${gate.maxLeadDays} يومًا · يُتابَع في التوقيع`
        : `Purchase order raised for ${gate.skuKeys.length} SKUs · longest lead ${gate.maxLeadDays} days · tracked in Signing`,
    );
  };

  if (!currentUser) return null;

  const short = items.filter((i) => i.short || i.status === "on_order");

  const critical = Number(alert?.criticalCount || short.filter((i) => i.status === "critical").length || 0);

  return (
    <section className="space-y-4" dir={ar ? "rtl" : "ltr"}>
      {critical > 0 && !alert?.covered && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-[12px] border border-[#FECACA] bg-[#FEF2F2] px-4 py-3">
          <div className="flex items-start gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-[#B91C1C]">
              <Package className="h-4 w-4" />
            </span>
            <div>
              <h2 className="m-0 text-[14px] font-semibold text-[#991B1B]">
                {ar ? "تنبيه المخزون تحت الحد" : "Below-threshold stock alert"}
              </h2>
              <p className="m-0 mt-1 text-[12px] text-[#B91C1C]/90">
                {ar
                  ? `${critical} أصناف حرجة تحت حد إعادة الطلب · ${alert?.stationsAffected || 0} محطات متأثرة`
                  : `${critical} critical SKUs below reorder · ${alert?.stationsAffected || 0} stations affected`}
              </p>
            </div>
          </div>
          <button
            type="button"
            disabled={busy || poRaised}
            onClick={raisePo}
            className="inline-flex h-9 items-center gap-2 rounded-lg bg-[#B91C1C] px-3.5 text-[12px] font-semibold text-white disabled:opacity-50"
          >
            {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ShoppingCart className="h-3.5 w-3.5" />}
            {ar ? "أنشئ أمر شراء للناقص" : "Raise PO for short SKUs"}
          </button>
        </div>
      )}

      {(alert?.covered || poRaised) && (
        <div className="rounded-[12px] border border-[#BBF7D0] bg-[#ECFDF3] px-4 py-3 text-[13px] text-[#15803D]">
          {ar
            ? `أمر شراء قيد التنفيذ لكل الأصناف الناقصة · يصل خلال أطول مهلة ${alert?.maxLeadDays || "—"} يومًا`
            : `A purchase order covers every short SKU · longest lead ${alert?.maxLeadDays || "—"} days`}
        </div>
      )}

      <div className="overflow-hidden rounded-[14px] border border-[#E2E8F0] bg-white">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] border-collapse text-[12.5px]">
          <thead>
            <tr className="bg-[#F7F8FA] text-[10px] font-semibold tracking-[0.06em] text-[#5A6B85]">
              <th className="border-b border-[#E2E8F0] px-3 py-2.5 text-start">{ar ? "الصنف" : "ITEM"}</th>
              <th className="border-b border-[#E2E8F0] px-3 py-2.5 text-start">SKU</th>
              <th className="border-b border-[#E2E8F0] px-3 py-2.5 text-start">{ar ? "المحطة" : "STATION"}</th>
              <th className="border-b border-[#E2E8F0] px-3 py-2.5 text-start">{ar ? "المتاح" : "ON HAND"}</th>
              <th className="border-b border-[#E2E8F0] px-3 py-2.5 text-start">{ar ? "حد الطلب" : "REORDER"}</th>
              <th className="border-b border-[#E2E8F0] px-3 py-2.5 text-start">{ar ? "المهلة" : "LEAD"}</th>
              <th className="border-b border-[#E2E8F0] px-3 py-2.5 text-start">{ar ? "الحالة" : "STATUS"}</th>
            </tr>
          </thead>
          <tbody>
            {(short.length ? short : items).map((i) => {
              const st = STATUS_LABEL[i.status] || STATUS_LABEL.ok;
              return (
                <tr key={`${i.sku}-${i.stationId}`} className="hover:bg-[#F7F8FA]">
                  <td className="border-b border-[#F1F5F9] px-3 py-2.5 font-medium text-[#14284B]">{i.name}</td>
                  <td className="border-b border-[#F1F5F9] px-3 py-2.5 font-mono text-[#5A6B85]" dir="ltr">{i.sku}</td>
                  <td className="border-b border-[#F1F5F9] px-3 py-2.5 text-[#5A6B85]">{stationName(i.stationId)}</td>
                  <td className="border-b border-[#F1F5F9] px-3 py-2.5 tabular-nums text-[#14284B]" dir="ltr">{i.onHand}</td>
                  <td className="border-b border-[#F1F5F9] px-3 py-2.5 tabular-nums text-[#5A6B85]" dir="ltr">{i.reorder}</td>
                  <td className="border-b border-[#F1F5F9] px-3 py-2.5 tabular-nums text-[#5A6B85]" dir="ltr">{i.leadDays}{ar ? "ي" : "d"}</td>
                  <td className="border-b border-[#F1F5F9] px-3 py-2.5">
                    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${st.cls}`}>
                      <span className="h-1.5 w-8 overflow-hidden rounded-full bg-black/10">
                        <span className="block h-full bg-current" style={{ width: `${i.fillPct || 0}%`, opacity: 0.7 }} />
                      </span>
                      {ar ? st.ar : st.en}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {items.length === 0 && (
        <p className="px-4 py-6 text-sm text-[#5A6B85]">{ar ? "لا أصناف على لوح المخزون بعد." : "No SKUs on the stock board yet."}</p>
      )}
      </div>
    </section>
  );
}
