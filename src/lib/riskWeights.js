// Configurable risk weights for the Command Center stability score.
// Owners can override these per-company (stored in data.settings.riskWeights).
export const DEFAULT_RISK_WEIGHTS = {
  absent: 8,        // absent employee today
  delayed: 12,      // delayed / due-soon task
  stoppage: 18,     // task stoppage issue
  reports: 4,       // pending daily report
  critical: 20,     // critical (red) safety station
  incidents: 15,    // safety incident in last 30 days
  hazards: 6,       // open safety hazard
};

export function getRiskWeights(data) {
  return { ...DEFAULT_RISK_WEIGHTS, ...(data?.settings?.riskWeights || {}) };
}