import React from "react";
import { Check, MapPin, Radio } from "lucide-react";

export default function FieldScene() {
  return (
    <div className="ad-content">
      <p className="ad-eyebrow">من قلب الميدان</p>
      <h2>حضور موثّق.<br />في اللحظة ذاتها.</h2>
      <div className="field-map">
        <div className="map-rings"><MapPin /></div>
        <div className="field-phone">
          <Radio /><strong>داخل نطاق العمل</strong><small>الرياض · المحطة الرئيسية</small>
          <span><Check /> تم تسجيل الحضور</span>
        </div>
        <i className="field-worker one" /><i className="field-worker two" />
      </div>
      <p className="ad-caption">الموقع، الوقت، والفريق — بدقة</p>
    </div>
  );
}