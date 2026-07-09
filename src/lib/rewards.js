// Points & badges system for PowerCare task gamification.

export const PRIORITY_POINTS = {
  urgent: 150,
  high: 100,
  medium: 75,
  low: 50,
};

export const BADGES = [
  { min: 0, key: "badgeRookie", icon: "🌱" },
  { min: 100, key: "badgeContributor", icon: "🟢" },
  { min: 300, key: "badgeAchiever", icon: "⭐" },
  { min: 600, key: "badgeStar", icon: "🌟" },
  { min: 1000, key: "badgeChampion", icon: "🏆" },
];

export function badgeFor(points) {
  let badge = BADGES[0];
  for (const b of BADGES) if (points >= b.min) badge = b;
  return badge;
}

export function nextBadge(points) {
  for (const b of BADGES) if (b.min > points) return b;
  return null;
}