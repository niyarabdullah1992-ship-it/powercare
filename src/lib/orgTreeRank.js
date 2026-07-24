export const DEFAULT_ORG_RANKS = [
  { id: "manager", labelAr: "مدير", labelEn: "Manager", icon: "crown", color: "navy" },
  { id: "supervisor", labelAr: "سوبرفايزر", labelEn: "Supervisor", icon: "star", color: "ivory" },
  { id: "lead", labelAr: "قائد فريق", labelEn: "Team lead", icon: "shield", color: "blue" },
];

export const getOrgRanks = (value) => {
  const ranks = Array.isArray(value) ? value : value?.orgRanks;
  return Array.isArray(ranks) && ranks.length ? ranks : DEFAULT_ORG_RANKS;
};

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