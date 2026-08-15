import React from "react";
import IdentityCard from "@/components/shared/IdentityCard";

/** Signing cards use the same navy-rail IdentityCard as payroll, safety, and HR. */
export default function SigningPanel({ title, hint, extra, children, sticky, pad = true, icon, dir }) {
  return (
    <div style={{ position: sticky ? "sticky" : undefined, top: sticky ? 12 : undefined, minWidth: 0 }}>
      <IdentityCard
        icon={icon}
        title={title}
        subtitle={hint}
        meta={extra}
        dir={dir}
        bodyStyle={pad ? undefined : { padding: 0 }}
      >
        {children}
      </IdentityCard>
    </div>
  );
}
