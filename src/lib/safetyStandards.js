export const CHECKLIST_GROUPS = [
  { id: "iso", ar: "ISO 45001", en: "ISO 45001", items: [
    ["iso_policy", "سياسة السلامة موثقة ومعلنة", "Safety policy is documented and communicated"],
    ["iso_roles", "المسؤوليات والصلاحيات محددة", "HSE roles and responsibilities are defined"],
    ["iso_risks", "تقييم المخاطر محدث", "Risk assessment is current"],
    ["iso_legal", "المتطلبات القانونية محددة", "Legal requirements are identified"],
    ["iso_training", "التدريب والكفاءة موثقان", "Training and competence are documented"],
    ["iso_consult", "مشاركة العاملين وتشاورتهم مفعلة", "Worker consultation and participation are active"],
    ["iso_control", "ضوابط التشغيل مطبقة", "Operational controls are implemented"],
    ["iso_emergency", "خطط الطوارئ مختبرة", "Emergency plans are tested"],
    ["iso_incidents", "الحوادث والإجراءات التصحيحية موثقة", "Incidents and corrective actions are recorded"],
    ["iso_audit", "التدقيق والمراجعة الإدارية مكتملان", "Audit and management review are complete"],
  ]},
  { id: "nfpa", ar: "NFPA / الإطفاء والإخلاء", en: "NFPA / Fire & Evacuation", items: [
    ["nfpa_ext", "طفايات الحريق متاحة وصالحة", "Fire extinguishers are accessible and inspected"],
    ["nfpa_alarm", "نظام الإنذار يعمل وتم اختباره", "Fire alarm system is operational and tested"],
    ["nfpa_exit", "مخارج الطوارئ واضحة وغير معاقة", "Emergency exits are marked and unobstructed"],
    ["nfpa_route", "مسارات الإخلاء معلقة ومحدثة", "Evacuation routes are posted and current"],
    ["nfpa_light", "إنارة الطوارئ تعمل", "Emergency lighting is operational"],
    ["nfpa_drill", "تم تنفيذ تمرين إخلاء دوري", "A periodic evacuation drill was completed"],
    ["nfpa_storage", "تخزين المواد القابلة للاشتعال آمن", "Flammable materials are stored safely"],
    ["nfpa_team", "فريق الطوارئ محدد ومدرب", "Emergency response team is assigned and trained"],
  ]},
];

export const PERMIT_TYPES = [
  ["excavation", "حفر", "Excavation"], ["height", "عمل على ارتفاع", "Work at Height"],
  ["electrical", "أعمال كهربائية", "Electrical"], ["confined", "أماكن محصورة", "Confined Space"],
  ["hot", "أعمال ساخنة / حريق", "Hot Work / Fire"],
];

export const PERMIT_REQUIREMENTS = [
  ["ppe", "معدات الوقاية الشخصية", "Required PPE"], ["isolation", "العزل وتأمين الطاقة", "Isolation / LOTO"],
  ["gas", "فحص الغازات", "Gas testing"], ["barricade", "حواجز ومنطقة آمنة", "Barricades and safe zone"],
  ["firewatch", "مراقب حريق", "Fire watch"], ["rescue", "خطة إنقاذ", "Rescue plan"],
];

export const riskTone = (score) => score <= 4 ? "bg-emerald-100 text-emerald-800" : score <= 9 ? "bg-yellow-100 text-yellow-800" : score <= 16 ? "bg-orange-100 text-orange-800" : "bg-red-100 text-red-800";

export function checklistCompliance(results = {}) {
  const standard = CHECKLIST_GROUPS.flatMap((group) => group.items.map(([id]) => id));
  const custom = Object.keys(results).filter((id) => id.startsWith("custom_"));
  const ids = [...standard, ...custom];
  const yes = ids.filter((id) => results[id]?.status === "yes").length;
  return ids.length ? Math.round((yes / ids.length) * 100) : 0;
}

export function safetyKpis(rec = {}) {
  const hours = Number(rec.workHoursMonthly) || 0;
  const month = new Date().toISOString().slice(0, 7);
  const loggedIncidents = (rec.incidentLog || []).filter((item) => String(item.at || "").slice(0, 7) === month).length;
  const lti = Number(rec.ltiCount) || 0;
  // Every lost-time injury is recordable. Use the larger count because logged
  // incidents may already include the same LTI cases and must not be doubled.
  const incidents = Math.max(loggedIncidents, lti);
  const last = [...(rec.incidentLog || [])].filter((item) => item.at).sort((a, b) => new Date(b.at) - new Date(a.at))[0]?.at || rec.lastIncidentAt || rec.createdAt;
  const days = last ? Math.max(0, Math.floor((Date.now() - new Date(last).getTime()) / 86400000)) : 0;
  return { incidents, trir: hours ? (incidents * 200000) / hours : 0, ltifr: hours ? (lti * 1000000) / hours : 0, days };
}