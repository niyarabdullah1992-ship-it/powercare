import React from "react";
import { ExternalLink, BadgeCheck } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export const CR_CERTIFICATE_URL = "https://media.base44.com/files/public/6a4f617bd7360a0ae9581d2a/7155ae0ab_.pdf";

const copyByLang = {
  ar: { badge: "سجل تجاري صادر من وزارة التجارة", title: "شهادة السجل التجاري", intro: "مؤسسة نيروفيرا — منشأة مسجلة لدى وزارة التجارة في المملكة العربية السعودية.", name: "اسم المنشأة", nameValue: "مؤسسة نيروفيرا", number: "الرقم الوطني الموحد", issued: "تاريخ الإصدار", entity: "نوع الكيان", entityValue: "مؤسسة", status: "حالة السجل", statusValue: "نشط", view: "عرض الشهادة الأصلية" },
  en: { badge: "Commercial registration issued by the Ministry of Commerce", title: "Commercial Registration Certificate", intro: "NiroVera Est. is a company registered with the Ministry of Commerce in Saudi Arabia.", name: "Entity name", nameValue: "NiroVera Est.", number: "Unified national number", issued: "Issue date", entity: "Entity type", entityValue: "Establishment", status: "Registration status", statusValue: "Active", view: "View original certificate" },
};

export default function CommercialRegistrationBadge({ lang }) {
  const copy = copyByLang[lang] || copyByLang.en;
  const details = [
    [copy.name, copy.nameValue], [copy.number, "7054002733"],
    [copy.issued, "07/04/2026"], [copy.entity, copy.entityValue], [copy.status, copy.statusValue],
  ];
  return <Dialog>
    <DialogTrigger asChild>
      <button type="button" className="mx-auto mt-3 flex max-w-xl items-center gap-3 rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-start text-sm text-white hover:bg-white/10">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent"><BadgeCheck className="h-5 w-5" /></span>
        <span><strong className="block font-semibold">{copy.nameValue}</strong><span className="text-xs text-white/55">{copy.badge}</span></span>
      </button>
    </DialogTrigger>
    <DialogContent dir={lang === "ar" ? "rtl" : "ltr"} className="max-h-[90vh] overflow-y-auto border-landing-gold/30 bg-landing-bg sm:max-w-xl">
      <DialogHeader className="text-start"><DialogTitle className="font-heading text-2xl text-primary">{copy.title}</DialogTitle><DialogDescription>{copy.intro}</DialogDescription></DialogHeader>
      <dl className="divide-y divide-border rounded-xl border bg-card px-4">{details.map(([label, value]) => <div key={label} className="grid gap-1 py-3 sm:grid-cols-[10rem,1fr]"><dt className="text-xs text-muted-foreground">{label}</dt><dd className="text-sm font-medium text-foreground">{value}</dd></div>)}</dl>
      <a href={CR_CERTIFICATE_URL} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center gap-2 rounded-xl bg-landing-gold px-4 py-2.5 text-sm font-semibold text-white hover:bg-landing-gold-deep">{copy.view}<ExternalLink className="h-4 w-4" /></a>
    </DialogContent>
  </Dialog>;
}