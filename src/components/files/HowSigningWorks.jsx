import React from "react";
import { ShieldCheck, Fingerprint, QrCode, FileWarning } from "lucide-react";
import SigningPanel from "./SigningPanel";
import { MUTED, NAVY, BORDER, SURFACE } from "@/lib/platformStyles";

export default function HowSigningWorks({ ar }) {
  const steps = ar
    ? [
        { icon: Fingerprint, title: "بصمة الختم", text: "الختم يحمل رمز إصبع تقني مشتق من الرقم المشفّر، وليس بصمة حيوية أو نفاذ." },
        { icon: QrCode, title: "QR ورقم مشفّر", text: "كل ختم يحمل رمز QR ورقمًا PWC يمكن مسحه أو نسخه للتحقق دون كشف بيانات زائدة." },
        { icon: ShieldCheck, title: "تحقق لأي جهة", text: "ارفع الملف أو أدخل المعرّف: تطابق البصمة يعني أن النسخة لم تُعدَّل بعد التوقيع." },
        { icon: FileWarning, title: "كشف التلاعب", text: "نسخ الختم على ملف آخر أو تغيير حرف واحد يغيّر البصمة ويظهر عدم التطابق فورًا." },
      ]
    : [
        { icon: Fingerprint, title: "Seal fingerprint", text: "The stamp carries a technical finger mark derived from the encrypted id — not a biometric scan or Nafath." },
        { icon: QrCode, title: "QR and encrypted id", text: "Every stamp carries a QR code and a PWC serial that can be scanned or copied without extra disclosure." },
        { icon: ShieldCheck, title: "Anyone can verify", text: "Upload the file or enter the id: a matching fingerprint means the copy was not altered after signing." },
        { icon: FileWarning, title: "Tamper detection", text: "Copying the seal onto another file or changing a single character fails verification immediately." },
      ];

  return (
    <SigningPanel icon={ShieldCheck} title={ar ? "كيف يُحفظ التوقيع ويُكشف التلاعب؟" : "How is the signature kept and tampering detected?"}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 8 }}>
        {steps.map((s) => {
          const Icon = s.icon;
          return (
          <div key={s.title} style={{
            display: "flex",
            gap: 10,
            padding: 12,
            borderRadius: 10,
            background: SURFACE,
            border: `1px solid ${BORDER}`,
          }}>
            <Icon style={{ width: 16, height: 16, color: NAVY, flexShrink: 0, marginTop: 2 }} />
            <div>
              <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: NAVY }}>{s.title}</p>
              <p style={{ margin: "4px 0 0", fontSize: 11, color: MUTED, lineHeight: 1.6 }}>{s.text}</p>
            </div>
          </div>
          );
        })}
      </div>
      <p style={{ margin: "10px 0 0", fontSize: 11, color: MUTED, lineHeight: 1.6 }}>
        {ar
          ? "يُعتمد التحقق من السجل لا شكل الختم. هذا سجل إلكتروني داخل المنشأة، وليس شهادة رقمية مؤهلة صادرة عن مركز تصديق مرخّص."
          : "Trust the registry result, not the stamp’s look. This is an in-company electronic record, not a qualified certificate issued by a licensed CSP."}
      </p>
    </SigningPanel>
  );
}
