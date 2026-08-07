// Builds the "from my seat to the top of the pyramid" ladder for one employee,
// walking the company org tree upward from their own node to the root.
export function buildManagementChain(data, employeeId) {
  const nodes = data?.orgTree || [];
  const employees = data?.employees || [];
  const stations = data?.stations || [];
  const positions = data?.smartPositions || [];

  const titleFor = (refId) => positions.find((item) => item.employeeId === refId)?.title || "";
  const directReports = (nodeId) => nodes.filter((item) => item.parentId === nodeId).length;

  const path = [];
  let node = nodes.find((item) => item.type === "employee" && item.refId === employeeId);
  while (node) {
    path.push(node);
    node = node.parentId ? nodes.find((item) => item.id === node.parentId) : null;
  }

  return path.reverse().map((item, index) => {
    const isMe = item.type === "employee" && item.refId === employeeId;
    const under = directReports(item.id);
    if (item.type === "station") {
      const station = stations.find((s) => s.id === item.refId);
      return {
        id: item.id,
        type: "station",
        name: station?.name || item.title || "—",
        meta: station?.location || item.title || "",
      };
    }
    const employee = employees.find((e) => e.id === item.refId);
    return {
      id: item.id,
      type: "employee",
      name: employee?.name || "—",
      role: item.title || titleFor(item.refId) || employee?.role || "",
      isMe,
      isTop: index === 0,
      chip: isMe ? null : under ? String(under) : null,
    };
  });
}