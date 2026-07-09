import React, { useState } from "react";
import Reveal from "./Reveal";
import { ArrowRight } from "lucide-react";

export default function Contact() {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [sent, setSent] = useState(false);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = (e) => {
    e.preventDefault();
    setSent(true);
    setForm({ name: "", email: "", message: "" });
    setTimeout(() => setSent(false), 4000);
  };

  return (
    <section id="contact" className="bg-background py-24 md:py-40 px-6 md:px-12">
      <div className="mx-auto max-w-[1400px] grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24">
        {/* Left — invitation */}
        <Reveal>
          <div>
            <p className="text-[11px] tracking-widest-xl uppercase text-accent font-body mb-4">
              04 — التواصل
            </p>
            <h2 className="hero-title text-4xl md:text-6xl lg:text-7xl mb-8">
              لنبدأ
              <br />
              <span className="italic font-light">الحوار</span>
            </h2>
            <p className="font-body text-base md:text-lg text-muted-foreground leading-relaxed max-w-md mb-12">
              كل مشروع عظيم يبدأ بسؤال. شاركنا رؤيتك، وسنرد خلال 48 ساعة
              لبدء محادثة قد تكون بداية فراغٍ يبقى.
            </p>

            <div className="space-y-6 font-body">
              <div>
                <p className="text-[10px] tracking-widest-xl uppercase text-muted-foreground mb-1">
                  المرسم
                </p>
                <p className="text-foreground">وادي الحجر · المدينة القديمة</p>
              </div>
              <div>
                <p className="text-[10px] tracking-widest-xl uppercase text-muted-foreground mb-1">
                  المراسلة
                </p>
                <a
                  href="mailto:atelier@chronos.archive"
                  className="text-foreground hover:text-accent transition-colors duration-300 border-b border-border hover:border-accent pb-1"
                >
                  atelier@chronos.archive
                </a>
              </div>
              <div>
                <p className="text-[10px] tracking-widest-xl uppercase text-muted-foreground mb-1">
                  الهاتف
                </p>
                <a
                  href="tel:+97140000000"
                  className="text-foreground hover:text-accent transition-colors duration-300"
                >
                  +971 4 000 0000
                </a>
              </div>
            </div>
          </div>
        </Reveal>

        {/* Right — form */}
        <Reveal delay={150}>
          <form onSubmit={handleSubmit} className="flex flex-col gap-10">
            <div className="relative">
              <input
                type="text"
                name="name"
                id="c-name"
                value={form.name}
                onChange={handleChange}
                required
                placeholder=" "
                className="peer w-full bg-transparent border-0 border-b border-border focus:border-accent pb-3 pt-2 text-foreground font-body text-lg outline-none transition-colors duration-300 placeholder:text-transparent"
              />
              <label
                htmlFor="c-name"
                className="absolute right-0 top-2 text-muted-foreground font-body text-base transition-all duration-300 peer-focus:-top-4 peer-focus:text-xs peer-focus:text-accent peer-[&:not(:placeholder-shown)]:-top-4 peer-[&:not(:placeholder-shown)]:text-xs"
              >
                الاسم
              </label>
            </div>

            <div className="relative">
              <input
                type="email"
                name="email"
                id="c-email"
                value={form.email}
                onChange={handleChange}
                required
                placeholder=" "
                className="peer w-full bg-transparent border-0 border-b border-border focus:border-accent pb-3 pt-2 text-foreground font-body text-lg outline-none transition-colors duration-300 placeholder:text-transparent"
              />
              <label
                htmlFor="c-email"
                className="absolute right-0 top-2 text-muted-foreground font-body text-base transition-all duration-300 peer-focus:-top-4 peer-focus:text-xs peer-focus:text-accent peer-[&:not(:placeholder-shown)]:-top-4 peer-[&:not(:placeholder-shown)]:text-xs"
              >
                البريد الإلكتروني
              </label>
            </div>

            <div className="relative">
              <textarea
                name="message"
                id="c-message"
                value={form.message}
                onChange={handleChange}
                required
                rows={4}
                placeholder=" "
                className="peer w-full bg-transparent border-0 border-b border-border focus:border-accent pb-3 pt-2 text-foreground font-body text-lg outline-none transition-colors duration-300 resize-none placeholder:text-transparent"
              />
              <label
                htmlFor="c-message"
                className="absolute right-0 top-2 text-muted-foreground font-body text-base transition-all duration-300 peer-focus:-top-4 peer-focus:text-xs peer-focus:text-accent peer-[&:not(:placeholder-shown)]:-top-4 peer-[&:not(:placeholder-shown)]:text-xs"
              >
                رؤيتك
              </label>
            </div>

            <button
              type="submit"
              className="group inline-flex items-center justify-center gap-3 self-start mt-4 px-8 py-4 bg-foreground text-background font-body text-sm tracking-wider hover:bg-accent transition-colors duration-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-sm"
            >
              {sent ? "تم الاستلام — شكرًا" : "أرسل الرسالة"}
              <ArrowRight
                className="w-4 h-4 transition-transform duration-500 group-hover:translate-x-1"
                strokeWidth={1.5}
              />
            </button>
          </form>
        </Reveal>
      </div>
    </section>
  );
}