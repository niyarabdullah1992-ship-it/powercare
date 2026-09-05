import { ALL_PLANS_CURRENTLY_FREE } from "@/lib/pricingPolicy";

import { normalizePlanConfig } from "@/lib/subscriptionPlans";

export function getPlanLimits(planOrCompany) {
  const company = typeof planOrCompany === "object" ? planOrCompany : { plan: planOrCompany };
  const config = normalizePlanConfig(company.planConfig || { slug: String(company.plan || "free").toLowerCase() });
  return { stations: config.maxStations, employees: config.maxEmployees };
}

function effectivePlan(company) {
  if (ALL_PLANS_CURRENTLY_FREE || !company?.subscriptionEnd) return company?.plan;
  const rawEnd = String(company.subscriptionEnd);
  const expiresAt = new Date(/^\d{4}-\d{2}-\d{2}$/.test(rawEnd) ? `${rawEnd}T23:59:59.999` : rawEnd).getTime();
  return Number.isFinite(expiresAt) && Date.now() > expiresAt ? "free" : company.plan;
}

export function canAddStation(company, data) {
  const plan = effectivePlan(company);
  const limit = getPlanLimits(plan === company?.plan ? company : plan).stations;
  if (limit == null) return true;
  return (data?.stations?.length || 0) < limit;
}

export function canAddEmployee(company, data) {
  const plan = effectivePlan(company);
  const limit = getPlanLimits(plan === company?.plan ? company : plan).employees;
  if (limit == null) return true;
  return (data?.employees?.length || 0) < limit;
}