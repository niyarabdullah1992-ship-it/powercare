import React from "react";
import { X } from "lucide-react";

// لوحة جانبية بعرض ٥٢٠ بكسل: النموذج كامل في تمرير واحد، والمدير يبقى ناظراً إلى قائمة المهام خلفها.
export default function TaskSidePanel({ open, title, onClose, dir, children, footer }) {
  if (!open) return null;
  const side = dir === "rtl" ? "left-0" : "right-0";
  return (
    <div className="fixed inset-0 z-50 flex" onClick={onClose}>
      <div className="absolute inset-0 bg-black/30" />
      <aside
        onClick={(e) => e.stopPropagation()}
        style={{ width: "min(520px, 100%)" }}
        className={`absolute inset-y-0 ${side} flex flex-col border-s border-accent/40 bg-card shadow-elevated`}
      >
        <header className="flex shrink-0 items-center justify-between gap-2 border-b border-border px-5 py-4">
          <h3 className="font-heading text-lg font-semibold">{title}</h3>
          <button type="button" onClick={onClose} className="rounded-full border border-border p-1.5 hover:bg-muted">
            <X className="h-4 w-4" />
          </button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer && <footer className="shrink-0 border-t border-border px-5 py-4">{footer}</footer>}
      </aside>
    </div>
  );
}