import React from "react";

export default function OrgCardIdentityMeta({ station, managerName, isStationManager, isHierarchyManager, ar }) {
  if (station) {
    return managerName ? (
      <span className="mt-1 flex flex-wrap items-center gap-1.5 text-[10px] text-primary-foreground/80">
        <span>{managerName}</span>
        <span className="rounded-full bg-primary-foreground/15 px-2 py-0.5 font-semibold text-primary-foreground">
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
    <span className={`mt-0.5 block text-[10px] ${isHierarchyManager || isStationManager ? "font-semibold text-accent" : "text-muted-foreground"}`}>
      {isHierarchyManager ? (ar ? "مدير" : "Manager") : isStationManager ? (ar ? "مدير المحطة" : "Station Manager") : (ar ? "موظف" : "Employee")}
    </span>
  );
}