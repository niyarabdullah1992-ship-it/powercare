import React from "react";
import IdentityCard from "@/components/shared/IdentityCard";
import { ACCENT, BORDER, MUTED, NAVY, SURFACE } from "@/lib/platformStyles";

export default function PublicSignSteps({ ar, current = 2 }) {
  const steps = ar ? ["مراجعة المستند", "تعبئة الحقول والتوقيع", "التحقق والإرسال"] : ["Review document", "Complete fields & sign", "Verify & submit"];
  return (
    <IdentityCard kicker={ar ? "المسار" : "Path"} title={ar ? "خطوات التوقيع" : "Signing steps"} dir={ar ? "rtl" : "ltr"} bodySurface>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 8 }}>
        {steps.map((label, index) => {
          const number = index + 1;
          const reached = number <= current;
          return (
            <div key={label} style={{ textAlign: "center" }}>
              <span style={{
                display: "inline-flex",
                width: 28,
                height: 28,
                alignItems: "center",
                justifyContent: "center",
                borderRadius: "50%",
                fontSize: 12,
                fontWeight: 600,
                background: reached ? ACCENT : SURFACE,
                color: reached ? "#fff" : MUTED,
                border: `1px solid ${reached ? ACCENT : BORDER}`,
              }}
              >
                {number}
              </span>
              <p style={{ margin: "8px 0 0", fontSize: 11, fontWeight: number === current ? 600 : 400, color: number === current ? NAVY : MUTED }}>{label}</p>
            </div>
          );
        })}
      </div>
    </IdentityCard>
  );
}
