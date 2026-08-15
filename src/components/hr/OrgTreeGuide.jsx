import React, { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { MUTED, NAVY, SURFACE } from "@/lib/platformStyles";

export default function OrgTreeGuide({ ar }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ borderBottom: "1px solid #E2E8F0", background: SURFACE, padding: "12px 16px" }}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          border: "none",
          background: "transparent",
          cursor: "pointer",
          fontFamily: "inherit",
          textAlign: "start",
          padding: 0,
        }}
      >
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: NAVY }}>
            {ar ? "من يملأ الملفات؟ وكيف تفعّل الموارد البشرية؟" : "Who fills files? How do you enable HR?"}
          </div>
          <p style={{ margin: "3px 0 0", fontSize: 11, color: MUTED, lineHeight: 1.55 }}>
            {ar
              ? "لا يوجد «قسم» منفصل في الشجرة — الموارد البشرية شخص بصلاحية داخل الفرع."
              : "There is no separate HR department box — HR is a person with access inside a branch."}
          </p>
        </div>
        {open
          ? <ChevronUp style={{ width: 16, height: 16, color: MUTED, flexShrink: 0 }} />
          : <ChevronDown style={{ width: 16, height: 16, color: MUTED, flexShrink: 0 }} />}
      </button>
      {open && (
        <ol style={{ margin: "12px 0 0", paddingInlineStart: 18, display: "grid", gap: 8, color: MUTED, fontSize: 12, lineHeight: 1.65 }}>
          <li>
            {ar
              ? "يملأ الملف: المالك أو المدير دائمًا، أو مسؤول موارد بشرية لنفس الفرع."
              : "Who fills a file: owner/director always, or an HR officer for the same branch."}
          </li>
          <li>
            {ar
              ? "لتفعيل HR: اضغط «تنظيم» ← فعّل «مسؤول موارد بشرية لهذا الفرع» ← حفظ."
              : "To enable HR: Organize → turn on “HR officer for this branch” → Save."}
          </li>
          <li>
            {ar
              ? "المسمى والفرع والمسؤول = مكان العمل. مربع الموارد البشرية = صلاحية الملء."
              : "Title / branch / manager = placement. The HR checkbox = fill access."}
          </li>
        </ol>
      )}
    </div>
  );
}
