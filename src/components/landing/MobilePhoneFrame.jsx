import React from "react";

/** Simple device chrome for marketing mockups — not a clone of design HTML. */
export default function MobilePhoneFrame({ title, children }) {
  return (
    <div className="mobile-phone-frame mx-auto w-full max-w-[320px]">
      <div className="overflow-hidden rounded-[28px] border border-[#1B2C55] bg-[#0B1A3F] p-[10px] shadow-[0_28px_60px_rgba(11,26,63,0.28)]">
        <div className="mb-2 flex items-center justify-center">
          <span className="h-1.5 w-16 rounded-full bg-[#1B2C55]" aria-hidden />
        </div>
        <div className="overflow-hidden rounded-[20px] bg-[#F7F8FA]">
          <div className="flex items-center justify-between border-b border-[#E4E7EC] bg-white px-3.5 py-2.5">
            <span className="text-[12px] font-semibold text-[#0B1A3F]">{title}</span>
            <span className="font-heading text-[10px] tracking-wide text-[#94A3B8]" dir="ltr">
              NiroVera
            </span>
          </div>
          <div className="min-h-[420px]">{children}</div>
        </div>
      </div>
    </div>
  );
}
