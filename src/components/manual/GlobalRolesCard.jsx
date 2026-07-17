import React from "react";
import RolePermissionsTable from "@/components/manual/RolePermissionsTable";
import { MANUAL_CHAPTERS } from "@/lib/siteManualContent";

export default function GlobalRolesCard() {
  const rows = MANUAL_CHAPTERS.map((chapter) => ({ ...(chapter.roleTable[0] || {}), action: chapter.title.replace(/^\d+\.\s*/, "") }));
  return <section className="print:break-after-page"><RolePermissionsTable rows={rows} title="دليل الأدوار السريع — ملخص الوصول عبر جميع الأقسام" dark /><p className="mt-2 px-2 text-xs text-muted-foreground">تعني «جزئي» أن الوصول يتحدد بالمحطة أو نطاق HR أو الصلاحية المفوضة.</p></section>;
}