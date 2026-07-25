import React from "react";
import { Image } from "@/components/ui/image";
import Logo from "@/components/Logo";

export default function ProjectGuideCover({ program, author, dateAr, dateEn, image }) {
  return <article className="relative flex min-h-[1123px] flex-col overflow-hidden bg-primary text-primary-foreground print:min-h-[277mm]">
    <Image src={image} alt="PowerCare industrial operations" fittingType="fill" focalPointY={0.45} className="absolute inset-0 h-full w-full" />
    <div className="absolute inset-0 bg-primary/65" />
    <div className="relative flex h-full min-h-[1123px] flex-col items-center justify-center px-16 text-center print:min-h-[277mm]">
      <div className="mb-10 flex h-24 w-24 items-center justify-center rounded-full border border-accent/60 bg-primary/80"><Logo size={62} /></div>
      <p className="mb-7 font-mono text-[10px] tracking-[.34em] text-accent">THE COMPLETE PLATFORM GUIDE • 2026</p>
      <h1 className="max-w-2xl font-heading text-6xl font-bold leading-tight text-primary-foreground">{program.nameAr}</h1>
      <p className="mt-5 max-w-xl text-xl leading-9 text-primary-foreground/85">{program.taglineAr}</p>
      <div className="my-10 h-px w-28 bg-accent" />
      <p dir="ltr" className="font-heading text-3xl font-semibold">{program.nameEn}</p>
      <p dir="ltr" className="mt-3 max-w-lg text-sm leading-7 text-primary-foreground/75">{program.taglineEn}</p>
      <div className="absolute inset-x-16 bottom-14 flex items-end justify-between border-t border-accent/40 pt-5 text-[10px] text-primary-foreground/70">
        <div className="text-right"><p className="text-accent">صاحب المشروع — PROJECT OWNER</p><p className="mt-2 text-sm font-semibold text-primary-foreground">{author.nameAr}</p><p dir="ltr">{author.nameEn}</p></div>
        <p className="text-left">تاريخ الإصدار: {dateAr}<br /><span dir="ltr">Issued: {dateEn}</span></p>
      </div>
    </div>
  </article>;
}