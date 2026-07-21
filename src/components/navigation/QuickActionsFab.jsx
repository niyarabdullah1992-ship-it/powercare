import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Plus, X, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { quickPathsFor } from "@/lib/quickNavigation";

export default function QuickActionsFab({ items, role, lang }) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const paths = quickPathsFor(role);
  const actions = paths.map((path) => items.find((item) => item.to === path)).filter(Boolean).slice(0, 4);
  return (
    <div className="fixed bottom-20 end-4 z-40 md:bottom-6 md:end-6">
      <AnimatePresence>
        {open && <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }} className="mb-3 w-56 overflow-hidden rounded-2xl border border-border bg-card/95 p-2 shadow-elevated backdrop-blur-xl">
          <p className="flex items-center gap-2 px-2 py-2 text-xs font-semibold text-muted-foreground"><Zap className="h-4 w-4 text-accent" />{lang === "ar" ? "اختصارات سريعة" : "Quick actions"}</p>
          {actions.map((item) => <button key={item.to} onClick={() => { navigate(item.to); setOpen(false); }} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-start text-sm hover:bg-muted"><item.icon className="h-4 w-4 text-accent" />{item.label}</button>)}
        </motion.div>}
      </AnimatePresence>
      <button onClick={() => setOpen((value) => !value)} aria-label={lang === "ar" ? "فتح الاختصارات" : "Open shortcuts"} className="ms-auto flex h-14 w-14 items-center justify-center rounded-full bg-accent text-accent-foreground shadow-elevated ring-4 ring-background/70 hover:scale-105">
        {open ? <X className="h-5 w-5" /> : <Plus className="h-6 w-6" />}
      </button>
    </div>
  );
}