// Points & badges system for PowerCare task gamification.

export const DEFAULT_PRIORITY_POINTS = {
  urgent: 150,
  high: 100,
  medium: 75,
  low: 50,
};

// Backward-compatible default export
export const PRIORITY_POINTS = { ...DEFAULT_PRIORITY_POINTS };

export const BADGES = [
  { min: 0, key: "badgeRookie", icon: "🌱" },
  { min: 100, key: "badgeContributor", icon: "🟢" },
  { min: 300, key: "badgeAchiever", icon: "⭐" },
  { min: 600, key: "badgeStar", icon: "🌟" },
  { min: 1000, key: "badgeChampion", icon: "🏆" },
];

// Resolve per-company custom point values, falling back to defaults.
export function getPriorityPoints(company, priority) {
  const custom = company?.rewardPoints;
  if (custom && custom[priority] != null && !Number.isNaN(Number(custom[priority]))) {
    return Number(custom[priority]);
  }
  return DEFAULT_PRIORITY_POINTS[priority];
}

export function getPriorityPointsMap(company) {
  const map = {};
  for (const key of Object.keys(DEFAULT_PRIORITY_POINTS)) {
    map[key] = getPriorityPoints(company, key);
  }
  return map;
}

export function badgeFor(points) {
  let badge = BADGES[0];
  for (const b of BADGES) if (points >= b.min) badge = b;
  return badge;
}

export function nextBadge(points) {
  for (const b of BADGES) if (b.min > points) return b;
  return null;
}