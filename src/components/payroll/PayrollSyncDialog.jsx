import React from "react";
import { RefreshCw } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

export default function PayrollSyncDialog({ open, onOpenChange, onConfirm, ar }) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent dir={ar ? "rtl" : "ltr"} className="overflow-hidden border-accent/40 bg-card p-0 shadow-elevated sm:max-w-md">
        <div className="border-b border-accent/30 bg-primary px-6 py-5 text-primary-foreground">
          <AlertDialogHeader className={ar ? "text-right sm:text-right" : "text-left"}>
            <span className="mb-2 flex h-10 w-10 items-center justify-center rounded-full border border-accent/45 bg-accent/10 text-accent">
              <RefreshCw className="h-5 w-5" strokeWidth={1.75} />
            </span>
            <AlertDialogTitle className="font-heading text-xl text-primary-foreground">{ar ? "تحديث بيانات الرواتب" : "Refresh payroll data"}</AlertDialogTitle>
            <AlertDialogDescription className="leading-7 text-primary-foreground/75">{ar ? "سيتم تحديث الراتب الأساسي والبدلات والعملة للموظفين غير المدفوعين فقط." : "Base salary, allowances, and currency will be refreshed for unpaid employees only."}</AlertDialogDescription>
          </AlertDialogHeader>
        </div>
        <AlertDialogFooter className="gap-2 px-6 pb-6 sm:space-x-0">
          <AlertDialogCancel>{ar ? "إلغاء" : "Cancel"}</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} className="bg-accent font-semibold text-accent-foreground hover:bg-accent/90">{ar ? "تأكيد التحديث" : "Confirm refresh"}</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}