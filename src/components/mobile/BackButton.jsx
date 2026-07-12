import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useI18n } from "@/lib/i18n";

// Native-style back arrow with webview-safe behavior:
// - Nested /app stack screens (e.g. /app/employees/:id) → back to the parent route.
// - Sub-pages outside /app (e.g. /pricing, /about) → back to the previous page, or home.
// - Modal overlays tracked via the "#overlay" history marker (see useModalHistory)
//   → back simply pops the marker, closing the overlay.
// It prefers real history (navigate(-1)) so this arrow and the physical
// Android/webview back button traverse the SAME React Router stack — normal web
// browsing is never interrupted. Only when the app was deep-linked with no
// in-app history does it fall back to the computed parent route.
export default function BackButton() {
  const { dir } = useI18n();
  const location = useLocation();
  const navigate = useNavigate();
  const segments = location.pathname.split("/").filter(Boolean);
  const isApp = segments[0] === "app";
  const overlayOpen = location.hash === "#overlay";

  // Visibility: an open overlay always gets a back control; /app needs a nested
  // stack screen; public sub-pages (anything but the landing root) also qualify.
  const visible = overlayOpen || (isApp ? segments.length >= 3 : segments.length >= 1);
  if (!visible) return null;

  const goBack = () => {
    // An overlay marker sits on top of the stack — pop it to close the overlay.
    if (overlayOpen) {
      navigate(-1);
      return;
    }
    // React Router v6 keeps its stack position in history.state.idx — a positive
    // idx means there is real in-app history to pop (identical to the hardware
    // back button), which preserves scroll/tab state and browsing behavior.
    if (window.history.state?.idx > 0) {
      navigate(-1);
      return;
    }
    // Deep link / fresh webview with no history: fall back to the logical parent.
    const fallback = isApp && segments.length >= 3 ? "/" + segments.slice(0, -1).join("/") : "/";
    navigate(fallback, { replace: true });
  };

  return (
    <button
      onClick={goBack}
      aria-label="back"
      className="flex items-center justify-center min-w-[44px] min-h-[44px] -ms-2 rounded-md hover:bg-muted shrink-0 no-select"
    >
      <ArrowLeft className={`w-5 h-5 ${dir === "rtl" ? "rotate-180" : ""}`} strokeWidth={1.75} />
    </button>
  );
}