import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/PowerCareAuth";
import { deriveHseRates } from "@/lib/hseDerivations";

async function scores(payload) {
  const res = await base44.functions.invoke("scores", payload);
  return res?.data ?? res;
}

export default function HseRatesPanel({ lang }) {
  const { company, data } = useAuth();
  const ar = lang === "ar";
  const [rates, setRates] = useState(null);

  useEffect(() => {
    const headcount = (data?.employees || []).length || 1;
    const local = deriveHseRates(headcount, { lti: 0, restrict: 0, medical: 0, nearMiss: 0 });
    setRates(local);
    if (!company?.id) return;
    scores({ action: "hseSummary", companyId: company.id })
      .then((remote) => { if (remote?.rates) setRates(remote.rates); })
      .catch(() => {});
  }, [company?.id, data?.employees?.length]);

  if (!rates) return null;

  const cards = [
    { key: "TRIR", value: rates.trir.toFixed(2), sub: ar ? "لكل 200 ألف ساعة" : "per 200k hours" },
    { key: "LTIFR", value: rates.ltifr.toFixed(2), sub: ar ? "لكل مليون ساعة" : "per 1M hours" },
    { key: "DART", value: rates.dartRate.toFixed(2), sub: ar ? "غياب/تقييد" : "days away/restricted" },
    { key: ar ? "ساعات التعرّض" : "Exposure h", value: rates.exposureHours.toLocaleString("en-US"), sub: ar ? `${rates.headcount} × 2080` : `${rates.headcount} × 2080` },
  ];

  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-2">
      <div>
        <h3 className="font-heading font-semibold text-sm">{ar ? "مؤشرات السلامة المعيارية" : "Standard safety indicators"}</h3>
        <p className="text-xs text-muted-foreground font-body">
          {ar
            ? "محسوبة على ساعات التعرّض = عدد العاملين × 2080 — لا من ساعات مُعلَنة يدويًا."
            : "Computed on exposure hours = headcount × 2080 — not from manually declared hours."}
        </p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {cards.map((c) => (
          <div key={c.key} className="rounded-lg border border-border p-3">
            <p className="text-[10px] text-muted-foreground font-body">{c.key}</p>
            <p className="font-heading text-xl font-semibold">{c.value}</p>
            <p className="text-[10px] text-muted-foreground">{c.sub}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
