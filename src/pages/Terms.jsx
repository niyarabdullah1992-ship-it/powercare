import React from "react";
import { Link } from "react-router-dom";
import Logo from "@/components/Logo";

export default function Terms() {
  return (
    <div className="powercare-public min-h-screen bg-landing-cinema px-4 py-10 font-body" dir="rtl">
      <div className="mx-auto max-w-3xl rounded-2xl border border-accent/20 bg-card px-6 py-10 text-card-foreground shadow-2xl shadow-accent/10 md:px-10">
        <Link to="/" className="flex items-center gap-2 mb-8">
          <Logo size={32} />
          <span className="font-heading font-semibold text-lg">NiroVera</span>
        </Link>
        <h1 className="font-heading text-3xl mb-6">شروط الاستخدام — Terms of Service</h1>
        <div className="space-y-4 text-sm leading-relaxed text-muted-foreground">
          <p>آخر تحديث: 27 يوليو 2026</p>
          <h2 className="font-heading text-xl text-primary pt-2">الخدمة</h2>
          <p>NiroVera منصة لإدارة الموارد البشرية والحضور والمهام للشركات. باستخدامك للمنصة فأنت توافق على هذه الشروط.</p>
          <h2 className="font-heading text-xl text-primary pt-2">الحسابات والاشتراكات</h2>
          <p>مالك الشركة مسؤول عن دقة البيانات المُدخلة وعن إدارة صلاحيات موظفيه. تُقدَّم الخدمة وفق خطة الاشتراك المختارة، ويمكن الترقية أو الإلغاء في أي وقت.</p>
          <h2 className="font-heading text-xl text-primary pt-2">الدفع والإلغاء والاسترجاع</h2>
          <p>تظهر أسعار الاشتراكات ومددها بوضوح في صفحة الباقات قبل إتمام الطلب. يمكن إلغاء التجديد في أي وقت، وتخضع طلبات الاسترداد إلى <Link to="/refund-policy" className="text-accent underline">سياسة الاسترجاع والاسترداد</Link> المنشورة، والتي تتيح طلب استرداد أول دفعة خلال ثلاثة أيام من الدفع.</p>
          <h2 className="font-heading text-xl text-primary pt-2">الاستخدام المقبول</h2>
          <p>يُمنع استخدام المنصة لأي غرض غير قانوني، أو محاولة الوصول إلى بيانات شركات أخرى، أو إساءة استخدام أنظمة البلاغات.</p>
          <h2 className="font-heading text-xl text-primary pt-2">المسؤولية</h2>
          <p>نبذل جهدنا لتوفير الخدمة بشكل مستمر وآمن، دون ضمان خلوها التام من الانقطاعات. مسؤوليتنا محدودة بقيمة الاشتراك المدفوع.</p>
          <h2 className="font-heading text-xl text-primary pt-2">التواصل</h2>
          <p>للاستفسارات: niyar@powercares.pro — هاتف: 0595414472</p>
          <hr className="border-landing-gold/20" />
          <p className="text-xs text-muted-foreground">NiroVera is an HR, attendance and task management platform for companies. By using the service you agree to these terms. Company owners are responsible for the accuracy of entered data. Unlawful use or attempts to access other companies' data are prohibited. Liability is limited to the paid subscription amount. Contact: niyar@powercares.pro</p>
        </div>
      </div>
    </div>
  );
}