import React from "react";
import IdentityCard from "@/components/shared/IdentityCard";
import PublicPaperShell, { legalCopy } from "@/components/shared/PublicPaperShell";

export default function RefundPolicy() {
  return (
    <PublicPaperShell>
      <IdentityCard title="سياسة الاسترجاع والاسترداد — Refund Policy" dir="rtl" bodySurface>
        <div style={legalCopy.wrap}>
          <p style={{ margin: 0 }}>آخر تحديث: 27 يوليو 2026</p>
          <h2 style={legalCopy.h2}>مدة طلب الاسترجاع</h2>
          <p style={{ margin: 0 }}>يمكن للعميل طلب استرداد قيمة أول اشتراك مدفوع خلال ثلاثة (3) أيام تقويمية من تاريخ إتمام عملية الدفع.</p>
          <h2 style={legalCopy.h2}>طريقة تقديم الطلب</h2>
          <p style={{ margin: 0 }}>يُرسل الطلب إلى niyar@powercares.pro من البريد المرتبط بالحساب، مع ذكر اسم الشركة ورقم العملية وسبب الطلب.</p>
          <h2 style={legalCopy.h2}>معالجة الاسترداد</h2>
          <p style={{ margin: 0 }}>بعد التحقق من الطلب، يُعاد المبلغ المستحق إلى وسيلة الدفع الأصلية. قد يستغرق ظهوره في الحساب عدة أيام عمل وفقًا للبنك أو مزود خدمة الدفع.</p>
          <h2 style={legalCopy.h2}>التجديد والإلغاء</h2>
          <p style={{ margin: 0 }}>يمكن إلغاء التجديد في أي وقت. لا يشمل الاسترداد الفترات التي انقضت عليها مهلة الثلاثة أيام، مع عدم الإخلال بالحقوق الإلزامية المقررة للعميل بموجب الأنظمة المعمول بها.</p>
          <hr style={legalCopy.hr} />
          <p style={legalCopy.en}>Customers may request a refund for their first paid subscription within three (3) calendar days of payment. Approved refunds are returned to the original payment method. Processing time depends on the bank or payment provider. Mandatory consumer rights under applicable law remain unaffected.</p>
        </div>
      </IdentityCard>
    </PublicPaperShell>
  );
}
