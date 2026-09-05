import React from "react";
import { Link } from "react-router-dom";
import {
  SUITE_ICON_PATHS,
  publicSuiteApps,
  suiteAppsByGroup,
  suiteAppBlurb,
  suiteAppLabel,
  suiteGroupBlurb,
  suiteGroupLabel,
} from "@/lib/suiteApps";
import { ACCENT, BORDER, CARD, INK, MUTED, NAVY, SURFACE } from "@/lib/platformStyles";

function SuiteIcon({ name, color = NAVY }) {
  const paths = SUITE_ICON_PATHS[name] || SUITE_ICON_PATHS.grid;
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      {paths.map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  );
}

/**
 * Odoo-style apps gallery — public marketing or in-app launcher.
 * @param {{ ar?: boolean, mode?: "public" | "app", filterApps?: import("@/lib/suiteApps").SuiteApp[], onAppSelect?: (app: import("@/lib/suiteApps").SuiteApp) => void, title?: string, subtitle?: string }} props
 */
export default function SuiteAppsGallery({
  ar = true,
  mode = "public",
  filterApps,
  onAppSelect,
  title,
  subtitle,
}) {
  const apps = filterApps || publicSuiteApps();
  const groups = suiteAppsByGroup(apps);
  const isApp = mode === "app";

  return (
    <div>
      {(title || subtitle) && (
        <div style={{ marginBottom: isApp ? 22 : 36 }}>
          {title ? (
            <h2 style={{ margin: 0, fontSize: isApp ? 22 : 36, fontWeight: 600, letterSpacing: "-0.02em", color: INK }}>
              {title}
            </h2>
          ) : null}
          {subtitle ? (
            <p style={{ margin: "10px 0 0", fontSize: isApp ? 13 : 17, color: MUTED, maxWidth: 640, lineHeight: 1.65 }}>
              {subtitle}
            </p>
          ) : null}
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: isApp ? 28 : 40 }}>
        {groups.map((group) => (
          <section key={group.id}>
            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "baseline", gap: "10px 18px", marginBottom: 14 }}>
              <h3 style={{ margin: 0, fontSize: isApp ? 14 : 18, fontWeight: 600, color: NAVY }}>
                {suiteGroupLabel(group, ar ? "ar" : "en")}
              </h3>
              <span style={{ fontSize: 12, color: MUTED, lineHeight: 1.5 }}>
                {suiteGroupBlurb(group, ar ? "ar" : "en")}
              </span>
            </div>
            <div
              data-nv="mod-grid"
              style={{
                display: "grid",
                gridTemplateColumns: isApp
                  ? "repeat(auto-fill, minmax(160px, 1fr))"
                  : "repeat(auto-fill, minmax(180px, 1fr))",
                gap: isApp ? 10 : 12,
              }}
            >
              {group.apps.map((app) => {
                const body = (
                  <>
                    <span
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 10,
                        background: SURFACE,
                        border: `1px solid ${BORDER}`,
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <SuiteIcon name={app.icon} color={ACCENT} />
                    </span>
                    <span style={{ minWidth: 0 }}>
                      <span style={{ display: "block", fontSize: isApp ? 13 : 14, fontWeight: 600, color: INK }}>
                        {suiteAppLabel(app, ar ? "ar" : "en")}
                      </span>
                      <span style={{ display: "block", marginTop: 4, fontSize: 11, color: MUTED, lineHeight: 1.45 }}>
                        {suiteAppBlurb(app, ar ? "ar" : "en")}
                      </span>
                    </span>
                  </>
                );
                const cardStyle = {
                  display: "flex",
                  gap: 12,
                  alignItems: "flex-start",
                  padding: isApp ? "12px 12px" : "14px 14px",
                  borderRadius: 12,
                  background: CARD,
                  border: `1px solid ${BORDER}`,
                  textDecoration: "none",
                  color: "inherit",
                  transition: "border-color 160ms ease, box-shadow 160ms ease",
                };
                if (isApp) {
                  if (onAppSelect) {
                    return (
                      <button
                        key={app.id}
                        type="button"
                        onClick={() => onAppSelect(app)}
                        style={{ ...cardStyle, cursor: "pointer", fontFamily: "inherit", textAlign: "start", width: "100%" }}
                        className="nv-suite-app"
                      >
                        {body}
                      </button>
                    );
                  }
                  return (
                    <Link key={app.id} to={app.path} style={cardStyle} className="nv-suite-app">
                      {body}
                    </Link>
                  );
                }
                return (
                  <a key={app.id} href="/pricing" style={cardStyle} className="nv-suite-app">
                    {body}
                  </a>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      <style>{`
        .nv-suite-app:hover {
          border-color: color-mix(in oklab, ${ACCENT} 45%, ${BORDER}) !important;
          box-shadow: 0 8px 24px rgba(20, 40, 75, 0.06);
        }
      `}</style>
    </div>
  );
}
