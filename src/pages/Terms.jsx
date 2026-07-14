import React from "react";
import { Link } from "react-router-dom";
import Logo from "@/components/Logo";

export default function Terms() {
  return (
    <div className="min-h-screen bg-landing-bg font-body text-primary" dir="rtl">
      <div className="mx-auto max-w-3xl px-6 py-12">
        <Link to="/" className="flex items-center gap-2 mb-8">
          <Logo size={32} />
          <span className="font-heading font-semibold text-lg">PowerCare</span>
        </Link>
        <h1 className="font-heading text-3xl mb-6">شروط الاستخدام — Terms of Service</h1>
        <div className="space-y-4 text-sm leading-relaxed text-[#3a2f22]/80">
          <p>آخر تحديث: 14 يوليو 2026</p>
          <h2 className="font-heading text-xl text-[#3a2f22] pt-2">الخدمة</h2>
          <p>PowerCare منصة لإدارة الموارد البشرية والحضور والمهام للشركات. باستخدامك للمنصة فأنت توافق على هذه الشروط.</p>
          <h2 className="font-heading text-xl text-[#3a2f22] pt-2">الحسابات والاشتراكات</h2>
          <p>مالك الشركة مسؤول عن دقة البيانات المُدخلة وعن إدارة صلاحيات موظفيه. تُقدَّم الخدمة وفق خطة الاشتراك المختارة، ويمكن الترقية أو الإلغاء في أي وقت.</p>
          <h2 className="font-heading text-xl text-[#3a2f22] pt-2">الاستخدام المقبول</h2>
          <p>يُمنع استخدام المنصة لأي غرض غير قانوني، أو محاولة الوصول إلى بيانات شركات أخرى، أو إساءة استخدام أنظمة البلاغات.</p>
          <h2 className="font-heading text-xl text-[#3a2f22] pt-2">المسؤولية</h2>
          <p>نبذل جهدنا لتوفير الخدمة بشكل مستمر وآمن، دون ضمان خلوها التام من الانقطاعات. مسؤوليتنا محدودة بقيمة الاشتراك المدفوع.</p>
          <h2 className="font-heading text-xl text-[#3a2f22] pt-2">التواصل</h2>
          <p>للاستفسارات: niyar@powercares.pro — هاتف: 0595414472</p>
          <hr className="border-landing-gold/20" />
          <p className="text-xs text-[#3a2f22]/50">PowerCare is an HR, attendance and task management platform for companies. By using the service you agree to these terms. Company owners are responsible for the accuracy of entered data. Unlawful use or attempts to access other companies' data are prohibited. Liability is limited to the paid subscription amount. Contact: niyar@powercares.pro</p>
        </div>
      </div>
    </div>
  );
}