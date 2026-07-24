const renumber = (nodes, parentId) => {
  nodes.filter((node) => (node.parentId || null) === (parentId || null)).sort((a, b) => a.order - b.order).forEach((node, index) => { node.order = index; });
};

export function positionStationManager(data, employeeId, stationIds) {
  const nodes = data.orgTree || [];
  const manager = nodes.find((node) => node.type === "employee" && node.refId === employeeId);
  const stations = stationIds.map((id) => nodes.find((node) => node.type === "station" && node.refId === id)).filter(Boolean);
  if (!manager || !stations.length) return;

  const oldParents = new Set([manager.parentId || null, ...stations.map((node) => node.parentId || null)]);
  if (stations.length === 1) {
    manager.parentId = stations[0].id;
    manager.order = nodes.filter((node) => node.id !== manager.id && node.parentId === stations[0].id).length;
  } else {
    const parentIds = stations.map((node) => node.parentId || null);
    const commonParent = parentIds.every((id) => id === parentIds[0]) ? (parentIds[0] === manager.id ? manager.parentId || null : parentIds[0]) : null;
    manager.parentId = commonParent;
    manager.order = Math.min(...stations.map((node) => node.order || 0));
    stations.forEach((station, index) => { station.parentId = manager.id; station.order = index; });
    renumber(nodes, manager.id);
  }
  oldParents.forEach((parentId) => renumber(nodes, parentId));
  renumber(nodes, manager.parentId);
}