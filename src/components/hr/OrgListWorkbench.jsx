import React from "react";
import OrgListPanel from "@/components/hr/OrgListPanel";

export default function OrgListWorkbench({ lang = "ar", trackId, onTrackId, onAssign }) {
  return <OrgListPanel lang={lang} trackId={trackId} onTrackId={onTrackId} onAssign={onAssign} />;
}
