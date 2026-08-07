import React from "react";
import { X } from "lucide-react";

export default function OrgTreeDragCancel({ active, ar }) {
  if (!active) return null;
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-6 z-[90] flex justify-center px-4">
      <div
        data-org-drop
        data-target-id="cancel"
        data-drop-mode="cancel"
        className="pointer-events-auto flex min-h-14 items-center gap-2 rounded-lg border-2 border-dashed border-destructive bg-card px-6 py-3 text-sm font-semibold text-destructive shadow-elevated"
      >
        <X className="h-5 w-5" />
        {ar ? "اسحب هنا لإلغاء النقل" : "Drag here to cancel"}
      </div>
    </div>
  );
}