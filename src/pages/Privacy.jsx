import React from "react";
import { Link } from "react-router-dom";
import Logo from "@/components/Logo";

export default function Privacy() {
  return (
    <div className="min-h-screen bg-landing-bg font-body text-primary" dir="rtl">
      <div className="mx-auto max-w-3xl px-6 py-12">
        <Link to="/" className="flex items-center gap-2 mb-8">
          <Logo size={32} />
          <span className="font-heading font-semibold text-lg">PowerCare</span>
        </Link>
        <h1 className="font-heading text-3xl mb-6">سياسة الخصوصية — Privacy Policy</h1>
        <div className="space-y-4 text-sm leading-relaxed text-[#3a2f22]/80">
          <p>آخر تحديث: 14 يوليو 2026</p>
          <h2 className="font-heading text-xl text-[#3a2f22] pt-2">البيانات التي نجمعها</h2>
          <p>تجمع منصة PowerCare البيانات اللازمة لتشغيل الخدمة فقط: بيانات حساب الشركة (الاسم والبريد الإلكتروني)، بيانات الموظفين المُدخلة من قِبل الشركة، وسجلات الحضور والمهام والتقارير. عند استخدام تسجيل الدخول عبر Google نحصل فقط على بريدك الإلكتروني واسمك للتحقق من هويتك.</p>
          <h2 className="font-heading text-xl text-[#3a2f22] pt-2">كيف نستخدم البيانات</h2>
          <p>تُستخدم البيانات حصريًا لتقديم خدمات المنصة لشركتك: إدارة الموظفين، الحضور، المهام والتقارير. لا نبيع بياناتك ولا نشاركها مع أي طرف ثالث لأغراض تسويقية.</p>
          <h2 className="font-heading text-xl text-[#3a2f22] pt-2">حماية البيانات</h2>
          <p>تُخزن كلمات المرور بصيغة مشفّرة غير قابلة للاسترجاع، وتُعزل بيانات كل شركة عن غيرها بالكامل. يقتصر الوصول إلى بيانات الشركة على مستخدميها المصرح لهم.</p>
          <h2 className="font-heading text-xl text-[#3a2f22] pt-2">حقوقك</h2>
          <p>يمكن لمالك الشركة حذف حساب الشركة وجميع بياناتها نهائيًا في أي وقت من داخل المنصة. للاستفسارات تواصل معنا عبر: niyar@powercares.pro</p>
          <hr className="border-landing-gold/20" />
          <p className="text-xs text-[#3a2f22]/50">PowerCare collects only the data required to operate the service (company account, employee records, attendance, tasks and reports). Google sign-in provides us only your email and name for identity verification. We never sell or share your data with third parties. Company owners can permanently delete their account and all data at any time. Contact: niyar@powercares.pro</p>
        </div>
      </div>
    </div>
  );
}