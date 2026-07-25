export const MANUAL_SECTIONS = [
  ["start", "/login"], ["dashboard", "/app"], ["executive", "/app"],
  ["stations", "/app"], ["employees", "/app"], ["hr", "/app/hr"],
  ["tasks", "/app/tasks"], ["attendance", "/app/attendance"], ["reports", "/app/daily-report"],
  ["chat", "/app/chat"], ["complaints", "/app/complaints"], ["files", "/app/files"],
  ["signing", "/app/signing"], ["inventory", "/app/inventory"], ["expenses", "/app/expenses"],
  ["payroll", "/app/payroll"], ["performance", "/app/performance"], ["safety", "/app/safety"],
  ["cameras", "/app/cameras"], ["niro", "/app/assistant"], ["guide", "/app/manual"],
  ["subscriptions", "/pricing"], ["security", "/security"],
];

export function buildManualContent(config) {
  const MANUAL_META = config.meta;
  const MANUAL_CHAPTERS = MANUAL_SECTIONS.map(([id, route], index) => {
    const item = config.chapters[id];
    if (!item) return null;
    const name = item[0];
    const purpose = item[1];
    return {
      id, route, number: index + 1, name, title: `${index + 1}. ${name}`, purpose,
      roles: [config.text.roles.replace("{section}", name)],
      steps: [...config.text.steps, ...config.text.controls].map((text) => text.replace("{section}", name).replace("{purpose}", purpose)),
      rules: config.text.rules.map((text) => text.replace("{section}", name)),
      tips: [config.text.tip.replace("{section}", name)],
      screen: {
        appearance: config.text.appearance.replace("{section}", name),
        contains: config.text.contains.map((text) => text.replace("{section}", name)),
        controls: config.text.controls.map((text) => text.replace("{section}", name)),
        states: config.text.states,
      },
    };
  }).filter(Boolean);
  return { MANUAL_META, MANUAL_CHAPTERS };
}