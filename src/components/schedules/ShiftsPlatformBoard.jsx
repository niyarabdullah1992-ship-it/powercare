import React, { Suspense, lazy, useEffect } from "react";
import { CalendarClock, Loader2, Link2 } from "lucide-react";
import useStationScope from "@/hooks/useStationScope";
import { ACCENT, BRAND_DEEP, BRAND_SOFT, MUTED, NAVY, NEUTRAL, cardShell, CARD } from "@/lib/platformStyles";

const ScheduleTab = lazy(() => import("@/components/attendance/ScheduleTab"));

function RotaPerfLinkCard({ ar }) {
  const steps = [
    {
      n: "1",
      title: ar ? "الجدول يحدد المستحق — 65 يومًا حاليًا" : "The roster sets what is owed — currently 65 days",
      body: ar
        ? "مجموع الورديات المنشورة هو طول الفترة. وأثره في الأداء واحد ومحدد: من خدم جزءًا من الفترة تُعدَّل نقاط مهامه إلى معدّل الفترة الكاملة، فلا يُقارَن نصف ربع بربع كامل. أما الحضور نفسه فلا يدخل الدرجة إطلاقًا — يُرصد للأجر والانضباط."
        : "The sum of published shifts is the length of the period. Its effect on the score is single and specific: anyone who served only part of it has their task points pro-rated to a full-period rate. Attendance itself does not enter the score at all — it is recorded for pay and discipline.",
    },
    {
      n: "2",
      title: ar ? "البصمة تُقارن بالوردية لا باليوم" : "Check-in is compared to the shift",
      body: ar
        ? "التأخر يُقاس من بداية وردية الموظف هو، لا من ساعة موحدة. من ورديته ليلية لا يُعد متأخرًا لأنه لم يحضر صباحًا."
        : "Lateness is measured against that employee's own shift start, not a company-wide hour. Someone on nights is never late for not arriving in the morning.",
    },
    {
      n: "3",
      title: ar ? "الإجازة تخرج قبل الإسناد" : "Leave is removed before assignment",
      body: ar
        ? "من له إجازة معتمدة لا يُسند إلى وردية أصلًا، فلا يُسجَّل غيابه ولا يظهر في سجل الانضباط."
        : "Anyone on approved leave is never assigned a shift, so no absence is recorded and nothing enters their disciplinary record.",
    },
    {
      n: "4",
      title: ar ? "النقص يُقاس على الجدول لا على الموظف" : "Gaps are a roster fault, not a personal one",
      body: ar
        ? "الوردية ناقصة التغطية عبء جدولة، ولا تُحتسب غيابًا على أحد. ومن يتطوّع لسدّها تُحتسب له نقاط في بند تغطية الورديات."
        : "An under-covered shift is a scheduling burden and is never recorded as anyone's absence. Whoever volunteers to fill it is rewarded through the shift-coverage term.",
    },
  ];
  const nStyle = {
    width: 22,
    height: 22,
    borderRadius: "50%",
    background: BRAND_SOFT,
    color: BRAND_DEEP,
    fontSize: 11,
    fontWeight: 600,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    fontFamily: "'IBM Plex Sans',sans-serif",
  };

  return (
    <section style={{ ...cardShell, boxShadow: "0 1px 0 #E2E8F0" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
        <span
          style={{
            width: 32,
            height: 32,
            borderRadius: 9,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#ECFDF3",
            color: ACCENT,
            flexShrink: 0,
          }}
        >
          <Link2 style={{ width: 15, height: 15 }} strokeWidth={1.75} />
        </span>
        <div style={{ fontSize: 13, fontWeight: 600, color: NAVY }}>
          {ar ? "ارتباط الجدول بالأداء" : "How the roster reaches Performance"}
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", gap: "0 26px", marginTop: 4 }}>
        {steps.map((l) => (
          <div key={l.n} style={{ display: "flex", gap: 12, padding: "12px 0", borderTop: "1px solid #F1F5F9" }}>
            <span style={nStyle}>{l.n}</span>
            <span style={{ flex: 1, minWidth: 0 }}>
              <span style={{ display: "block", fontSize: 12, fontWeight: 600, color: NAVY }}>{l.title}</span>
              <span style={{ display: "block", fontSize: 11, color: MUTED, lineHeight: 1.7, marginTop: 3 }}>{l.body}</span>
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

export default function ShiftsPlatformBoard({ lang = "ar" }) {
  const ar = lang === "ar";
  const scope = useStationScope();
  const scoped = scope && scope !== "all";

  useEffect(() => {
    // Scope is consumed by ScheduleTab via preferredStationId.
  }, [scope]);

  return (
    <div style={{ maxWidth: 1320, display: "flex", flexDirection: "column", gap: 14, margin: "0 auto" }} dir={ar ? "rtl" : "ltr"}>
      <header
        style={{
          ...cardShell,
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          flexWrap: "wrap",
          padding: "14px 18px",
          boxShadow: "0 1px 0 #E2E8F0",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span
            style={{
              width: 40,
              height: 40,
              borderRadius: 11,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "#ECFDF3",
              color: ACCENT,
              flexShrink: 0,
            }}
          >
            <CalendarClock style={{ width: 20, height: 20 }} strokeWidth={1.75} />
          </span>
          <div>
            <h1 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: NAVY, letterSpacing: "-0.01em" }}>
              {ar ? "الورديات" : "Shifts"}
            </h1>
            <p style={{ margin: "3px 0 0", fontSize: 11, lineHeight: 1.55, color: MUTED }}>
              {ar
                ? "جدول شهري لكل فرع · الفحص النظامي قبل النشر."
                : "Monthly schedule per station · statutory checks before publishing."}
            </p>
          </div>
        </div>
        <span style={NEUTRAL}>
          {ar ? "تغذية الحضور والأداء" : "Feeds attendance & performance"}
        </span>
      </header>

      <section style={{ ...cardShell, padding: 0, overflow: "hidden", boxShadow: "0 1px 0 #E2E8F0" }}>
        <div style={{ padding: "14px 18px", borderBottom: "1px solid #E2E8F0", background: CARD }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: NAVY, letterSpacing: "-0.01em" }}>
            {ar ? "جدول الورديات الشهري" : "Monthly shift schedule"}
          </div>
          <div style={{ fontSize: 12, color: MUTED, marginTop: 5, lineHeight: 1.7, maxWidth: 820 }}>
            {ar
              ? "48 ساعة أسبوعيًا · 11 ساعة بين ورديتين · راحة 24 ساعة · تغطية الخلايا قبل النشر."
              : "48h / week · 11h between shifts · 24h rest · cell coverage before publish."}
          </div>
        </div>

        {!scoped && (
          <div
            style={{
              margin: "14px 18px 0",
              padding: "11px 13px",
              borderRadius: 11,
              background: "#FFFBEB",
              border: "1px solid #FDE68A",
              fontSize: 11,
              color: "#B45309",
              lineHeight: 1.7,
            }}
          >
            {ar
              ? "اختر فرع من نطاق الهيدر لفتح الجدول — الجدول مقيّد بفرع واحد."
              : "Pick a station from the header scope to open the matrix — the schedule is bound to one station."}
          </div>
        )}

        <div style={{ padding: "4px 18px 18px" }}>
          <Suspense
            fallback={
              <div style={{ display: "flex", justifyContent: "center", padding: "40px 0" }}>
                <Loader2 style={{ width: 20, height: 20, color: ACCENT }} className="animate-spin" />
              </div>
            }
          >
            <ScheduleTab preferredStationId={scoped ? scope : null} hidePickerWhenScoped={scoped} />
          </Suspense>
        </div>
      </section>

      <RotaPerfLinkCard ar={ar} />
    </div>
  );
}
