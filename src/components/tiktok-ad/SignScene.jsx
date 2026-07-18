import React from "react";
import { Check, FileSignature, ShieldCheck } from "lucide-react";

export default function SignScene() {
  return (
    <div className="ad-center">
      <div className="sign-document">
        <div className="doc-lines"><i /><i /><i /><i /></div>
        <div className="signature">PowerCare</div>
        <span><FileSignature /> توقيع إلكتروني موثّق</span>
      </div>
      <div className="success-ring"><Check /></div>
      <p className="ad-eyebrow">تم التوقيع بنجاح</p>
      <h2>وثائق آمنة.<br />وإنجاز أسرع.</h2>
      <p className="ad-caption"><ShieldCheck /> تحقق رقمي موثوق من أي مكان</p>
    </div>
  );
}