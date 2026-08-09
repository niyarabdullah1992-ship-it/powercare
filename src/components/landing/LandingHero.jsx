import React from "react";
import { Clock, ShieldCheck, TrendingUp } from "lucide-react";
import { Image } from "@/components/ui/image";
import Logo from "@/components/Logo";
import PowerCareLoginPanel from "@/components/auth/PowerCareLoginPanel";

const HERO_IMAGE_AR = "https://media.base44.com/images/public/6a4f617bd7360a0ae9581d2a/efea6ea31_nirovera-designed-banner.png";
const HERO_IMAGE_EN = "https://media.base44.com/images/public/6a4f617bd7360a0ae9581d2a/a2e9b9399_generated_image.png";

export default function LandingHero({ lang, t }) {
  const features = [[Clock, "feature1"], [TrendingUp, "feature2"], [ShieldCheck, "feature3"]];
  const HERO_IMAGE = lang === "ar" ? HERO_IMAGE_AR : HERO_IMAGE_EN;
  return (
    <section className="px-4 pb-8 pt-8 sm:px-6 md:px-8 md:pt-10">
      <div dir={lang === "ar" ? "rtl" : "ltr"} className="mx-auto max-w-[1380px] overflow-hidden rounded-2xl border border-landing-gold/30 bg-card shadow-elevated">
        <div className="grid lg:grid-cols-[minmax(0,1.55fr)_minmax(320px,0.65fr)]">
          <div className="relative min-h-[360px] overflow-hidden bg-primary sm:min-h-[500px] lg:min-h-[620px]">
            <Image src={HERO_IMAGE} alt={lang === "ar" ? "فريق قيادي يتعاون في بيئة مؤسسية حديثة" : "Leadership team collaborating in a modern corporate workplace"} originWidth={1536} originHeight={1024} fittingType="fit" quality={100} className="absolute inset-0 h-full w-full object-contain" />
          </div>

          <aside className="flex flex-col justify-between border-t border-landing-gold/30 bg-card p-6 lg:border-s lg:border-t-0 lg:p-8">
            <div>
              <div className="flex items-center gap-3 border-b border-border pb-5"><Logo size={36} /><div><p className="font-heading text-xl font-semibold">NiroVera</p><p className="text-xs text-muted-foreground">{t("heroEyebrow")}</p></div></div>
              <h2 className="mt-7 text-center font-heading text-2xl font-semibold">{t("chooseLoginType")}</h2>
              <div className="mt-5"><PowerCareLoginPanel showTypeSelector returnPath="/" /></div>
            </div>
            <div className="mt-8 space-y-2 border-t border-border pt-5">
              {features.map(([Icon, key], index) => <div key={key} className="flex items-center gap-3 rounded-lg bg-secondary px-3 py-3"><span className="font-mono text-[10px] text-accent">0{index + 1}</span><Icon className="h-4 w-4 shrink-0 text-accent" strokeWidth={1.6} /><p className="text-xs font-medium leading-5">{t(key)}</p></div>)}
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}