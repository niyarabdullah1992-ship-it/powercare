// Points & badges system for NiroVera task gamification.

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

export const DEFAULT_BADGE_THRESHOLDS = {
  badgeRookie: 0,
  badgeContributor: 100,
  badgeAchiever: 300,
  badgeStar: 600,
  badgeChampion: 1000,
};

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

// Resolve badge thresholds (per-company overrides supported via company.badgeThresholds).
export function getBadges(company) {
  const custom = company?.badgeThresholds;
  return BADGES.map((b) => ({
    ...b,
    min: custom && custom[b.key] != null && !Number.isNaN(Number(custom[b.key])) ? Number(custom[b.key]) : b.min,
  }));
}

export function badgeFor(points, badges = BADGES) {
  let badge = badges[0];
  for (const b of badges) if (points >= b.min) badge = b;
  return badge;
}

export function nextBadge(points, badges = BADGES) {
  for (const b of badges) if (b.min > points) return b;
  return null;
}