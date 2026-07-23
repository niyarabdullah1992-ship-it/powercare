const nodeDepth = (node, byId, seen = new Set()) => {
  if (!node?.parentId || seen.has(node.id)) return 0;
  seen.add(node.id);
  return 1 + nodeDepth(byId.get(node.parentId), byId, seen);
};

export default function orgVisualLayout(nodes) {
  const byId = new Map(nodes.map((node) => [node.id, node]));
  const levels = new Map();
  [...nodes].sort((a, b) => a.order - b.order).forEach((node) => {
    const depth = nodeDepth(node, byId);
    levels.set(depth, [...(levels.get(depth) || []), node]);
  });
  const positions = {};
  levels.forEach((level, depth) => level.forEach((node, index) => {
    positions[node.id] = { x: 320 + index * 280, y: 200 + depth * 160 };
  }));
  return positions;
}