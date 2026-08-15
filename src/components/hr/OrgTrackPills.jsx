import React from "react";
import { orderedOrgTracks, trackLabel } from "@/lib/orgTracks";
import { BORDER, NAVY, NAVY_FILL, SURFACE } from "@/lib/platformStyles";

export default function OrgTrackPills({ data, value, onChange, ar, includeAll = true }) {
  const tracks = orderedOrgTracks(data);
  const options = includeAll
    ? [{ id: "", title: ar ? "كل القوائم" : "All lists", titleEn: "All lists" }, ...tracks]
    : tracks;

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
      {options.map((track) => {
        const on = value === track.id;
        return (
          <button
            key={track.id || "all"}
            type="button"
            onClick={() => onChange(track.id)}
            style={{
              height: 32,
              padding: "0 12px",
              borderRadius: 9,
              border: `1px solid ${on ? NAVY_FILL : BORDER}`,
              background: on ? NAVY_FILL : SURFACE,
              color: on ? "#fff" : NAVY,
              fontSize: 12,
              fontWeight: 600,
              fontFamily: "inherit",
              cursor: "pointer",
            }}
          >
            {track.id ? trackLabel(track, ar) : (ar ? track.title : track.titleEn)}
          </button>
        );
      })}
    </div>
  );
}
