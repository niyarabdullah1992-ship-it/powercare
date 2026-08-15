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
            {ar ? "من يملأ الملفات؟" : "Who fills files?"}
          </div>
          <p style={{ margin: "3px 0 0", fontSize: 11, color: MUTED, lineHeight: 1.55 }}>
            {ar
              ? "صلاحية الموارد البشرية تُمنح من جدول المناصب، لا من مربع في الشجرة."
              : "HR access is granted from the positions table, not a checkbox on the tree."}
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
              ? "يملأ الملف: المالك أو المدير دائمًا، أو من مُنح الموارد البشرية «تحكم كامل» في منصبه."
              : "Who fills a file: owner/director always, or anyone whose position grants HR full control."}
          </li>
          <li>
            {ar
              ? "لتفعيل ذلك: أنشئ منصباً في قائمته، اضبط صلاحية الموارد البشرية، ثم عيّنه من تبويب التعيين."
              : "To enable it: create a seat on its list, set HR access, then assign it from the Assign tab."}
          </li>
          <li>
            {ar
              ? "المسمى والفرع والمسؤول في الشجرة = مكان العمل. جدول المناصب = الصلاحيات."
              : "Title / branch / manager on the tree = placement. The positions table = access."}
          </li>
        </ol>
      )}
    </div>
  );
}
