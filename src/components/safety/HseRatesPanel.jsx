import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/PowerCareAuth";
import { deriveHseRates } from "@/lib/hseDerivations";

async function scores(payload) {
  const res = await base44.functions.invoke("scores", payload);
  return res?.data ?? res;
}

const TARGETS = {
  trir: 2.5,
  ltifr: 3.5,
  dart: 1.5,
};

function band(value, target) {
  if (value <= target * 0.6) return "good";
  if (value <= target) return "watch";
  return "bad";
}

/**
 * HSE KPI strip — TRIR / LTIFR / DART / days clear / near-miss ratio.
 * Rates from scores.hseSummary (exposure = headcount × 2080).
 */
export default function HseRatesPanel({ lang }) {
  const { company, data } = useAuth();
  const ar = lang === "ar";
  const [rates, setRates] = useState(null);
  const [daysClear, setDaysClear] = useState(null);

  useEffect(() => {
    const headcount = (data?.employees || []).length || 1;
    const local = deriveHseRates(headcount, { lti: 0, restrict: 0, medical: 0, nearMiss: 0 });
    setRates(local);

    // Days since last recorded incident across station safety logs (client fallback).
    const incidents = (data?.safety || []).flatMap((s) => s.incidentLog || []);
    const last = incidents
      .map((i) => (i.at ? new Date(i.at).getTime() : 0))
      .filter(Boolean)
      .sort((a, b) => b - a)[0];
    setDaysClear(last ? Math.max(0, Math.floor((Date.now() - last) / 86400000)) : null);

    if (!company?.id) return;
    scores({ action: "hseSummary", companyId: company.id })
      .then((remote) => {
        if (remote?.rates) setRates(remote.rates);
        if (remote?.daysClear != null) setDaysClear(Number(remote.daysClear));
      })
      .catch(() => {});
  }, [company?.id, data?.employees?.length, data?.safety]);

  if (!rates) return null;

  const cards = [
    {
      key: "TRIR",
      value: rates.trir.toFixed(2),
      target: `≤ ${TARGETS.trir}`,
      sub: ar ? "لكل 200 ألف ساعة" : "per 200k hours",
      band: band(rates.trir, TARGETS.trir),
    },
    {
      key: "LTIFR",
      value: rates.ltifr.toFixed(2),
      target: `≤ ${TARGETS.ltifr}`,
      sub: ar ? "لكل مليون ساعة" : "per 1M hours",
      band: band(rates.ltifr, TARGETS.ltifr),
    },
    {
      key: "DART",
      value: rates.dartRate.toFixed(2),
      target: `≤ ${TARGETS.dart}`,
      sub: ar ? "غياب/تقييد لكل 200 ألف" : "days away/restricted per 200k",
      band: band(rates.dartRate, TARGETS.dart),
    },
    {
      key: ar ? "أيام بلا حادث" : "Days clear",
      value: daysClear != null ? String(daysClear) : "—",
      target: ar ? "مستمر" : "ongoing",
      sub: ar ? "منذ آخر حادث مسجّل" : "since last recorded incident",
      band: "good",
      accent: true,
    },
    {
      key: ar ? "قرب حادث : قابل للتسجيل" : "Near-miss : recordable",
      value: String(rates.nearMissRatio ?? 0),
      target: "≥ 10:1",
      sub: ar ? `${rates.nearMiss || 0} قرب حادث` : `${rates.nearMiss || 0} near misses`,
      band: (rates.nearMissRatio || 0) >= 10 ? "good" : "watch",
    },
  ];

  const tone = {
    good: "border-[#BBF7D0] bg-[#ECFDF3] text-[#15803D]",
    watch: "border-[#FDE68A] bg-[#FFFBEB] text-[#B45309]",
    bad: "border-[#FECACA] bg-[#FEF2F2] text-[#B91C1C]",
  };

  return (
    <section className="space-y-3 rounded-[14px] border border-[#E2E8F0] bg-white p-4" dir={ar ? "rtl" : "ltr"}>
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h3 className="m-0 font-heading text-[15px] font-semibold text-[#14284B]">
            {ar ? "مؤشرات السلامة المعيارية" : "Standard safety indicators"}
          </h3>
          <p className="m-0 mt-1 text-[12px] text-[#5A6B85]">
            {ar
              ? `ساعات التعرّض = ${rates.headcount} × 2080 = ${rates.exposureHours.toLocaleString("en-US")} — لا من ساعات مُعلَنة يدويًا.`
              : `Exposure hours = ${rates.headcount} × 2080 = ${rates.exposureHours.toLocaleString("en-US")} — not manually declared.`}
          </p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        {cards.map((c) => (
          <div key={c.key} className="rounded-[13px] border border-[#E2E8F0] px-3.5 py-3.5">
            <p className="m-0 text-[11px] text-[#5A6B85]">{c.key}</p>
            <p
              className="m-0 mt-2 font-heading text-[26px] font-semibold leading-none"
              style={{ color: c.accent ? "#1E9E63" : "#14284B" }}
            >
              {c.value}
            </p>
            <p className="m-0 mt-2 text-[11px] text-[#5A6B85]">{c.sub}</p>
            <span className={`mt-2 inline-flex rounded-full border px-2 py-0.5 text-[10px] font-medium ${tone[c.band]}`}>
              {ar ? "الهدف" : "Target"} {c.target}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
