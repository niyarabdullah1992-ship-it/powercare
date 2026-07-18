import React from "react";
import { CheckCircle2, FileText, Wallet } from "lucide-react";

export default function PayrollScene() {
  return (
    <div className="ad-content">
      <p className="ad-eyebrow">رواتب بلا تعقيد</p>
      <h2>راجع. اعتمد.<br />وأنجز بثقة.</h2>
      <div className="payroll-card">
        <div><Wallet /><span>مسير رواتب يوليو</span><b>248 موظفًا</b></div>
        {["الراتب الأساسي", "البدلات والمكافآت", "صافي الرواتب"].map((label, i) => (
          <p key={label}><span>{label}</span><strong>{["1,284,000", "186,400", "1,398,750"][i]} ر.س</strong></p>
        ))}
        <button><CheckCircle2 /> تم اعتماد المسير</button>
      </div>
      <div className="floating-file"><FileText /></div>
      <p className="ad-caption">كل تفصيلة مالية، في مكانها الصحيح</p>
    </div>
  );
}