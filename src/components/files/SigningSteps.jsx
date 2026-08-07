import React from "react";
import { Check, FileSignature, Upload } from "lucide-react";

export default function SigningSteps({ ar }) {
  const steps = ar
    ? [
        { icon: Check, title: "احفظ نوع التوقيع", text: "اكتب اسمك، اختر شكل التوقيع، ثم اضغط حفظ التوقيع." },
        { icon: Upload, title: "ارفع الملف", text: "اختر ملف PDF ثم ضع حقول التوقيع والنص في أماكنها." },
        { icon: FileSignature, title: "وقّع الوثيقة", text: "اضغط توقيع الوثيقة لتنزيل الملف الموقّع والموثّق." },
      ]
    : [
        { icon: Check, title: "Save your signature", text: "Enter your name, choose a signature style, then select Save signature." },
        { icon: Upload, title: "Upload the file", text: "Choose a PDF, then place signature and text fields where needed." },
        { icon: FileSignature, title: "Sign the document", text: "Select Sign document to create your verified signed file." },
      ];

  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {steps.map((step, index) => (
        <div key={step.title} className="flex gap-3 rounded-xl border border-border bg-card p-4">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground text-sm font-semibold">{index + 1}</div>
          <div>
            <div className="flex items-center gap-1.5"><step.icon className="h-4 w-4 text-accent" /><p className="text-sm font-semibold">{step.title}</p></div>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{step.text}</p>
          </div>
        </div>
      ))}
    </div>
  );
}