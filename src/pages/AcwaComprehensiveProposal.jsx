import React from "react";
import AcwaDocument from "@/components/acwa/AcwaDocument";
import { acwaComprehensivePages } from "@/lib/acwaComprehensiveContent";

export default function AcwaComprehensiveProposal() {
  return <AcwaDocument pages={acwaComprehensivePages} title="PowerCare for ACWA Power" subtitle="Comprehensive Platform & Pilot Proposal • الملف الشامل" documentType="COMPREHENSIVE PROPOSAL • الملف الشامل" fileName="PowerCare-ACWA-Comprehensive-Proposal-AR-EN-2026.pdf" />;
}