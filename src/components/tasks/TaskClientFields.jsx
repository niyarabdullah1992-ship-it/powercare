import React from "react";
import { Briefcase } from "lucide-react";

// بيانات العميل المكلِّف بالعمل الميداني — تُخزَّن مع المهمة وتُستخدم لإصدار إثبات العميل.
export default function TaskClientFields({ lang, defaults = {} }) {
  const ar = lang === "ar";
  const field = (name, label, placeholder, type = "text") => (
    <div>
      <label className="mb-1.5 block text-xs font-semibold text-foreground">{label}</label>
      <input
        name={name}
        type={type}
        defaultValue={defaults[name] || ""}
        placeholder={placeholder}
        className="w-full rounded-lg border border-input px-3 py-2.5 text-sm font-body focus:border-accent focus:ring-1 focus:ring-accent"
      />
    </div>
  );

  return (
    <div className="space-y-3 rounded-lg border border-accent/30 bg-secondary/40 p-3.5">
      <p className="flex items-center gap-1.5 text-xs uppercase tracking-wider text-accent">
        <Briefcase className="h-3.5 w-3.5" /> {ar ? "العميل المكلِّف (اختياري)" : "Client commissioning the work (optional)"}
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        {field("clientCompany", ar ? "اسم شركة العميل" : "Client company", ar ? "مثال: شركة أكوا باور" : "e.g. ACWA Power")}
        {field("clientProject", ar ? "المشروع / العقد" : "Project / contract", ar ? "رقم أو اسم العقد" : "Contract name or number")}
        {field("clientContact", ar ? "مسؤول التواصل لدى العميل" : "Client contact person", ar ? "الاسم والمسمى" : "Name and title")}
        {field("clientPhone", ar ? "هاتف أو بريد المسؤول" : "Contact phone or email", "05xxxxxxxx")}
      </div>
      <p className="text-[10px] text-muted-foreground">
        {ar ? "تُستخدم هذه البيانات لفلترة المهام وإصدار إثبات العمل للعميل، ولا تُرسل له بيانات فريقك أو تكاليفك." : "Used to group tasks and issue the client work proof — your team data and costs are never sent."}
      </p>
    </div>
  );
}