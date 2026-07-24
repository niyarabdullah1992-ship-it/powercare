export const DEFAULT_ORG_RANKS = [
  { id: "manager", labels: { en: "Manager", ar: "مدير", de: "Manager", fr: "Responsable", es: "Gerente", pt: "Gerente", ru: "Менеджер", ja: "マネージャー", ko: "관리자" }, icon: "briefcase", color: "navy" },
  { id: "supervisor", labels: { en: "Supervisor", ar: "مشرف", de: "Aufsicht", fr: "Superviseur", es: "Supervisor", pt: "Supervisor", ru: "Супервайзер", ja: "スーパーバイザー", ko: "슈퍼바이저" }, icon: "star", color: "ivory" },
  { id: "lead", labels: { en: "Team lead", ar: "قائد فريق", de: "Teamleiter", fr: "Chef d’équipe", es: "Líder de equipo", pt: "Líder de equipe", ru: "Руководитель команды", ja: "チームリーダー", ko: "팀 리더" }, icon: "shield", color: "blue" },
];

export const getOrgRanks = (value) => {
  const ranks = Array.isArray(value) ? value : value?.orgRanks;
  return Array.isArray(ranks) && ranks.length ? ranks.map((rank) => rank.id === "manager" && rank.icon === "crown" ? { ...rank, icon: "briefcase" } : rank) : DEFAULT_ORG_RANKS;
};

export function getOrgRankLabel(rank, lang = "en") {
  const standard = DEFAULT_ORG_RANKS.find((item) => item.id === rank?.id);
  return rank?.labels?.[lang] || (lang === "ar" ? rank?.labelAr : null) || standard?.labels?.[lang] || (lang === "en" ? rank?.labelEn : null) || rank?.labels?.en || rank?.labelEn || rank?.labelAr || rank?.id || "";
}

export function resolveRank(node, nodes = [], configuredRanks) {
  if (!node || node.type !== "employee") return null;
  const ranks = getOrgRanks(configuredRanks);
  if (ranks.some((rank) => rank.id === node.rank)) return node.rank;
  const byId = new Map(nodes.map((item) => [item.id, item]));
  const visited = new Set([node.id]);
  let depth = 0;
  let cursor = node;
  while (cursor?.parentId && !visited.has(cursor.parentId)) {
    visited.add(cursor.parentId);
    cursor = byId.get(cursor.parentId);
    depth += 1;
    if (cursor?.type === "station") break;
  }
  if (!depth) return null;
  return ranks[Math.min(depth - 1, ranks.length - 1)]?.id || null;
}

export function getOrgRankDefinition(ranks, rankId) {
  const list = getOrgRanks(ranks);
  const index = list.findIndex((rank) => rank.id === rankId);
  return index < 0 ? null : { ...list[index], index };
}