import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useI18n } from "@/lib/i18n";

// Explicit native-style back arrow shown on nested stack screens
// (e.g. /app/employees/:id) — returns to the parent route in the stack.
export default function BackButton() {
  const { dir } = useI18n();
  const location = useLocation();
  const navigate = useNavigate();
  const segments = location.pathname.split("/").filter(Boolean);
  // Only nested children under /app (deeper than a module root) get a back arrow.
  if (segments[0] !== "app" || segments.length < 3) return null;
  const parent = "/" + segments.slice(0, -1).join("/");
  return (
    <button
      onClick={() => navigate(parent)}
      aria-label="back"
      className="p-2 -ms-1 rounded-md hover:bg-muted shrink-0 no-select"
    >
      <ArrowLeft className={`w-5 h-5 ${dir === "rtl" ? "rotate-180" : ""}`} strokeWidth={1.75} />
    </button>
  );
}