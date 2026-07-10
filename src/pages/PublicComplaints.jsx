import React from "react";
import PublicComplaintsSection from "@/components/anonymous/PublicComplaints";

// Own page for identified (non-anonymous) complaints — same idea as the
// Anonymous Reports page, but as an entirely separate section in the app.
export default function PublicComplaints() {
  return (
    <div className="space-y-6">
      <PublicComplaintsSection />
    </div>
  );
}