import React from "react";
import { Navigate } from "react-router-dom";

export default function TrialExpiryGate({ company, children }) {
  if (!company?.subscriptionEnd) return children;
  const rawEnd = String(company.subscriptionEnd);
  const expiresAt = new Date(/^\d{4}-\d{2}-\d{2}$/.test(rawEnd) ? `${rawEnd}T23:59:59.999` : rawEnd).getTime();
  if (Number.isFinite(expiresAt) && Date.now() > expiresAt) {
    return <Navigate to="/pricing?expired=1" replace />;
  }
  return children;
}