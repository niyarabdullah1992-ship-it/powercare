// Plan limits — mirrors what each pricing tier advertises on the Pricing page.
// null = unlimited.
const PLAN_LIMITS = {
  free: { stations: 1, employees: 5 },
  starter: { stations: 5, employees: 30 },
  professional: { stations: null, employees: null },
  enterprise: { stations: null, employees: null },
  custom: { stations: null, employees: null },
  individual: { stations: null, employees: null },
};

export function getPlanLimits(plan) {
  const key = String(plan || "free").toLowerCase();
  return PLAN_LIMITS[key] || PLAN_LIMITS.free;
}

function effectivePlan(company) {
  if (!company?.subscriptionEnd) return company?.plan;
  const rawEnd = String(company.subscriptionEnd);
  const expiresAt = new Date(/^\d{4}-\d{2}-\d{2}$/.test(rawEnd) ? `${rawEnd}T23:59:59.999` : rawEnd).getTime();
  return Number.isFinite(expiresAt) && Date.now() > expiresAt ? "free" : company.plan;
}

export function canAddStation(company, data) {
  const limit = getPlanLimits(effectivePlan(company)).stations;
  if (limit == null) return true;
  return (data?.stations?.length || 0) < limit;
}

export function canAddEmployee(company, data) {
  const limit = getPlanLimits(effectivePlan(company)).employees;
  if (limit == null) return true;
  return (data?.employees?.length || 0) < limit;
}