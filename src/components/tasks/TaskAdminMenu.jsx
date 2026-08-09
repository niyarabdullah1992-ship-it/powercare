import React, { useState } from "react";
import { MoreHorizontal, Pencil, Trash2, Check, Globe } from "lucide-react";
import MobileSelect from "@/components/mobile/MobileSelect";
import ConfirmDeleteDialog from "@/components/ConfirmDeleteDialog";
import { NO_SECTION } from "@/lib/taskFolders";

// الأزرار الإدارية في قائمة ⋯ في الطرف — لا تتصدّر البطاقة.
export default function TaskAdminMenu({ tg, t, lang, allSectionFolders, moveTaskToSection, setEditTarget, deleteTarget, convertToRemote, canChangeCompletionMode, completeTarget, done }) {
  const [open, setOpen] = useState(false);
  const [completing, setCompleting] = useState(false);
  const ar = lang === "ar";
  const completionMode = tg.completionMode || "onsite";

  return (
    <div className="relative">
      <button type="button" onClick={() => setOpen(!open)} className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground" title={ar ? "خيارات" : "Options"}>
        <MoreHorizontal className="h-4 w-4" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute z-20 mt-1 w-60 space-y-1.5 rounded-lg border border-border bg-card p-2 shadow-elevated end-0">
            <MobileSelect
              value={tg.section || NO_SECTION}
              onChange={(value) => { moveTaskToSection(tg, value); setOpen(false); }}
              placeholder={t("moveToSection")}
              options={allSectionFolders.map((folder) => ({ value: folder.key, label: folder.name }))}
              className="w-full px-2 py-1.5 text-xs"
            />
            <button onClick={() => { setEditTarget(tg); setOpen(false); }} className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs font-body hover:bg-muted">
              <Pencil className="h-3.5 w-3.5" /> {t("edit")}
            </button>
            {!done && canChangeCompletionMode && completionMode === "onsite" && (
              <button onClick={() => { convertToRemote(tg); setOpen(false); }} className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs font-body hover:bg-muted">
                <Globe className="h-3.5 w-3.5" /> {ar ? "تحويل إلى عن بُعد" : "Convert to remote"}
              </button>
            )}
            {!done && (
              <button
                disabled={completing}
                onClick={async () => { setCompleting(true); try { await completeTarget(tg); setOpen(false); } finally { setCompleting(false); } }}
                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs font-body hover:bg-muted disabled:opacity-50"
              >
                <Check className="h-3.5 w-3.5" /> {completing ? (ar ? "جارٍ الإنهاء..." : "Completing...") : (ar ? "إنهاء المهمة" : "Complete task")}
              </button>
            )}
            <ConfirmDeleteDialog
              onConfirm={() => deleteTarget(tg.id)}
              description={t("confirmDeleteTask")}
              trigger={
                <button className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs font-body text-red-600 hover:bg-red-50">
                  <Trash2 className="h-3.5 w-3.5" /> {t("delete")}
                </button>
              }
            />
          </div>
        </>
      )}
    </div>
  );
}