// Effort weight (×1..×5): how heavy a task is, not how many tasks there are.
// The weight is fixed BEFORE work starts, points = priority value × weight, and
// points are only granted after the evidence is approved.

export const EFFORT_WEIGHT_LABELS = {
  1: { ar: "روتيني", en: "Routine" },
  2: { ar: "إدخال/متابعة", en: "Data & follow-up" },
  3: { ar: "تشغيلي", en: "Operational" },
  4: { ar: "فني/صيانة", en: "Technical / maintenance" },
  5: { ar: "حرج/عميل", en: "Critical / client" },
};

// Default suggestion derived from the assignee's job title — the manager can
// still override it, but the suggestion keeps weights consistent across stations.
const TITLE_RULES = [
  { weight: 5, match: /مدير|رئيس|سلامة|طوارئ|عميل|manager|director|safety|emergency|client/i },
  { weight: 4, match: /مهندس|فني أول|صيانة|كهرب|ميكانيك|engineer|senior tech|maintenance|electric|mechanic/i },
  { weight: 3, match: /فني|مشغل|تشغيل|technician|operator/i },
  { weight: 2, match: /مساعد|إداري|تقارير|مدخل|assistant|admin|clerk|report/i },
];

export function suggestEffortWeight(jobTitle) {
  const title = String(jobTitle || "");
  for (const rule of TITLE_RULES) if (rule.match.test(title)) return rule.weight;
  return 1;
}