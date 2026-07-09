import React, { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";

const links = [
  { label: "المدخل", href: "#hero" },
  { label: "الأعمال", href: "#projects" },
  { label: "الفلسفة", href: "#philosophy" },
  { label: "التواصل", href: "#contact" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <header
        className={`fixed top-0 inset-x-0 z-50 transition-all duration-700 ${
          scrolled ? "bg-background/85 backdrop-blur-md py-4" : "bg-transparent py-6"
        }`}
      >
        <div className="mx-auto max-w-[1600px] px-6 md:px-12 flex items-center justify-between">
          <a href="#hero" className="group flex items-center gap-3">
            <span className="block w-6 h-px bg-foreground transition-all duration-500 group-hover:w-10" />
            <span className="hero-title text-xl md:text-2xl tracking-wide">
              CHRONOS
            </span>
            <span className="hidden sm:inline text-[10px] tracking-widest-xl uppercase text-muted-foreground font-body">
              Archive
            </span>
          </a>

          <nav className="hidden md:flex items-center gap-10">
            {links.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="relative text-sm font-body text-foreground/80 hover:text-foreground transition-colors duration-300 group"
              >
                {l.label}
                <span className="absolute -bottom-1 right-0 w-0 h-px bg-accent transition-all duration-500 group-hover:w-full" />
              </a>
            ))}
          </nav>

          <button
            onClick={() => setOpen(true)}
            className="md:hidden p-2 -mr-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-sm"
            aria-label="فتح القائمة"
          >
            <Menu className="w-6 h-6" strokeWidth={1.25} />
          </button>
        </div>
      </header>

      {/* Mobile overlay menu */}
      <div
        className={`fixed inset-0 z-[60] bg-background transition-all duration-500 ${
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      >
        <div className="flex items-center justify-between px-6 py-6">
          <span className="hero-title text-2xl">CHRONOS</span>
          <button
            onClick={() => setOpen(false)}
            className="p-2 -mr-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-sm"
            aria-label="إغلاق القائمة"
          >
            <X className="w-6 h-6" strokeWidth={1.25} />
          </button>
        </div>
        <nav className="flex flex-col items-center justify-center flex-1 gap-8 mt-20">
          {links.map((l, i) => (
            <a
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="hero-title text-4xl text-foreground/80 hover:text-accent transition-colors duration-300"
              style={{ transitionDelay: `${i * 50}ms` }}
            >
              {l.label}
            </a>
          ))}
        </nav>
      </div>
    </>
  );
}