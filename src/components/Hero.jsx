import React from "react";
import { ArrowDown } from "lucide-react";

export default function Hero({ image }) {
  return (
    <section id="hero" className="relative h-screen min-h-[700px] w-full overflow-hidden">
      {/* Parallax background */}
      <div className="absolute inset-0">
        <img
          src={image}
          alt="معمارية ضخمة تندمج مع الطبيعة"
          className="w-full h-[110%] object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/10 to-black/40" />
      </div>

      {/* Vertical side text */}
      <div className="hidden lg:flex absolute left-8 top-1/2 -translate-y-1/2 z-10 items-center gap-4">
        <span className="vertical-text text-[10px] tracking-widest-xl uppercase text-white/70 font-body">
          Atelier · Est. MMXXV
        </span>
        <span className="block w-px h-24 bg-white/40" />
      </div>

      <div className="hidden lg:flex absolute right-8 top-1/2 -translate-y-1/2 z-10 items-center gap-4">
        <span className="block w-px h-24 bg-white/40" />
        <span className="vertical-text text-[10px] tracking-widest-xl uppercase text-white/70 font-body">
          36°N · Stone · Light · Form
        </span>
      </div>

      {/* Center content */}
      <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-6">
        <p
          className="text-[11px] md:text-xs tracking-widest-xl uppercase text-white/80 font-body mb-6 md:mb-8"
          style={{ animation: "fadeUp 1.4s 0.2s both cubic-bezier(0.16,1,0.3,1)" }}
        >
          مرسم معماري للمستقبل
        </p>
        <h1
          className="hero-title text-white text-5xl sm:text-6xl md:text-7xl lg:text-8xl max-w-5xl"
          style={{ animation: "fadeUp 1.4s 0.4s both cubic-bezier(0.16,1,0.3,1)" }}
        >
          التناغم المكاني
          <br />
          <span className="italic font-light text-white/90">في أنقى صوره</span>
        </h1>
        <p
          className="mt-8 md:mt-10 max-w-xl text-base md:text-lg text-white/85 font-body leading-relaxed"
          style={{ animation: "fadeUp 1.4s 0.6s both cubic-bezier(0.16,1,0.3,1)" }}
        >
          نصمم إرثًا بصريًا يجمع بين الاستدامة الراقية والرفاهية الصامتة —
          حيث يلتقي الحجر بالضوء، والشكل بالطبيعة.
        </p>
        <a
          href="#projects"
          className="mt-10 md:mt-12 group inline-flex items-center gap-3 text-white font-body text-sm tracking-wider transition-colors duration-300 hover:text-white/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-sm px-2 py-1"
          style={{ animation: "fadeUp 1.4s 0.8s both cubic-bezier(0.16,1,0.3,1)" }}
        >
          <span className="border-b border-white/40 pb-1 group-hover:border-white transition-colors">
            استكشف الأعمال
          </span>
          <ArrowDown className="w-4 h-4 transition-transform duration-500 group-hover:translate-y-1" strokeWidth={1.25} />
        </a>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2">
        <span className="block w-px h-12 bg-white/40 animate-pulse" />
      </div>

      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </section>
  );
}