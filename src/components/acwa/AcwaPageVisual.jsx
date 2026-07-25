import React from "react";
import { Image } from "@/components/ui/image";
import ManualDemoShot from "@/components/manual/ManualDemoShot";

export default function AcwaPageVisual({ page }) {
  if (page.screenId) return <div className="mx-12 mt-7 overflow-hidden rounded-xl border border-accent/25 bg-card"><ManualDemoShot chapterId={page.screenId} title={page.titleEn} language="en" /></div>;
  if (page.image) return <div className="mx-12 mt-7 overflow-hidden rounded-xl border border-accent/25"><Image src={page.image} alt={`${page.titleAr} — ${page.titleEn}`} originWidth={1536} originHeight={864} loading="eager" className="h-[255px] w-full" fittingType="fill" /></div>;
  return null;
}