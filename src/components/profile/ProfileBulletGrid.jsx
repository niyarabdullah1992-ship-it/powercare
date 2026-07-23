import React from "react";
import { Check } from "lucide-react";

export default function ProfileBulletGrid({ ar = [], en = [] }) {
  return <div className="grid grid-cols-2 gap-5">
    <div dir="rtl" className="space-y-3">{ar.map((item) => <div key={item} className="flex items-start gap-2 border-b border-accent/20 pb-2 text-right text-[13px] leading-6"><Check className="mt-1 h-4 w-4 shrink-0 text-accent" />{item}</div>)}</div>
    <div className="space-y-3">{en.map((item) => <div key={item} className="flex items-start gap-2 border-b border-accent/20 pb-2 text-[12px] leading-5"><Check className="mt-1 h-4 w-4 shrink-0 text-accent" />{item}</div>)}</div>
  </div>;
}