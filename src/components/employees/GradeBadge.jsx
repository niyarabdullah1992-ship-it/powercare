import React from "react";
import { jobGradeLabel } from "@/lib/jobGrades";

export default function GradeBadge({ grade, className = "" }) {
  if (!grade) return null;
  return <span className={`inline-flex rounded-full bg-secondary px-2.5 py-1 text-[11px] font-medium text-secondary-foreground ${className}`}>{jobGradeLabel(grade)}</span>;
}