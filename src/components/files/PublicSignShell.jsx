import React from "react";
import { HelpCircle, ShieldCheck } from "lucide-react";
import Logo from "@/components/Logo";

export default function PublicSignShell({ ar, children }) {
  return (
    <div className="min-h-screen bg-background text-foreground" dir={ar ? "rtl" : "ltr"}>
      <header className="bg-primary text-primary-foreground">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-5 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-foreground/10 ring-1 ring-primary-foreground/15"><Logo size={34} /></span>
            <div><p className="font-heading text-xl font-semibold">PowerCare</p><p className="flex items-center gap-1.5 text-[11px] text-primary-foreground/65"><ShieldCheck className="h-3.5 w-3.5 text-accent" />{ar ? "توقيع رقمي آمن وموثّق" : "Secure and verified digital signing"}</p></div>
          </div>
          <div className="hidden items-center gap-2 text-xs text-primary-foreground/65 sm:flex"><HelpCircle className="h-4 w-4 text-accent" />{ar ? "هل تحتاج مساعدة؟" : "Need signing help?"}</div>
        </div>
        <div className="mx-auto max-w-7xl px-4 pb-14 pt-8 sm:px-6 lg:px-8 lg:pb-20 lg:pt-12">
          <div className="max-w-2xl"><span className="mb-4 inline-flex rounded-full border border-primary-foreground/15 bg-primary-foreground/5 px-3 py-1 text-[11px] font-medium text-accent">{ar ? "طلب توقيع إلكتروني" : "Electronic signature request"}</span><h1 className="font-heading text-4xl font-semibold leading-tight sm:text-5xl">{ar ? "راجع. وقّع. تم." : "Review. Sign. Done."}</h1><p className="mt-3 max-w-xl text-sm leading-6 text-primary-foreground/65">{ar ? "تجربة توقيع واضحة وآمنة تحفظ سلامة مستندك في كل خطوة." : "A clear, secure signing experience that protects your document at every step."}</p></div>
        </div>
      </header>
      <main className="mx-auto -mt-8 w-full max-w-7xl px-4 pb-10 sm:px-6 lg:-mt-10 lg:px-8">{children}</main>
      <footer className="border-t border-border px-4 py-6"><p className="flex items-center justify-center gap-2 text-xs text-muted-foreground"><ShieldCheck className="h-4 w-4 text-accent" />{ar ? "توقيع إلكتروني موثّق وآمن بواسطة PowerCare" : "Secure, verified electronic signing by PowerCare"}</p></footer>
    </div>
  );
}