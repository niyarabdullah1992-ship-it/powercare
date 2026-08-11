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

  return (
    <section className="space-y-4 rounded-xl border bg-card p-4" dir={ar ? "rtl" : "ltr"}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="rounded-lg bg-accent/15 p-2"><Package className="h-5 w-5 text-accent" /></span>
          <div>
            <h2 className="font-heading text-lg font-semibold">{ar ? "تنبيه المخزون تحت الحد" : "Below-threshold stock alert"}</h2>
            <p className="mt-1 max-w-2xl text-xs text-muted-foreground">
              {alert?.covered
                ? (ar
                  ? `أمر شراء قيد التنفيذ لكل الأصناف الناقصة · يصل خلال أطول مهلة ${alert.maxLeadDays} يومًا`
                  : `A purchase order covers every short SKU · longest lead ${alert.maxLeadDays} days`)
                : (ar
                  ? `${alert?.criticalCount || 0} أصناف حرجة تحت حد إعادة الطلب · ${alert?.stationsAffected || 0} محطات متأثرة`
                  : `${alert?.criticalCount || 0} critical SKUs below reorder · ${alert?.stationsAffected || 0} stations affected`)}
            </p>
          </div>
        </div>
        <button
          type="button"
          disabled={busy || poRaised}
          onClick={raisePo}
          className={`inline-flex h-9 items-center gap-2 rounded-md px-3 text-xs font-semibold disabled:opacity-50 ${
            poRaised
              ? "border border-red-200 bg-white text-red-700"
              : "bg-red-600 text-white"
          }`}
        >
          {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ShoppingCart className="h-3.5 w-3.5" />}
          {poRaised
            ? (ar ? "أمر الشراء أُنشئ" : "Purchase order raised")
            : (ar ? "أنشئ أمر شراء للناقص" : "Raise PO for short SKUs")}
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] border-collapse text-xs">
          <thead>
            <tr className="text-muted-foreground">
              <th className="border-b p-2 text-start">{ar ? "الصنف" : "Item"}</th>
              <th className="border-b p-2 text-start">SKU</th>
              <th className="border-b p-2 text-start">{ar ? "المحطة" : "Station"}</th>
              <th className="border-b p-2 text-start">{ar ? "المتاح" : "On hand"}</th>
              <th className="border-b p-2 text-start">{ar ? "حد الطلب" : "Reorder"}</th>
              <th className="border-b p-2 text-start">{ar ? "المهلة" : "Lead"}</th>
              <th className="border-b p-2 text-start">{ar ? "الحالة" : "Status"}</th>
            </tr>
          </thead>
          <tbody>
            {(short.length ? short : items).map((i) => {
              const st = STATUS_LABEL[i.status] || STATUS_LABEL.ok;
              return (
                <tr key={`${i.sku}-${i.stationId}`}>
                  <td className="border-b p-2 font-medium">{i.name}</td>
                  <td className="border-b p-2 font-mono" dir="ltr">{i.sku}</td>
                  <td className="border-b p-2">{stationName(i.stationId)}</td>
                  <td className="border-b p-2 tabular-nums" dir="ltr">{i.onHand}</td>
                  <td className="border-b p-2 tabular-nums" dir="ltr">{i.reorder}</td>
                  <td className="border-b p-2 tabular-nums" dir="ltr">{i.leadDays}{ar ? "ي" : "d"}</td>
                  <td className="border-b p-2">
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
        <p className="text-sm text-muted-foreground">{ar ? "لا أصناف على لوح المخزون بعد." : "No SKUs on the stock board yet."}</p>
      )}
    </section>
  );
}
