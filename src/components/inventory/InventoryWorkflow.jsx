import React from "react";
import { PackagePlus, ArrowLeftRight, PackageMinus, History } from "lucide-react";
import { useOrgTerms } from "@/hooks/useOrgTerms";

export default function InventoryWorkflow({ onNavigate, ar }) {
  const { terms } = useOrgTerms();
  const steps = [
    ["purchase", PackagePlus, ar ? "المشتريات / الإدخال" : "Purchase / Entry", ar ? "أدخل بيانات الصنف والكمية والفاتورة" : "Enter item, quantity and invoice details"],
    ["items", ArrowLeftRight, ar ? "الأصناف" : "Items", ar ? `راجع الأصناف وأماكن وجودها` : `Review items and their ${terms.stations.toLowerCase()}`],
    ["requests", History, ar ? `طلب من ${terms.aStation}` : `Request from ${terms.station.toLowerCase()}`, ar ? "اطلب صنفًا وانتظر موافقة المصدر" : "Request an item and await approval"],
    ["consumption", PackageMinus, ar ? "الصرف للعمل" : "Issue to work", ar ? `اصرف من رصيد ${terms.theStation} ووثّق المستلم` : `Issue from ${terms.station.toLowerCase()} stock and document recipient`],
  ];
  const gridDirection = ar ? "[direction:rtl]" : "[direction:ltr]";

  return (
    <section className="rounded-[10px] border border-[#E4E7EC] bg-white px-4 py-5 md:px-5">
      <div className="mb-4">
        <p className="text-[11px] font-semibold tracking-[0.14em] text-[#0E7A4B]">NIROVERA WORKFLOW</p>
        <h2 className="mt-1 text-lg font-semibold text-[#101828] md:text-xl">
          {ar ? "دورة حركة الصنف" : "Item movement cycle"}
        </h2>
        <p className="mt-1 text-sm text-[#667085]">
          {ar ? "تبدأ بالشراء وتنتهي عند صرف الصنف للعمل." : "Starts with purchase and ends when the item is issued to work."}
        </p>
      </div>
      <div className={`grid gap-3 sm:grid-cols-2 xl:grid-cols-4 ${gridDirection}`}>
        {steps.map(([key, Icon, title, text], index) => (
          <button
            type="button"
            key={key}
            onClick={() => onNavigate(key)}
            className="relative flex flex-col gap-2 rounded-[10px] border border-[#E4E7EC] bg-[#F9FAFB] px-3.5 py-4 text-start transition hover:border-[#0E7A4B] hover:bg-white"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#0B1A3F] text-xs font-semibold text-white">
              {index + 1}
            </span>
            <Icon className="h-5 w-5 text-[#0E7A4B]" strokeWidth={1.6} />
            <span className="text-[13.5px] font-semibold text-[#101828]">{title}</span>
            <span className="text-[12px] leading-5 text-[#667085]">{text}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
