import React from "react";
import { Link } from "react-router-dom";

// The single call to action on the landing page — managers evaluate, they don't sign up.
export default function RequestDemoCta({ lang, variant = "solid" }) {
  const label = lang === "ar" ? "اطلب عرضاً" : "Request a demo";
  const styles = variant === "solid"
    ? "bg-accent text-accent-foreground hover:bg-accent/90"
    : "border border-accent text-accent hover:bg-accent hover:text-accent-foreground";
  return (
    <Link to="/pricing" className={`inline-flex items-center justify-center rounded-md px-5 py-2.5 text-sm font-semibold ${styles}`}>
      {label}
    </Link>
  );
}