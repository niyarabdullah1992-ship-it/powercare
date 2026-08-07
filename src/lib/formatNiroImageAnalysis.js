export default function formatNiroImageAnalysis(report, ar) {
  const findings = (report?.requiredChecks || []).map((item) => `- **${item.label}:** ${item.evidence}`).join("\n");
  const risks = (report?.riskNotes || []).map((item) => `- ${item}`).join("\n");
  const missing = (report?.missingItems || []).map((item) => `- ${item}`).join("\n");
  return [
    `**${report?.documentType || (ar ? "تحليل الصورة" : "Image analysis")}**`,
    report?.summary,
    findings && `**${ar ? "النتائج المرئية" : "Visual findings"}**\n${findings}`,
    risks && `**${ar ? "المخاطر والملاحظات" : "Risks and observations"}**\n${risks}`,
    missing && `**${ar ? "معلومات غير واضحة" : "Unclear information"}**\n${missing}`,
  ].filter(Boolean).join("\n\n");
}