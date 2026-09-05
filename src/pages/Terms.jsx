import React from "react";
import { Link } from "react-router-dom";
import IdentityCard from "@/components/shared/IdentityCard";
import PublicPaperShell, { legalCopy } from "@/components/shared/PublicPaperShell";
import { NAVY } from "@/lib/platformStyles";

export default function Terms() {
  return (
    <PublicPaperShell>
      <IdentityCard title="شروط الاستخدام — Terms of Service" dir="rtl" bodySurface>
        <div style={legalCopy.wrap}>
          <p style={{ margin: 0 }}>آخر تحديث: 27 يوليو 2026</p>
          <h2 style={legalCopy.h2}>الخدمة</h2>
          <p style={{ margin: 0 }}>NiroVera منصة لإدارة الموارد البشرية والحضور والمهام للشركات. باستخدامك للمنصة فأنت توافق على هذه الشروط.</p>
          <h2 style={legalCopy.h2}>الحسابات والاشتراكات</h2>
          <p style={{ margin: 0 }}>مالك الشركة مسؤول عن دقة البيانات المُدخلة وعن إدارة صلاحيات موظفيه. تُقدَّم الخدمة وفق خطة الاشتراك المختارة، ويمكن الترقية أو الإلغاء في أي وقت.</p>
          <h2 style={legalCopy.h2}>الدفع والإلغاء والاسترجاع</h2>
          <p style={{ margin: 0 }}>تظهر أسعار الاشتراكات ومددها بوضوح في صفحة الباقات قبل إتمام الطلب. يمكن إلغاء التجديد في أي وقت، وتخضع طلبات الاسترداد إلى <Link to="/refund-policy" style={{ color: NAVY, textDecoration: "underline" }}>سياسة الاسترجاع والاسترداد</Link> المنشورة، والتي تتيح طلب استرداد أول دفعة خلال ثلاثة أيام من الدفع.</p>
          <h2 style={legalCopy.h2}>الاستخدام المقبول</h2>
          <p style={{ margin: 0 }}>يُمنع استخدام المنصة لأي غرض غير قانوني، أو محاولة الوصول إلى بيانات شركات أخرى، أو إساءة استخدام أنظمة البلاغات.</p>
          <h2 style={legalCopy.h2}>المسؤولية</h2>
          <p style={{ margin: 0 }}>نبذل جهدنا لتوفير الخدمة بشكل مستمر وآمن، دون ضمان خلوها التام من الانقطاعات. مسؤوليتنا محدودة بقيمة الاشتراك المدفوع.</p>
          <h2 style={legalCopy.h2}>التواصل</h2>
          <p style={{ margin: 0 }}>للاستفسارات: niyar@powercares.pro — هاتف: 0595414472</p>
          <hr style={legalCopy.hr} />
          <p style={legalCopy.en}>NiroVera is an HR, attendance and task management platform for companies. By using the service you agree to these terms. Company owners are responsible for the accuracy of entered data. Unlawful use or attempts to access other companies' data are prohibited. Liability is limited to the paid subscription amount. Contact: niyar@powercares.pro</p>
        </div>
      </IdentityCard>
    </PublicPaperShell>
  );
}
