export const MANUAL_SECTIONS = [
  ["dashboard", "/app"], ["tasks", "/app/tasks"], ["attendance", "/app/attendance"],
  ["inventory", "/app/inventory"], ["expenses", "/app/expenses"], ["signing", "/app/signing"],
  ["niro", "/app/assistant"], ["employees", "/app/employees"], ["stations", "/app/stations"],
  ["hr", "/app/hr"], ["payroll", "/app/payroll"], ["performance", "/app/performance"],
  ["safety", "/app/safety"], ["reports", "/app/daily-report"], ["chat", "/app/chat"],
  ["files", "/app/files"], ["complaints", "/app/complaints"],
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