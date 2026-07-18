import React, { useEffect, useState } from "react";

const targets = [248, 12, 99.8];

export default function StatsScene() {
  const [values, setValues] = useState([0, 0, 0]);
  useEffect(() => {
    let step = 0;
    const timer = setInterval(() => {
      step += 1;
      setValues(targets.map((target) => Math.min(target, target * step / 45)));
      if (step === 45) clearInterval(timer);
    }, 42);
    return () => clearInterval(timer);
  }, []);
  return (
    <div className="ad-content stats-scene">
      <p className="ad-eyebrow">أثرٌ يمكن قياسه</p>
      <h2>حين تتحول البيانات<br />إلى قوة.</h2>
      <div className="stats-stack">
        <div><strong>{Math.round(values[0])}+</strong><span>موظفًا تحت إدارة واحدة</span></div>
        <div><strong>{Math.round(values[1])}</strong><span>محطة متصلة لحظيًا</span></div>
        <div><strong>{values[2].toFixed(1)}%</strong><span>دقة في متابعة العمليات</span></div>
      </div>
    </div>
  );
}