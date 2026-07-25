import React from "react";
import AcwaDocument from "@/components/acwa/AcwaDocument";
import { acwaExecutivePages } from "@/lib/acwaProposalContent";

export default function AcwaExecutiveBrief() {
  return <AcwaDocument pages={acwaExecutivePages} title="PowerCare for ACWA Power" subtitle="Executive Brief • الملخص التنفيذي" documentType="EXECUTIVE BRIEF • الملخص التنفيذي" fileName="PowerCare-ACWA-Executive-Brief-AR-EN-2026.pdf" />;
}