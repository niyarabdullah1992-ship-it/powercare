import React from "react";
import { PackageOpen } from "lucide-react";

/** Compact inventory intro — Layout already shows the page title in the app header. */
export default function InventoryHeader({ ar }) {
  return (
    <header className="flex items-center gap-3 rounded-[10px] border border-[#E4E7EC] bg-white px-4 py-3">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#0B1A3F] text-white">
        <PackageOpen className="h-5 w-5" strokeWidth={1.6} />
      </span>
      <div className="min-w-0">
        <p className="text-[11px] font-medium tracking-[0.12em] text-[#0E7A4B]">
          NiroVera · Inventory
        </p>
        <p className="truncate text-sm text-[#667085]">
          {ar ? "إدارة الأصناف والحركات والطلبات من مركز موحّد" : "Manage items, movements, and requests from one control center"}
        </p>
      </div>
    </header>
  );
}
