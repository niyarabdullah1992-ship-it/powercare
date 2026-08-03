import React from "react";
import { Link } from "react-router-dom";
import Logo from "@/components/Logo";

export default function RefundPolicy() {
  return <div className="powercare-public min-h-screen bg-landing-cinema px-4 py-10 font-body" dir="rtl">
    <div className="mx-auto max-w-3xl rounded-2xl border border-accent/20 bg-card px-6 py-10 text-card-foreground shadow-2xl shadow-accent/10 md:px-10">
      <Link to="/" className="mb-8 flex items-center gap-2"><Logo size={32} /><span className="font-heading text-lg font-semibold">NiroVera</span></Link>
      <h1 className="mb-6 font-heading text-3xl">سياسة الاسترجاع والاسترداد — Refund Policy</h1>
      <div className="space-y-4 text-sm leading-relaxed text-muted-foreground">
        <p>آخر تحديث: 27 يوليو 2026</p>
        <h2 className="pt-2 font-heading text-xl text-primary">مدة طلب الاسترجاع</h2><p>يمكن للعميل طلب استرداد قيمة أول اشتراك مدفوع خلال ثلاثة (3) أيام تقويمية من تاريخ إتمام عملية الدفع.</p>
        <h2 className="pt-2 font-heading text-xl text-primary">طريقة تقديم الطلب</h2><p>يُرسل الطلب إلى niyar@powercares.pro من البريد المرتبط بالحساب، مع ذكر اسم الشركة ورقم العملية وسبب الطلب.</p>
        <h2 className="pt-2 font-heading text-xl text-primary">معالجة الاسترداد</h2><p>بعد التحقق من الطلب، يُعاد المبلغ المستحق إلى وسيلة الدفع الأصلية. قد يستغرق ظهوره في الحساب عدة أيام عمل وفقًا للبنك أو مزود خدمة الدفع.</p>
        <h2 className="pt-2 font-heading text-xl text-primary">التجديد والإلغاء</h2><p>يمكن إلغاء التجديد في أي وقت. لا يشمل الاسترداد الفترات التي انقضت عليها مهلة الثلاثة أيام، مع عدم الإخلال بالحقوق الإلزامية المقررة للعميل بموجب الأنظمة المعمول بها.</p>
        <hr className="border-landing-gold/20" /><p className="text-xs">Customers may request a refund for their first paid subscription within three (3) calendar days of payment. Approved refunds are returned to the original payment method. Processing time depends on the bank or payment provider. Mandatory consumer rights under applicable law remain unaffected.</p>
      </div>
    </div>
  </div>;
}