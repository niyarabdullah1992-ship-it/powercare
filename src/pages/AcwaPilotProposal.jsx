import React from "react";
import AcwaDocument from "@/components/acwa/AcwaDocument";
import { acwaProposalPages } from "@/lib/acwaProposalContent";

export default function AcwaPilotProposal() {
  return <AcwaDocument pages={acwaProposalPages} title="ACWA Power Pilot Proposal" subtitle="Detailed Proposal • المقترح التفصيلي" documentType="PILOT PROPOSAL • مقترح التجربة" fileName="PowerCare-ACWA-Pilot-Proposal-AR-EN-2026.pdf" />;
}