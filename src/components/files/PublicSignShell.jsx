import React from "react";
import { HelpCircle, PenLine, ShieldCheck } from "lucide-react";
import Logo from "@/components/Logo";

export default function PublicSignShell({ ar, children }) {
  return (
    <div className="min-h-screen bg-sign-bg text-sign-ink" dir={ar ? "rtl" : "ltr"}>
      <div className="border-b border-border bg-sign-bg px-4 py-2">
        <div className="mx-auto flex max-w-6xl items-center gap-2 text-[11px] text-muted-foreground">
          <HelpCircle className="h-3.5 w-3.5 text-sign-gold" />
          <span>{ar ? "تحتاج مساعدة في توقيع هذا المستند؟" : "Need help signing this document?"}</span>
        </div>
      </div>
      <main className="mx-auto w-full max-w-6xl px-4 py-7 sm:px-6 lg:py-10">
        <header className="mb-6 flex items-center justify-between gap-4">
          <div>
            <h1 className="flex items-center gap-2 font-heading text-3xl font-semibold">
              <PenLine className="h-7 w-7 text-sign-gold" />{ar ? "التوقيع الرقمي" : "Digital signing"}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">{ar ? "راجع المستند، أضف توقيعك، واحفظ نسخة موثّقة." : "Review the document, add your signature, and create a verified copy."}</p>
          </div>
          <div className="hidden items-center gap-3 sm:flex">
            <div className="text-end"><p className="font-heading text-lg font-semibold">PowerCare</p><p className="flex items-center gap-1 text-[10px] text-muted-foreground"><ShieldCheck className="h-3 w-3 text-accent" />{ar ? "توقيع آمن" : "Secure signing"}</p></div>
            <Logo size={42} />
          </div>
        </header>
        {children}
        <p className="mt-6 flex items-center justify-center gap-2 text-xs text-muted-foreground"><ShieldCheck className="h-4 w-4 text-accent" />{ar ? "توقيع إلكتروني موثّق وآمن بواسطة PowerCare" : "Secure, verified electronic signing by PowerCare"}</p>
      </main>
    </div>
  );
}