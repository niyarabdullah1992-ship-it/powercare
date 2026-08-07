import React from "react";
import { Clock, ShieldCheck, TrendingUp, Sparkles } from "lucide-react";
import { Image } from "@/components/ui/image";
import Logo from "@/components/Logo";
import PowerCareLoginPanel from "@/components/auth/PowerCareLoginPanel";
import { isBase44BackendConfigured } from "@/lib/localPreview";

const HERO_IMAGE = "https://media.base44.com/images/public/6a4f617bd7360a0ae9581d2a/573c53f75_generated_image.png";

export default function LandingHero({ lang, t }) {
  const features = [[Clock, "feature1"], [TrendingUp, "feature2"], [ShieldCheck, "feature3"]];
  const ar = lang === "ar";
  const cloudReady = isBase44BackendConfigured();

  return (
    <section className="px-4 pb-8 pt-8 sm:px-6 md:px-8 md:pt-10">
      <div dir={lang === "ar" ? "rtl" : "ltr"} className="mx-auto max-w-[1380px] overflow-hidden rounded-2xl border border-landing-gold/30 bg-card shadow-elevated">
        <div className="grid lg:grid-cols-[minmax(0,1.55fr)_minmax(320px,0.65fr)]">
          <div className="relative min-h-[360px] overflow-hidden bg-primary sm:min-h-[500px] lg:min-h-[620px]">
            <Image src={HERO_IMAGE} alt={lang === "ar" ? "فريق قيادي يتعاون في بيئة مؤسسية حديثة" : "Leadership team collaborating in a modern corporate workplace"} originWidth={1536} originHeight={864} fittingType="fill" quality={100} className="absolute inset-0 h-full w-full" />
            <div className="absolute inset-0 bg-gradient-to-t from-primary via-primary/10 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-6 text-primary-foreground sm:p-10 lg:p-12">
              <p className="inline-flex rounded-full border border-landing-gold/35 bg-white/10 px-3.5 py-1.5 text-xs font-semibold text-landing-gold-light backdrop-blur-sm">{t("heroEyebrow")}</p>
              <h1 className="mt-4 font-heading text-5xl font-semibold leading-none tracking-[-0.04em] sm:text-7xl">NiroVera</h1>
              <p className="mt-4 max-w-2xl text-sm leading-6 text-primary-foreground/85 sm:text-lg sm:leading-7">{t("heroSubtitle")}</p>
              <p className="mt-5 max-w-xl text-xs leading-6 text-primary-foreground/60 sm:text-sm">
                {ar
                  ? "نيروفيرا تربط الحضور بالمهمة، والمهمة بالإثبات، والإثبات بالنقاط والأداء — ببصمة رقمية يمكن التحقق منها."
                  : "NiroVera links attendance to tasks, tasks to proof, and proof to performance — with a verifiable digital seal."}
              </p>
            </div>
          </div>

          <aside className="flex flex-col justify-between border-t border-landing-gold/30 bg-card p-6 lg:border-s lg:border-t-0 lg:p-8">
            <div>
              <div className="flex items-center gap-3 border-b border-border pb-5">
                <Logo size={36} />
                <div>
                  <p className="font-heading text-xl font-semibold">NiroVera</p>
                  <p className="text-xs text-muted-foreground">{t("heroEyebrow")}</p>
                </div>
              </div>
              <h2 className="mt-7 text-center font-heading text-2xl font-semibold">{t("chooseLoginType")}</h2>
              <div className="mt-5 space-y-3">
                <a
                  href="/preview"
                  className="flex w-full items-center justify-center gap-2 rounded-md border border-accent/40 bg-accent/10 py-2.5 text-xs font-semibold text-accent hover:bg-accent/15"
                >
                  <Sparkles className="h-4 w-4" />
                  {ar ? "معاينة الصفحات الداخلية" : "Preview internal pages"}
                </a>
                {!cloudReady && (
                  <p className="text-center text-[11px] leading-5 text-muted-foreground">
                    {ar
                      ? "للمعاينة المحلية دون خادم Base44 — بيانات توضيحية كاملة."
                      : "Local preview without Base44 — full sample workspace."}
                  </p>
                )}
                <PowerCareLoginPanel showTypeSelector returnPath="/" />
              </div>
            </div>
            <div className="mt-8 space-y-2 border-t border-border pt-5">
              {features.map(([Icon, key], index) => (
                <div key={key} className="flex items-center gap-3 rounded-lg bg-secondary px-3 py-3">
                  <span className="font-mono text-[10px] text-accent">0{index + 1}</span>
                  <Icon className="h-4 w-4 shrink-0 text-accent" strokeWidth={1.6} />
                  <p className="text-xs font-medium leading-5">{t(key)}</p>
                </div>
              ))}
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}
