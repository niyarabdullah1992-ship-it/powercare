import assert from "node:assert/strict";
import {
  CHAT_SECTION,
  RATE_LIMIT_BURST,
  actorCanAccessChannel,
  actorSeesAllStations,
  checkListGate,
  checkSendGate,
  demoChatFacts,
  deriveChatBoard,
  scopeChannels,
  unreadForChannel,
} from "../src/lib/chatDerivations.js";

assert.equal(CHAT_SECTION, "chat");
assert.equal(RATE_LIMIT_BURST.max, 30);
assert.equal(RATE_LIMIT_BURST.windowMs, 5 * 60_000);

assert.equal(checkSendGate({ text: "", companyId: "co_1", channelId: "jbl2" }).error, "EMPTY_MESSAGE");
assert.equal(checkSendGate({ text: "  ", companyId: "co_1", channelId: "jbl2" }).error, "EMPTY_MESSAGE");
assert.equal(
  checkSendGate({ text: "hi", companyId: "co_1" }).error,
  "STATION_REQUIRED",
);
assert.equal(
  checkSendGate({ text: "hi", companyId: "" }).error,
  "OUT_OF_SCOPE",
);
assert.equal(
  checkSendGate({ text: "hi", companyId: "co_1", channelId: "jbl2", crossTenant: true }).error,
  "OUT_OF_SCOPE",
);

const jbl2 = { id: "jbl2", stationKey: "jbl2", kind: "station", nameAr: "ج2", nameEn: "J2", companyId: "co_1" };
assert.equal(
  checkSendGate({
    text: "hi",
    companyId: "co_1",
    channelId: "jbl2",
    channel: jbl2,
    actor: { role: "employee", stationId: "ynb", stationIds: ["ynb"] },
  }).error,
  "FORBIDDEN",
);
assert.equal(
  checkSendGate({
    text: "hi",
    companyId: "co_1",
    channelId: "jbl2",
    channel: jbl2,
    actor: { role: "employee", stationId: "jbl2", stationIds: ["jbl2"] },
  }).ok,
  true,
);

const burstAts = Array.from({ length: 30 }, (_, i) => new Date(Date.now() - i * 1000).toISOString());
assert.equal(
  checkSendGate({
    text: "hi",
    companyId: "co_1",
    channelId: "jbl2",
    channel: jbl2,
    actor: { role: "owner", owner: true, allStations: true },
    recentSendAts: burstAts,
  }).error,
  "RATE_LIMIT_BURST",
);

assert.equal(checkListGate({ companyId: "co_1" }).error, "STATION_REQUIRED");
assert.equal(
  checkListGate({
    companyId: "co_1",
    channelId: "jbl2",
    channel: jbl2,
    actor: { role: "employee", stationId: "dmm" },
  }).error,
  "FORBIDDEN",
);

const facts = demoChatFacts("co_1");
assert.equal(facts.channels.length, 5);
assert.equal(facts.messages.length, 10);
assert.ok(facts.messages.every((m) => m.companyId === "co_1"));

const owner = { role: "owner", owner: true, allStations: true, userId: "u_owner" };
assert.equal(actorSeesAllStations(owner), true);

const board = deriveChatBoard({ facts, actor: owner, companyId: "co_1", userId: "u_owner" });
assert.equal(board.stats.channelCount, 5);
assert.ok(board.stats.unreadTotal > 0);
assert.ok(board.channels.some((c) => c.id === "jbl2" && c.preview.includes("مضخة") || c.preview.length > 0));

const scopedOnly = scopeChannels(facts.channels, {
  role: "employee",
  stationId: "jbl2",
  stationIds: ["jbl2"],
}, "co_1");
assert.equal(scopedOnly.length, 1);
assert.equal(scopedOnly[0].id, "jbl2");

assert.equal(
  actorCanAccessChannel(facts.channels.find((c) => c.id === "jbl1"), {
    role: "employee",
    stationId: "jbl2",
  }),
  false,
);

const jbl2Unread = unreadForChannel(facts.messages, "jbl2", null, "co_1", "u_owner");
assert.ok(jbl2Unread >= 3);

const otherTenant = demoChatFacts("co_other");
const leakBoard = deriveChatBoard({
  facts: {
    ...facts,
    messages: [...facts.messages, ...otherTenant.messages],
    channels: [...facts.channels, ...otherTenant.channels.map((c) => ({ ...c, id: `x_${c.id}` }))],
  },
  actor: owner,
  companyId: "co_1",
  userId: "u_owner",
});
assert.ok(leakBoard.channels.every((c) => !c.companyId || c.companyId === "co_1"));
assert.ok(!leakBoard.channels.some((c) => String(c.id).startsWith("x_")));

const smBoard = deriveChatBoard({
  facts,
  actor: { role: "station_manager", stationId: "jbl2", stationIds: ["jbl2"], userId: "u_sm" },
  companyId: "co_1",
  userId: "u_sm",
});
assert.ok(smBoard.channels.some((c) => c.id === "jbl2"));
assert.ok(smBoard.channels.some((c) => c.id === "supervisors"));
assert.ok(!smBoard.channels.some((c) => c.id === "jbl1"));

console.log("chat derivations ok");

