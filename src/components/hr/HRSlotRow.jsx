import React from "react";
import { useI18n } from "@/lib/i18n";
import { UserCog, Eye, Plus, X } from "lucide-react";
import ConfirmDeleteDialog from "@/components/ConfirmDeleteDialog";

// One role slot within a tier card (Manager or Assistant), listing assigned employees.
export default function HRSlotRow({ label, roleTag, employees, canManage, onAdd, onRemove }) {
  const { t } = useI18n();
  const isAssistant = roleTag === "assistant";

  return (
    <div className="p-3 rounded-lg border border-border/70 bg-background/70 backdrop-blur-sm space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          {isAssistant ? <Eye className="w-3.5 h-3.5 text-muted-foreground" /> : <UserCog className="w-3.5 h-3.5 text-accent" />}
          <p className="text-xs font-body font-medium tracking-wide">{label}</p>
          <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-body uppercase tracking-wider ${isAssistant ? "bg-muted text-muted-foreground" : "bg-accent/15 text-accent"}`}>
            {isAssistant ? t("viewAuditOnly") : t("hrManagerRole")}
          </span>
        </div>
        {canManage && (
          <button onClick={onAdd} className="p-1 rounded-md hover:bg-accent/10 text-accent transition-colors" title={t("add")}>
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
            <div key={e.id} className="flex items-center justify-between px-2.5 py-1.5 rounded-md bg-card border border-border/50 text-xs font-body">
              <span className="truncate font-heading text-[13px]">{e.name}{e.position ? <span className="text-muted-foreground font-body"> — {e.position}</span> : ""}</span>
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