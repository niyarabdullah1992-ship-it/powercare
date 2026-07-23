import React from "react";
import { Image } from "@/components/ui/image";
import Logo from "@/components/Logo";
import ProfileBulletGrid from "@/components/profile/ProfileBulletGrid";

export default function ProfilePage({ page }) {
  const special = page.kind === "cover" || page.kind === "closing";
  return <article data-pdf-page className="relative mx-auto flex h-[1123px] w-[794px] shrink-0 flex-col overflow-hidden bg-background text-foreground shadow-elevated">
    <div className="absolute inset-x-0 top-0 h-2 bg-accent" />
    <header className="flex items-center justify-between px-12 pb-5 pt-10"><div className="flex items-center gap-3"><Logo size={38} /><div><p className="font-heading text-lg font-bold">PowerCare</p><p className="text-[8px] tracking-[.24em] text-muted-foreground">ENTERPRISE OPERATIONS</p></div></div><span className="font-mono text-xs text-accent">{page.number} / 25</span></header>
    <Image src={page.image} alt={`${page.titleEn} — ${page.titleAr}`} originWidth={1536} originHeight={864} loading="eager" className={`${special ? "h-[475px]" : "h-[330px]"} w-full`} fittingType="fill" />
    <div className="flex flex-1 flex-col px-12 py-9"><p className="mb-4 font-mono text-[10px] tracking-[.22em] text-accent">{page.eyebrow}</p><div className="grid grid-cols-2 gap-8"><div dir="rtl" className="text-right"><h1 className={`${special ? "text-4xl" : "text-3xl"} font-heading font-bold leading-tight`}>{page.titleAr}</h1><p className="mt-4 text-[14px] leading-7 text-muted-foreground">{page.summaryAr}</p></div><div><h2 className={`${special ? "text-4xl" : "text-3xl"} font-heading font-bold leading-tight`}>{page.titleEn}</h2><p className="mt-4 text-[13px] leading-6 text-muted-foreground">{page.summaryEn}</p></div></div>{page.bulletsAr && <div className="mt-8"><ProfileBulletGrid ar={page.bulletsAr} en={page.bulletsEn} /></div>}<footer className="mt-auto flex items-center justify-between border-t border-accent/25 pt-4 text-[9px] tracking-[.16em] text-muted-foreground"><span>POWERCARE • 2026</span><span>CONNECTED PEOPLE • SITES • DECISIONS</span></footer></div>
  </article>;
}