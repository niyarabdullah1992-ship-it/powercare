// Plan limits — mirrors what each pricing tier advertises on the Pricing page.
// null = unlimited.
const PLAN_LIMITS = {
  free: { stations: 1, employees: 5 },
  starter: { stations: 5, employees: 30 },
  professional: { stations: null, employees: null },
  enterprise: { stations: null, employees: null },
};

export function getPlanLimits(plan) {
  const key = String(plan || "starter").toLowerCase();
  return PLAN_LIMITS[key] || PLAN_LIMITS.starter;
}

export function canAddStation(company, data) {
  const limit = getPlanLimits(company?.plan).stations;
  if (limit == null) return true;
  return (data?.stations?.length || 0) < limit;
}

export function canAddEmployee(company, data) {
  const limit = getPlanLimits(company?.plan).employees;
  if (limit == null) return true;
  return (data?.employees?.length || 0) < limit;
}