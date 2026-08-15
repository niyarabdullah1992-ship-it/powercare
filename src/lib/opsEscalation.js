import { buildEscalationSteps, escalationStageCount, levelLabel } from "@/lib/escalation";

export function buildOpsEscalationSteps(task, data, t, lang) {
  const current = Math.max(0, Number(task?.escalationLevel) || 0);
  const stages = escalationStageCount(data, task?.stationId);
  return buildEscalationSteps(
    Math.min(current, Math.max(0, stages - 1)),
    { stationId: task?.stationId },
    data,
    t,
    lang,
    stages,
  );
}

export function currentOpsLevelLabel(task, data, t, lang) {
  const current = Math.max(0, Number(task?.escalationLevel) || 0);
  return levelLabel(current, data, t, lang, task?.stationId);
}
