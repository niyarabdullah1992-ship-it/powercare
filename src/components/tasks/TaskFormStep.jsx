import React from "react";

// يحتفظ بحقول كل مرحلة داخل النموذج (مخفية بصرياً فقط) حتى لا تفقد قيمها عند التنقل.
export default function TaskFormStep({ index, active, children }) {
  return (
    <div className={index === active ? "space-y-5" : "hidden"} aria-hidden={index !== active}>
      {children}
    </div>
  );
}