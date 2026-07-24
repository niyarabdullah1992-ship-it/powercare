import { Award, Briefcase, Crown, Gem, ShieldCheck, Star, Users } from "lucide-react";

export const ORG_RANK_ICON_OPTIONS = ["crown", "star", "shield", "award", "users", "briefcase", "gem"];
export const ORG_RANK_COLOR_OPTIONS = ["navy", "gold", "ivory", "teal", "blue", "sand"];

const icons = { crown: Crown, star: Star, shield: ShieldCheck, award: Award, users: Users, briefcase: Briefcase, gem: Gem };
const colors = {
  navy: { card: "border-2 border-accent bg-primary text-primary-foreground shadow-elevated", badge: "border-accent bg-card text-accent", muted: "text-primary-foreground/65", swatch: "bg-primary" },
  gold: { card: "border-2 border-primary bg-accent text-accent-foreground shadow-elevated", badge: "border-primary bg-card text-primary", muted: "text-accent-foreground/70", swatch: "bg-accent" },
  ivory: { card: "border-2 border-accent bg-card text-foreground shadow-elevated", badge: "border-accent bg-card text-accent", muted: "text-muted-foreground", swatch: "bg-card" },
  teal: { card: "border-2 border-executive-line bg-executive-teal text-primary-foreground shadow-elevated", badge: "border-executive-line bg-card text-executive-teal", muted: "text-primary-foreground/70", swatch: "bg-executive-teal" },
  blue: { card: "border-2 border-executive-line bg-executive-panel text-executive-ink shadow-md", badge: "border-executive-line bg-card text-executive-teal", muted: "text-executive-ink/65", swatch: "bg-executive-panel" },
  sand: { card: "border-2 border-accent/60 bg-secondary text-secondary-foreground shadow-md", badge: "border-accent bg-card text-accent", muted: "text-muted-foreground", swatch: "bg-secondary" },
};

export function getOrgRankVisual(rank) {
  return { Icon: icons[rank?.icon] || ShieldCheck, ...(colors[rank?.color] || colors.ivory) };
}