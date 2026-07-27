import React from "react";
import { Link } from "react-router-dom";
import Logo from "@/components/Logo";

export default function Privacy() {
  return (
    <div className="powercare-public min-h-screen bg-landing-cinema px-4 py-10 font-body" dir="rtl">
      <div className="mx-auto max-w-3xl rounded-2xl border border-accent/20 bg-card px-6 py-10 text-card-foreground shadow-2xl shadow-accent/10 md:px-10">
        <Link to="/" className="flex items-center gap-2 mb-8">
          <Logo size={32} />
          <span className="font-heading font-semibold text-lg">PowerCare</span>
        </Link>
        <h1 className="font-heading text-3xl mb-6">سياسة الخصوصية — Privacy Policy</h1>
        <div className="space-y-4 text-sm leading-relaxed text-muted-foreground">
          <p>آخر تحديث: 27 يوليو 2026</p>
          <h2 className="font-heading text-xl text-primary pt-2">البيانات التي نجمعها</h2>
          <p>تجمع منصة PowerCare البيانات اللازمة لتشغيل الخدمة فقط: بيانات حساب الشركة (الاسم والبريد الإلكتروني)، بيانات الموظفين المُدخلة من قِبل الشركة، وسجلات الحضور والمهام والتقارير. عند استخدام تسجيل الدخول عبر Google أو Microsoft أو Apple، نحصل فقط على معلومات الحساب الأساسية التي يتيحها مزود الخدمة، مثل البريد الإلكتروني والاسم، للتحقق من هويتك وإنشاء جلسة الدخول. لا نحصل على كلمة مرور حسابك لدى أي من هذه الخدمات.</p>
          <h2 className="font-heading text-xl text-primary pt-2">كيف نستخدم البيانات</h2>
          <p>تُستخدم البيانات حصريًا لتقديم خدمات المنصة لشركتك: إدارة الموظفين، الحضور، المهام والتقارير. لا نبيع بياناتك ولا نشاركها مع أي طرف ثالث لأغراض تسويقية.</p>
          <h2 className="font-heading text-xl text-primary pt-2">حماية البيانات</h2>
          <p>تُخزن كلمات المرور بصيغة مشفّرة غير قابلة للاسترجاع، وتُعزل بيانات كل شركة عن غيرها بالكامل. يقتصر الوصول إلى بيانات الشركة على مستخدميها المصرح لهم.</p>
          <h2 className="font-heading text-xl text-primary pt-2">حقوقك</h2>
          <p>يمكن لمالك الشركة حذف حساب الشركة وجميع بياناتها نهائيًا في أي وقت من داخل المنصة. للاستفسارات تواصل معنا عبر: niyar@powercares.pro</p>
          <hr className="border-landing-gold/20" />
          <p className="text-xs text-muted-foreground">PowerCare collects only the data required to operate the service (company account, employee records, attendance, tasks and reports). When you sign in with Google, Microsoft, or Apple, we receive only the basic account information made available by the provider, such as your email and name, for identity verification and session creation. We never receive your password for these services, and we never sell or share your data with third parties. Company owners can permanently delete their account and all data at any time. Contact: niyar@powercares.pro</p>
        </div>
      </div>
    </div>
  );
}