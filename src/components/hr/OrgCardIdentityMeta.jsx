import React from "react";
import { getOrgRankLabel } from "@/lib/orgTreeRank";

export default function OrgCardIdentityMeta({ station, managerName, rank, isStationLead, lang, ar }) {
  if (station) {
    return managerName ? (
      <span className="mt-1 flex flex-wrap items-center gap-1.5 text-[10px] text-accent-foreground/80">
        <span>{managerName}</span>
        <span className="rounded-full bg-primary px-2 py-0.5 font-semibold text-primary-foreground">
          {ar ? "مدير المحطة" : "Station Manager"}
        </span>
      </span>
    ) : (
      <span className="mt-1 inline-flex w-fit rounded-full bg-destructive px-2 py-0.5 text-[10px] font-semibold text-destructive-foreground">
        {ar ? "بدون مدير" : "No Manager"}
      </span>
    );
  }

  return (
    <span className={`mt-0.5 flex flex-wrap items-center gap-1.5 text-[10px] ${isStationLead ? "font-semibold text-accent" : "text-muted-foreground"}`}>
      <span>{rank ? getOrgRankLabel(rank, lang) : (ar ? "موظف" : "Employee")}</span>
      {isStationLead && (
        <span className="rounded-full bg-accent/15 px-2 py-0.5 text-accent">
          {ar ? "مدير" : "Manager"}
        </span>
      )}
    </span>
  );
}