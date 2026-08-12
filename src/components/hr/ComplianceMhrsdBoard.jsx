import React, { useCallback, useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/PowerCareAuth";
import { base44 } from "@/api/base44Client";
import { toast } from "@/components/ui/use-toast";

/** MHRSD compliance glance — Nitaqat, expiring docs, GOSI/WPS file-ready (simulated send). */
export default function ComplianceMhrsdBoard() {
  const { lang } = useI18n();
  const ar = lang === "ar";
  const { company } = useAuth();
  const [data, setData] = useState(null);
  const [gosiNo, setGosiNo] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!company?.id) return;
    try {
      const res = await base44.functions.invoke("compliance", { action: "overview", companyId: company.id });
      const payload = res?.data || res;
      setData(payload);
      setGosiNo(payload?.gosiEstablishment || "");
    } catch (e) {
      toast({
        title: ar ? "تعذّر تحميل الامتثال" : "Could not load compliance",
        description: e?.message || String(e),
        variant: "destructive",
      });
    }
  }, [company?.id, ar]);

  useEffect(() => {
    load();
  }, [load]);

  const saveEstablishment = async () => {
    setBusy(true);
    try {
      const res = await base44.functions.invoke("compliance", {
        action: "setGosiEstablishment",
        companyId: company.id,
        gosiEstablishment: gosiNo,
      });
      const payload = res?.data || res;
      if (payload?.error) {
        toast({
          title: ar ? "مرفوض" : "Blocked",
          description: ar ? payload.reason : (payload.reasonEn || payload.reason),
          variant: "destructive",
        });
      } else {
        toast({ title: ar ? "حُفظ رقم المنشأة" : "Establishment saved" });
        await load();
      }
    } finally {
      setBusy(false);
    }
  };

  const runGosi = async (send) => {
    setBusy(true);
    try {
      const res = await base44.functions.invoke("compliance", {
        action: "gosiMonthly",
        companyId: company.id,
        send,
      });
      const payload = res?.data || res;
      if (payload?.error) {
        toast({
          title: ar ? "مرفوض" : "Blocked",
          description: ar ? payload.reason : (payload.reasonEn || payload.reason),
          variant: "destructive",
        });
        return;
      }
      if (send) {
        toast({
          title: ar ? "إرسال محاكى لـ GOSI" : "Simulated GOSI send",
          description: `${payload.report?.grandTotal || 0} SAR`,
        });
      } else if (!payload.gate?.ok) {
        toast({
          title: ar ? "بوابة GOSI" : "GOSI gate",
          description: ar ? payload.gate.reason : (payload.gate.reasonEn || payload.gate.reason),
          variant: "destructive",
        });
      } else {
        toast({
          title: ar ? "ملف GOSI جاهز" : "GOSI file ready",
          description: `${payload.report?.grandTotal || 0} SAR · ${payload.report?.rows?.length || 0} rows`,
        });
      }
    } finally {
      setBusy(false);
    }
  };

  const n = data?.nitaqat;
  const live = data?.liveIntegrations;

  return (
    <div className="space-y-4 rounded-[14px] border border-[#E2E8F0] bg-white p-5" dir={ar ? "rtl" : "ltr"}>
      <div>
        <h3 className="m-0 font-heading text-[15px] font-semibold text-[#14284B]">
          {ar ? "امتثال الوزارة (MHRSD)" : "Ministry compliance (MHRSD)"}
        </h3>
        <p className="mt-1 text-[12px] text-[#5A6B85]">
          {ar
            ? "نِطاقات مشتق · ملف نظامي · GOSI شهري · WPS/مدى جاهز — بلا ربط حيّ حتى الاعتمادات."
            : "Derived Nitaqat · statutory file · monthly GOSI · WPS/Mudad-ready — no live rails until credentials."}
        </p>
      </div>

      {n && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: ar ? "نسبة السعودة" : "Saudization", value: `${n.rate}%` },
            { label: ar ? "النطاق" : "Band", value: n.band },
            { label: ar ? "سعودي" : "Saudi", value: String(n.saudi) },
            { label: ar ? "غير سعودي" : "Non-Saudi", value: String(n.nonSaudi) },
          ].map((s) => (
            <div key={s.label} className="rounded-[12px] border border-[#E2E8F0] px-3 py-3">
              <div className="text-[11px] text-[#5A6B85]">{s.label}</div>
              <div className="mt-1 font-heading text-[22px] font-semibold text-[#14284B]">{s.value}</div>
            </div>
          ))}
        </div>
      )}

      <div className="space-y-2">
        <label className="text-[12px] text-[#5A6B85]">{ar ? "رقم منشأة التأمينات GOSI" : "GOSI establishment number"}</label>
        <div className="flex flex-wrap gap-2">
          <input
            className="min-w-[220px] flex-1 rounded border border-[#E2E8F0] px-3 py-2 text-sm"
            value={gosiNo}
            onChange={(e) => setGosiNo(e.target.value)}
            placeholder="e.g. 500000000"
          />
          <button type="button" disabled={busy} onClick={saveEstablishment} className="rounded bg-[#14284B] px-3 py-2 text-sm text-white">
            {ar ? "حفظ" : "Save"}
          </button>
          <button type="button" disabled={busy} onClick={() => runGosi(false)} className="rounded border border-[#E2E8F0] px-3 py-2 text-sm">
            {ar ? "معاينة GOSI" : "Preview GOSI"}
          </button>
          <button type="button" disabled={busy} onClick={() => runGosi(true)} className="rounded border border-[#E2E8F0] px-3 py-2 text-sm">
            {ar ? "إرسال محاكى" : "Simulate send"}
          </button>
        </div>
      </div>

      <div>
        <h4 className="m-0 text-[13px] font-semibold text-[#14284B]">
          {ar ? "وثائق تنتهي ≤ 60 يومًا" : "Docs expiring ≤ 60 days"}
        </h4>
        {(data?.expiring || []).length === 0 ? (
          <p className="mt-2 text-[12px] text-[#5A6B85]">
            {ar ? "لا تنبيهات انتهاء في النطاق الحالي." : "No expiry alerts in the current scope."}
          </p>
        ) : (
          <ul className="mt-2 space-y-1 text-[12px] text-[#14284B]">
            {data.expiring.slice(0, 12).map((row) => (
              <li key={`${row.employeeId}-${row.kind}`}>
                {row.name || row.employeeId} · {ar ? row.docLabelAr : row.docLabelEn} · {row.expiryDate} · {row.days}d
              </li>
            ))}
          </ul>
        )}
      </div>

      {live && (
        <p className="m-0 rounded-[10px] bg-[#F7F8FA] px-3 py-2 text-[11px] text-[#5A6B85]">
          {ar ? live.noteAr : live.noteEn}
          {" · "}
          Qiwa:{String(live.qiwa)} · GOSI:{String(live.gosi)} · Mudad:{String(live.mudad)} · Nafath:{String(live.nafath)}
        </p>
      )}
    </div>
  );
}
