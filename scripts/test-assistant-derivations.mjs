import assert from "node:assert/strict";
import {
  AI_FEATURE,
  ASSISTANT_SECTION,
  PROMPT_CATALOG,
  SPOTLIGHT_PROMPT,
  actorMayAsk,
  planAllowsAssistant,
  catalogById,
  matchPromptByText,
  checkAskGate,
  scopeStations,
  buildAssistantBoard,
  demoAssistantFacts,
  derivePromptAnswer,
} from "../src/lib/assistantDerivations.js";

assert.equal(ASSISTANT_SECTION, "assistant");
assert.equal(AI_FEATURE, "ai");
assert.equal(PROMPT_CATALOG.length, 4);
assert.equal(SPOTLIGHT_PROMPT.id, "task_drop_spotlight");
assert.equal(catalogById("board_report")?.textEn.includes("board"), true);
assert.equal(catalogById("nope"), null);
assert.equal(matchPromptByText("من تجاوز ساعاته الإضافية؟")?.id, "overtime_excess");
assert.equal(matchPromptByText("Who exceeded overtime limits?")?.id, "overtime_excess");

assert.equal(planAllowsAssistant(null), true);
assert.equal(planAllowsAssistant({ enabledSections: ["assistant"], enabledFeatures: ["ai"] }), true);
assert.equal(planAllowsAssistant({ enabledSections: ["tasks"], enabledFeatures: ["ai"] }), false);
assert.equal(planAllowsAssistant({ enabledSections: ["assistant"], enabledFeatures: ["exports"] }), false);
assert.equal(planAllowsAssistant({ enabledSections: ["assistant"], enabledFeatures: [] }), false);

assert.equal(actorMayAsk({ role: "employee" }, catalogById("board_report")), false);
assert.equal(actorMayAsk({ role: "director" }, catalogById("board_report")), true);
assert.equal(actorMayAsk({ role: "employee", owner: true }, catalogById("board_report")), true);
assert.equal(actorMayAsk({ role: "safety_officer" }, catalogById("overdue_safety")), true);

assert.equal(checkAskGate({ question: "" }).error, "EMPTY_QUESTION");
assert.equal(checkAskGate({ question: "   " }).error, "EMPTY_QUESTION");
assert.equal(
  checkAskGate({
    question: "x",
    plan: { enabledSections: ["assistant"], enabledFeatures: [] },
  }).error,
  "FEATURE_DISABLED",
);
assert.equal(
  checkAskGate({ question: "show NV-APP-ABC candidate file" }).error,
  "OUT_OF_SCOPE",
);
assert.equal(
  checkAskGate({ question: "قارن", careersChannel: true }).error,
  "OUT_OF_SCOPE",
);
assert.equal(
  checkAskGate({ question: "other company payroll", crossTenant: true }).error,
  "OUT_OF_SCOPE",
);
assert.equal(
  checkAskGate({
    promptId: "board_report",
    actor: { role: "employee" },
    plan: { enabledSections: ["assistant"], enabledFeatures: ["ai"] },
  }).error,
  "FORBIDDEN",
);
assert.equal(
  checkAskGate({
    promptId: "overtime_excess",
    actor: { role: "hr" },
    plan: { enabledSections: ["assistant"], enabledFeatures: ["ai"] },
    allowedSections: ["attendance"], // missing assistant
  }).error,
  "FORBIDDEN",
);
assert.equal(
  checkAskGate({
    promptId: "compare_stations",
    actor: { role: "ops_manager" },
    plan: { enabledSections: ["assistant"], enabledFeatures: ["ai"] },
    allowedSections: ["assistant", "performance"],
  }).ok,
  true,
);

const facts = demoAssistantFacts("co_1");
assert.equal(facts.stations.length, 6);
assert.equal(facts.companyOtHoursWeek, 84);

const ownerActor = { role: "owner", owner: true, allStations: true };
const board = buildAssistantBoard({
  facts,
  actor: ownerActor,
  companyId: "co_1",
  activePromptId: "task_drop_spotlight",
});
assert.equal(board.stationCount, 6);
assert.equal(board.answer?.promptId, "task_drop_spotlight");
assert.ok(board.answer?.evidence?.length >= 3);
assert.ok(board.answer?.evidence.some((e) => e.sourceEn === "OPERATIONS"));
assert.ok(board.answer?.evidence.some((e) => e.sourceEn === "ATTENDANCE"));
assert.ok(board.answer?.evidence.some((e) => String(e.value).includes("h")));

const compare = buildAssistantBoard({
  facts,
  actor: ownerActor,
  companyId: "co_1",
  activePromptId: "compare_stations",
});
assert.equal(compare.answer?.evidence.find((e) => e.labelEn === "Highest")?.value, "88");
assert.equal(compare.answer?.evidence.find((e) => e.labelEn === "Lowest")?.value, "71");

const ot = buildAssistantBoard({
  facts,
  actor: ownerActor,
  companyId: "co_1",
  activePromptId: "overtime_excess",
});
assert.ok(String(ot.answer?.answerEn || "").includes("Jubail 2"));
assert.equal(ot.answer?.evidence.find((e) => e.labelEn === "Total")?.value, "84h");

const safety = buildAssistantBoard({
  facts,
  actor: ownerActor,
  companyId: "co_1",
  activePromptId: "overdue_safety",
});
assert.equal(safety.answer?.evidence.find((e) => e.labelEn === "Critical")?.value, "3");

const boardDraft = buildAssistantBoard({
  facts,
  actor: ownerActor,
  companyId: "co_1",
  activePromptId: "board_report",
});
assert.equal(boardDraft.answer?.evidence.find((e) => e.labelEn === "Readiness")?.value, "82");

// Station manager scoped to jbl2 only — no leak of other stations' OT ranking as company-wide.
const scoped = scopeStations(facts.stations, {
  role: "station_manager",
  stationId: "jbl2",
  stationIds: ["jbl2"],
}, "co_1");
assert.equal(scoped.length, 1);
assert.equal(scoped[0].id, "jbl2");

const scopedBoard = buildAssistantBoard({
  facts,
  actor: { role: "station_manager", stationId: "jbl2", stationIds: ["jbl2"] },
  companyId: "co_1",
  activePromptId: "compare_stations",
});
assert.equal(scopedBoard.stationCount, 1);
assert.equal(scopedBoard.answer?.evidence.find((e) => e.labelEn === "Highest")?.value, "74");
assert.equal(scopedBoard.answer?.evidence.find((e) => e.labelEn === "Lowest")?.value, "74");

// Cross-tenant station rows stripped
const leakFacts = {
  ...facts,
  stations: [
    ...facts.stations,
    { id: "x", nameAr: "أخرى", nameEn: "Other", companyId: "co_other", readiness: 99 },
  ],
};
const noLeak = buildAssistantBoard({
  facts: leakFacts,
  actor: ownerActor,
  companyId: "co_1",
  activePromptId: "compare_stations",
});
assert.equal(noLeak.stationCount, 6);
assert.notEqual(noLeak.answer?.evidence.find((e) => e.labelEn === "Highest")?.value, "99");

const derived = derivePromptAnswer(
  "overtime_excess",
  facts,
  facts.stations,
  facts.hazards,
  facts.assets,
  facts.blockedTasks,
);
assert.ok(derived?.answerAr.includes("ساعة"));

console.log("assistant derivations: ok");
