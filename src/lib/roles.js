// Company-customizable role labels — the underlying role still drives permissions,
// but the displayed label can be renamed by the director per company.

export const SYSTEM_ROLES = ["director", "ops_manager", "pgm", "station_manager", "employee"];

export function getRoleLabel(company, role, t) {
  const custom = company?.roleLabels?.[role];
  return (custom && custom.trim()) || t(role);
}