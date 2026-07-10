import React from "react";
import { useI18n } from "@/lib/i18n";
import { UserCog, Eye, Plus, X } from "lucide-react";
import ConfirmDeleteDialog from "@/components/ConfirmDeleteDialog";

// One role slot within a tier card (Manager or Assistant), listing assigned employees.
export default function HRSlotRow({ label, roleTag, employees, canManage, onAdd, onRemove }) {
  const { t } = useI18n();
  const isAssistant = roleTag === "assistant";

  return (
    <div className="p-3 rounded-lg border border-border bg-background space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          {isAssistant ? <Eye className="w-3.5 h-3.5 text-muted-foreground" /> : <UserCog className="w-3.5 h-3.5 text-accent" />}
          <p className="text-xs font-body font-medium">{label}</p>
          <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-body ${isAssistant ? "bg-muted text-muted-foreground" : "bg-accent/15 text-accent"}`}>
            {isAssistant ? t("viewAuditOnly") : t("hrManagerRole")}
          </span>
        </div>
        {canManage && (
          <button onClick={onAdd} className="p-1 rounded-md hover:bg-muted text-accent" title={t("add")}>
            <Plus className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {employees.length === 0 ? (
        <p className="text-[11px] text-muted-foreground font-body italic">
          {isAssistant ? t("noAssistantAssigned") : t("noManagerAssigned")}
        </p>
      ) : (
        <div className="space-y-1">
          {employees.map((e) => (
            <div key={e.id} className="flex items-center justify-between px-2 py-1 rounded-md bg-card text-xs font-body">
              <span className="truncate">{e.name}{e.position ? ` — ${e.position}` : ""}</span>
              {canManage && (
                <ConfirmDeleteDialog
                  onConfirm={() => onRemove(e.id)}
                  trigger={
                    <button className="p-0.5 rounded hover:bg-muted text-destructive shrink-0" title={t("removeHR")}>
                      <X className="w-3.5 h-3.5" />
                    </button>
                  }
                />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}