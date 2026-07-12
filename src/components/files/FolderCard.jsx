import React from "react";
import { Folder, Trash2 } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import ConfirmDeleteDialog from "@/components/ConfirmDeleteDialog";

export default function FolderCard({ folder, count, onOpen, onDelete }) {
  const { t } = useI18n();
  return (
    <div className="group relative bg-card border border-border rounded-lg p-4 hover:border-accent/60 hover:shadow-sm transition-all cursor-pointer" onClick={onOpen}>
      <Folder className="w-8 h-8 text-accent mb-2" strokeWidth={1.5} fill="currentColor" fillOpacity={0.15} />
      <p className="text-sm font-medium font-body truncate" dir="auto">{folder.name}</p>
      <p className="text-[11px] text-muted-foreground mt-0.5">{count} {t("itemsUnit")}</p>
      <div onClick={(e) => e.stopPropagation()}>
        <ConfirmDeleteDialog
          onConfirm={onDelete}
          trigger={
            <button
              className="absolute top-2 end-2 p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-muted opacity-0 group-hover:opacity-100 transition-opacity"
              aria-label={t("delete")}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          }
        />
      </div>
    </div>
  );
}