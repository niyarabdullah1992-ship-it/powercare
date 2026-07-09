import React from "react";

export default function Footer() {
  return (
    <footer className="bg-foreground text-background px-6 md:px-12 py-16">
      <div className="mx-auto max-w-[1600px]">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-10 pb-12 border-b border-background/15">
          <div>
            <h2 className="hero-title text-4xl md:text-6xl">
              CHRONOS
              <span className="block italic font-light text-background/60 text-2xl md:text-3xl mt-1">
                Archive
              </span>
            </h2>
          </div>
          <nav className="flex flex-wrap gap-x-8 gap-y-3 font-body">
            {[
              { label: "الأعمال", href: "#projects" },
              { label: "الفلسفة", href: "#philosophy" },
              { label: "التواصل", href: "#contact" },
              { label: "الخصوصية", href: "#" },
              { label: "الشروط", href: "#" },
            ].map((l) => (
              <a
                key={l.label}
                href={l.href}
                className="text-sm text-background/70 hover:text-background transition-colors duration-300"
              >
                {l.label}
              </a>
            ))}
          </nav>
        </div>

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mt-8 font-body text-xs text-background/50">
          <p>© {new Date().getFullYear()} THE CHRONOS ARCHIVE. جميع الحقوق محفوظة.</p>
          <p className="tracking-widest-xl uppercase text-[10px]">
            Stone · Light · Form
          </p>
        </div>
      </div>
    </footer>
  );
}