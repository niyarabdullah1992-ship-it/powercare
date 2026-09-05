import React from "react";
import IdentityCard from "@/components/shared/IdentityCard";
import { MUTED } from "@/lib/platformStyles";

export default function SecurityFeatureCard({ icon, title, text, dir }) {
  return (
    <IdentityCard icon={icon} title={title} dir={dir} bodySurface>
      <p style={{ margin: 0, fontSize: 13, lineHeight: 1.65, color: MUTED }}>{text}</p>
    </IdentityCard>
  );
}
