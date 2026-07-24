export const ORG_RANKS = ["manager", "supervisor", "lead"];

export function resolveRank(node, nodes = []) {
  if (!node || node.type !== "employee") return null;
  if (ORG_RANKS.includes(node.rank)) return node.rank;
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
  if (depth === 1) return "manager";
  if (depth === 2) return "supervisor";
  if (depth >= 3) return "lead";
  return null;
}