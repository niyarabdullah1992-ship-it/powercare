import React from "react";
import { Sparkles, User, Users } from "lucide-react";
import TaskFieldGroup from "@/components/tasks/TaskFieldGroup";
import TaskDateRange from "@/components/tasks/TaskDateRange";
import EffortWeightPicker from "@/components/tasks/EffortWeightPicker";
import AssigneeSearchSelect from "@/components/tasks/AssigneeSearchSelect";
import CompletionModeToggle from "@/components/tasks/CompletionModeToggle";
import CommentFiles from "@/components/tasks/CommentFiles";
import { getLeafName } from "@/lib/taskFolders";

// كل حقول إنشاء المهمة في تمرير واحد، مقسّمة بثلاثة عناوين صغيرة لا صفحات.
export default function TaskCreateFields({
  t, lang, prefilled,
  taskFiles, setTaskFiles,
  isIndividual, assignType, setAssignType,
  memberCandidates, assignedIds, setAssignedIds, stationNameOf,
  stationLabel, sectionValue,
  priority, setPriority,
  effortWeight, setEffortWeight, suggestedWeight,
  completionMode, setCompletionMode, canSetCompletionMode,
  startDate, endDate, setStartDate, setEndDate,
}) {
  const ar = lang === "ar";
  const field = "w-full rounded-lg border border-input px-3 py-2.5 text-sm font-body focus:border-accent focus:ring-1 focus:ring-accent";

  return (
    <div className="space-y-5">
      {prefilled && (
        <p className="flex items-center gap-1.5 text-[11px] font-body text-accent-text"><Sparkles className="h-3.5 w-3.5" /> {t("smartPrefill")}</p>
      )}

      <TaskFieldGroup title={ar ? "ما المهمة" : "What is the task"}>
        <div>
          <label className="mb-1.5 block text-xs font-semibold">{t("taskTitle")}</label>
          <input name="title" placeholder={t("taskTitle")} className={field} />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-semibold">{t("taskDescription")}</label>
          <textarea name="description" rows={3} placeholder={t("taskDescription")} className={`${field} resize-y`} />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-semibold">{t("steps")}</label>
          <textarea name="steps" rows={3} placeholder={t("stepsPlaceholder")} className={`${field} resize-y`} />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-semibold">{t("attachFile")}</label>
          <CommentFiles files={taskFiles} setFiles={setTaskFiles} />
        </div>
      </TaskFieldGroup>

      <TaskFieldGroup title={ar ? "من ينفّذها" : "Who does it"}>
        {!isIndividual && (
          <div className="flex flex-wrap gap-2">
            {[
              { val: "member", label: t("member"), icon: User },
              { val: "station_team", label: t("stationTeam"), icon: Users },
            ].map(({ val, label, icon: OptIcon }) => (
              <button
                key={val}
                type="button"
                onClick={() => setAssignType(val)}
                className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-body transition ${assignType === val ? "border-foreground bg-foreground text-background" : "border-border hover:bg-muted"}`}
              >
                <OptIcon className="h-3.5 w-3.5" /> {label}
              </button>
            ))}
          </div>
        )}
        <input type="hidden" name="assignType" value={assignType} />
        {assignType === "member" && (
          <AssigneeSearchSelect
            members={memberCandidates}
            selected={assignedIds}
            onChange={setAssignedIds}
            stationNameOf={stationNameOf}
            lang={lang}
          />
        )}
        {assignType === "station_team" && <input type="hidden" name="stationId" value={stationLabel.id} />}
        <div className="grid grid-cols-2 gap-3 text-sm font-body">
          <div>
            <p className="mb-1 text-xs text-muted-foreground">{ar ? "المحطة" : "Station"}</p>
            <div className="rounded-lg border border-accent/30 bg-secondary/50 px-3 py-2">{stationLabel.name}</div>
          </div>
          <div>
            <p className="mb-1 text-xs text-muted-foreground">{t("section")}</p>
            <input type="hidden" name="section" value={sectionValue} />
            <div className="rounded-lg border border-accent/30 bg-secondary/50 px-3 py-2">{getLeafName(sectionValue) || "—"}</div>
          </div>
        </div>
      </TaskFieldGroup>

      <TaskFieldGroup title={ar ? "كيف تُقاس" : "How it is measured"}>
        <div>
          <label className="mb-1.5 block text-xs font-semibold">{ar ? "الحصة المستهدفة لهذه المهمة" : "Target quota for this task"}</label>
          <input name="totalTasks" type="number" min="1" placeholder={ar ? "مثال: ٥٠ مضخة" : "e.g. 50 pumps"} className={field} />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-semibold">{ar ? "وزن الجهد" : "Effort weight"}</label>
          <EffortWeightPicker value={effortWeight} onChange={setEffortWeight} suggested={suggestedWeight} lang={lang} />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-semibold">{t("priority")}</label>
          <div className="flex flex-wrap gap-2">
            {[
              { val: "urgent", label: t("urgent") },
              { val: "high", label: t("high") },
              { val: "medium", label: t("medium") },
              { val: "low", label: t("low") },
            ].map(({ val, label }) => (
              <button
                key={val}
                type="button"
                onClick={() => setPriority(val)}
                className={`rounded-full border px-3 py-1.5 text-xs font-body transition ${priority === val ? "border-foreground bg-foreground text-background" : val === "urgent" ? "border-red-400 text-red-700 hover:bg-red-50" : "border-border hover:bg-muted"}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-semibold">{ar ? "المدة" : "Duration"}</label>
          <TaskDateRange start={startDate} end={endDate} setStart={setStartDate} setEnd={setEndDate} lang={lang} />
        </div>
        {canSetCompletionMode && <CompletionModeToggle value={completionMode} onChange={setCompletionMode} lang={lang} />}
      </TaskFieldGroup>
    </div>
  );
}