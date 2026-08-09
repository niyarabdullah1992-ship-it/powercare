import moment from "moment";

const sameDay = (value, day) => value && moment(value).isSame(moment(day), "day");

// Builds one chronological timeline: each issue carries the actions taken in response to it,
// so a reader sees what happened and what was done about it on a single line.
export function buildDailyTimeline({ targets, complaints, day, stationOf, stationName, actorLabel, taskLabel, lang }) {
  const entries = [];

  targets.forEach((tg) => {
    const key = stationOf(tg);
    const title = tg.title || taskLabel;
    const comments = (Array.isArray(tg.comments) ? tg.comments : [])
      .filter((c) => sameDay(c.created_at, day))
      .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

    if (sameDay(tg.created_at, day) || sameDay(tg.end_date, day)) {
      entries.push({
        id: `task-${tg.id}`,
        at: tg.created_at,
        kind: "task",
        stationName: stationName(key),
        stationKey: key,
        text: title,
        status: tg.status,
        href: "/app/tasks",
        hrefLabel: lang === "ar" ? "فتح بطاقة المهمة" : "Open task",
      });
    }

    let openIssue = null;
    comments.forEach((c) => {
      if (c.is_issue) {
        openIssue = {
          id: `issue-${c.id}`,
          at: c.created_at,
          kind: "issue",
          stationName: stationName(key),
          stationKey: key,
          contextTitle: title,
          label: lang === "ar" ? "مشكلة" : "Issue",
          text: c.content,
          impact: c.impact || "",
          responses: [],
          href: "/app/tasks",
          hrefLabel: lang === "ar" ? "فتح بطاقة المهمة" : "Open task",
        };
        entries.push(openIssue);
        return;
      }
      if (openIssue) {
        openIssue.responses.push({ id: c.id, text: c.content, actor: actorLabel(c) });
        return;
      }
      entries.push({
        id: `action-${c.id}`,
        at: c.created_at,
        kind: "action",
        stationName: stationName(key),
        stationKey: key,
        contextTitle: title,
        label: lang === "ar" ? "إجراء" : "Action",
        text: `${c.content || ""} — ${actorLabel(c)}`,
        href: "/app/tasks",
        hrefLabel: lang === "ar" ? "فتح بطاقة المهمة" : "Open task",
      });
    });
  });

  complaints.forEach((r) => {
    const key = r.stationId || null;
    entries.push({
      id: `complaint-${r.id}`,
      at: r.createdAt,
      kind: "complaint",
      stationName: stationName(key),
      stationKey: key,
      label: lang === "ar" ? "بلاغ" : "Report",
      text: r.message,
      href: "/app/complaints",
      hrefLabel: lang === "ar" ? "فتح البلاغ" : "Open report",
    });
  });

  return entries.sort((a, b) => new Date(a.at) - new Date(b.at));
}