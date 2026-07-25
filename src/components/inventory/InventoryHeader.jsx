import React from "react";
import { PackageOpen } from "lucide-react";

export default function InventoryHeader({ ar }) {
  return (
    <header className="relative overflow-hidden rounded-xl border border-accent/40 bg-primary px-5 py-6 text-primary-foreground shadow-elevated md:px-7">
      <div className="absolute -end-12 -top-20 h-52 w-52 rounded-full border border-accent/20 shadow-[0_0_0_28px_hsl(var(--accent)/0.04)]" />
      <div className="relative flex items-center gap-4">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-accent/50 bg-accent/10 text-accent">
          <PackageOpen className="h-6 w-6" />
        </span>
        <div>
          <p className="font-mono text-[10px] uppercase tracking-widest text-accent">
            PowerCare · Inventory Control
          </p>
          <h1 className="mt-1 font-heading text-3xl font-semibold !text-primary-foreground">
            {ar ? "المخزن" : "Inventory"}
          </h1>
          <p className="mt-1 text-sm text-primary-foreground/70">
            {ar ? "إدارة الأصناف والحركات والطلبات من مركز موحّد" : "Manage items, movements, and requests from one control center"}
          </p>
        </div>
      </div>
    </header>
  );
}