// Helpers for positioning shift chips on a 24-hour horizontal timeline.
export function timeToMinutes(t) {
  if (!t) return 0;
  const [h, m] = t.split(":").map(Number);
  return h * 60 + (m || 0);
}

export function minutesToPercent(mins) {
  return (mins / 1440) * 100;
}

export const HOUR_TICKS = [0, 3, 6, 9, 12, 15, 18, 21, 24];