import React from "react";
import { BarChart3, Users, Activity } from "lucide-react";

export default function OfficeScene() {
  return (
    <div className="ad-content">
      <p className="ad-eyebrow">مركز قيادة واحد</p>
      <h2>الصورة الكاملة.<br />أمامك الآن.</h2>
      <div className="office-desk">
        <div className="office-screen">
          <div className="screen-top"><span /><span /><span /></div>
          <div className="screen-kpis">
            <i><Users /> 248</i><i><Activity /> 96%</i><i><BarChart3 /> +18%</i>
          </div>
          <div className="screen-chart">{[42,68,54,82,72,94].map((height, i) => <b key={i} style={{height: `${height}%`}} />)}</div>
        </div>
        <div className="office-people"><i /><i /><i /></div>
      </div>
      <p className="ad-caption">قرارات أوضح، وعمليات أكثر انسيابية</p>
    </div>
  );
}