const IDS = ["start","dashboard","stations","employees","hr","tasks","attendance","reports","complaints","chat","files","signing","payroll","expenses","safety","performance","niro","subscriptions","security"];

export function buildManualContent(config) {
  const MANUAL_META = config.meta;
  const MANUAL_CHAPTERS = IDS.map((id, index) => {
    const item = config.chapters[id];
    const name = `${index + 1}. ${item[0]}`;
    const purpose = item[1];
    return {
      id,
      title: name,
      purpose,
      roles: [config.text.roles.replace("{section}", item[0])],
      steps: config.text.steps.map((text) => text.replace("{section}", item[0]).replace("{purpose}", purpose)),
      rules: config.text.rules.map((text) => text.replace("{section}", item[0])),
      tips: [config.text.tip.replace("{section}", item[0])],
      screen: {
        appearance: config.text.appearance.replace("{section}", item[0]),
        contains: config.text.contains.map((text) => text.replace("{section}", item[0])),
        controls: config.text.controls.map((text) => text.replace("{section}", item[0])),
        states: config.text.states,
      },
    };
  });
  return { MANUAL_META, MANUAL_CHAPTERS };
}