import React from "react";
import { Link } from "react-router-dom";
import { ClipboardList } from "lucide-react";

// Empty states offer an action, never just a statement.
export default function PerformanceEmptyState({ ar }) {
  return (
    <div className="rounded-xl border border-border bg-card p-8 text-center">
      <p className="text-sm font-body">
        {ar ? "لم تُعتمد مهام موزونة بعد — ابدأ بتوزيع مهمة." : "No weighted tasks approved yet — start by assigning a task."}
      </p>
      <Link
        to="/app/tasks"
        className="mt-3 inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground font-body hover:bg-accent hover:text-accent-foreground"
      >
        <ClipboardList className="h-4 w-4" />{ar ? "توزيع مهمة" : "Assign a task"}
      </Link>
    </div>
  );
}