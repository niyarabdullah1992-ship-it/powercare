// Fixed 5-tier global HR hierarchy (SAP-style). Each tier has a Manager (full
// action rights: approve / reject / escalate) and an Assistant (view & audit only).
// IDs are fixed strings so the hierarchy is stable across companies and schema migrations.

const NAMES = {
  1: {
    manager: { en: "Site HR Business Partner", ar: "شريك الموارد البشرية للموقع", de: "Standort-HR-Partner", fr: "Partenaire RH de site", es: "Socio de RH del sitio", pt: "Parceiro de RH do site", ru: "HR-партнёр площадки", ja: "拠点HRビジネスパートナー", ko: "현장 HR 비즈니스 파트너" },
    assistant: { en: "Site HR Assistant", ar: "مساعد الموارد البشرية للموقع", de: "Standort-HR-Assistent", fr: "Assistant RH de site", es: "Asistente de RH del sitio", pt: "Assistente de RH do site", ru: "Ассистент HR площадки", ja: "拠点HRアシスタント", ko: "현장 HR 어시스턴트" },
  },
  2: {
    manager: { en: "Cluster HR Manager", ar: "مدير الموارد البشرية للمجموعة", de: "Cluster-HR-Manager", fr: "Responsable RH de cluster", es: "Gerente de RH de clúster", pt: "Gerente de RH de cluster", ru: "Менеджер HR кластера", ja: "クラスターHRマネージャー", ko: "클러스터 HR 매니저" },
    assistant: { en: "Cluster HR Specialist", ar: "أخصائي الموارد البشرية للمجموعة", de: "Cluster-HR-Spezialist", fr: "Spécialiste RH de cluster", es: "Especialista de RH de clúster", pt: "Especialista de RH de cluster", ru: "Специалист HR кластера", ja: "クラスターHRスペシャリスト", ko: "클러스터 HR 스페셜리스트" },
  },
  3: {
    manager: { en: "Head of HR Operations", ar: "رئيس عمليات الموارد البشرية", de: "Leiter HR-Operations", fr: "Chef des opérations RH", es: "Jefe de Operaciones de RH", pt: "Chefe de Operações de RH", ru: "Руководитель HR-операций", ja: "HRオペレーション責任者", ko: "HR 운영 총괄" },
    assistant: { en: "HR Operations Generalist", ar: "أخصائي عمليات الموارد البشرية", de: "HR-Operations-Generalist", fr: "Généraliste opérations RH", es: "Generalista de Operaciones de RH", pt: "Generalista de Operações de RH", ru: "Специалист по HR-операциям", ja: "HRオペレーションジェネラリスト", ko: "HR 운영 제너럴리스트" },
  },
  4: {
    manager: { en: "Vice President of HR", ar: "نائب رئيس الموارد البشرية", de: "Vizepräsident für HR", fr: "Vice-président RH", es: "Vicepresidente de RH", pt: "Vice-presidente de RH", ru: "Вице-президент по HR", ja: "HR担当副社長", ko: "HR 부사장" },
    assistant: { en: "Senior HR Generalist", ar: "أخصائي موارد بشرية أول", de: "Senior-HR-Generalist", fr: "Généraliste RH senior", es: "Generalista Senior de RH", pt: "Generalista Sênior de RH", ru: "Старший HR-специалист", ja: "シニアHRジェネラリスト", ko: "시니어 HR 제너럴리스트" },
  },
  5: {
    manager: { en: "Chief Human Resources Officer", ar: "الرئيس التنفيذي للموارد البشرية", de: "Chief Human Resources Officer", fr: "Directeur des ressources humaines (CHRO)", es: "Director de Recursos Humanos (CHRO)", pt: "Diretor de Recursos Humanos (CHRO)", ru: "Директор по персоналу (CHRO)", ja: "最高人事責任者（CHRO）", ko: "최고인사책임자(CHRO)" },
    assistant: { en: "Executive HR Assistant", ar: "مساعد تنفيذي للموارد البشرية", de: "Leitender HR-Assistent", fr: "Assistant RH exécutif", es: "Asistente Ejecutivo de RH", pt: "Assistente Executivo de RH", ru: "Исполнительный HR-ассистент", ja: "エグゼクティブHRアシスタント", ko: "임원 HR 어시스턴트" },
  },
};

const NOTES = {
  1: { en: "Manages individual stations locally.", ar: "يدير المحطات الفردية محليًا." },
  2: { en: "Oversees a specific group of stations.", ar: "يشرف على مجموعة محددة من المحطات." },
  3: { en: "Manages company-wide payroll and standards at HQ.", ar: "يدير الرواتب والمعايير على مستوى الشركة في المقر الرئيسي." },
  4: { en: "Handles strategic operations alignment.", ar: "يتولى مواءمة العمليات الاستراتيجية." },
  5: { en: "The ultimate supreme HR authority.", ar: "أعلى سلطة عليا للموارد البشرية." },
};

// tier 1 = single station | tier 2 = cluster (group of stations) | tier 3-5 = company-wide
const SCOPE_BY_TIER = { 1: "station", 2: "cluster", 3: "company", 4: "company", 5: "company" };

export const HR_TIER_COUNT = 5;

export function tierLevelId(tier, role) {
  return `hr_t${tier}_${role}`; // role: "manager" | "assistant"
}

export function tierScope(tier) {
  return SCOPE_BY_TIER[tier];
}

export function tierName(tier, role, lang) {
  return NAMES[tier]?.[role]?.[lang] || NAMES[tier]?.[role]?.en || "";
}

export function tierNote(tier, lang) {
  return NOTES[tier]?.[lang] || NOTES[tier]?.en || "";
}

const MANAGER_PERMISSIONS = ["view_employees", "manage_employees", "view_reports", "manage_leave", "view_safety", "manage_anonymous_reports", "view_anonymous_reports", "manage_payroll"];
const ASSISTANT_PERMISSIONS = ["view_employees", "view_reports", "view_safety", "view_anonymous_reports"];

// The 10 fixed HR levels (5 tiers x manager/assistant). Names are resolved at render
// time via tierName() so they always reflect the current UI language.
export function buildHRLevels() {
  const levels = [];
  for (let tier = 1; tier <= HR_TIER_COUNT; tier++) {
    const scope = SCOPE_BY_TIER[tier];
    levels.push({ id: tierLevelId(tier, "manager"), tier, role: "manager", scope, permissions: MANAGER_PERMISSIONS, maxCount: null });
    levels.push({ id: tierLevelId(tier, "assistant"), tier, role: "assistant", scope, permissions: ASSISTANT_PERMISSIONS, maxCount: null });
  }
  return levels;
}

export function isManagerLevel(level) {
  return level?.role === "manager";
}
export function isAssistantLevel(level) {
  return level?.role === "assistant";
}