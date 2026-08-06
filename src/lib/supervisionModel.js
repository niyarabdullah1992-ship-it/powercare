// «الدليل قبل الحكم» — إخضاع المشرف لمؤشراته الخاصة وقياس عدالة توزيع أوزان المهام:
// نسبة الرفض مقارنة بالأقران، متوسط زمن الاعتماد، الاعتراضات المنقوضة ضده،
// والاعتمادات التلقائية بانقضاء المهلة، إضافة إلى توازن أحمال الأوزان داخل كل محطة.
export function buildSupervisionModel(targets, data) {
  const employees = data?.employees || [];
  const nameOf = (id) => employees.find((e) => e.id === id)?.name || null;
  const supervisors = {};
  const sup = (id, name) => {
    if (!supervisors[id]) {
      supervisors[id] = { id, name: name || nameOf(id) || id, rejections: 0, approvals: 0, autoApprovals: 0, overturned: 0, reviewHours: [] };
    }
    return supervisors[id];
  };
  const stationLoads = {};

  for (const tg of targets) {
    const comments = Array.isArray(tg.comments) ? tg.comments : [];
    let lastRejector = null;
    for (const c of comments) {
      if (c.is_rejection && c.user_id) {
        sup(c.user_id, c.user_name).rejections += 1;
        lastRejector = c.user_id;
      }
    }
    if (tg.status === "completed") {
      if (tg.autoApproved) {
        if (tg.manager_id) sup(tg.manager_id).autoApprovals += 1;
      } else {
        const reviewer = (tg.reviewedBy && tg.reviewedBy !== "system" ? tg.reviewedBy : tg.manager_id) || tg.manager_id;
        if (reviewer) {
          const s = sup(reviewer);
          s.approvals += 1;
          if (tg.reviewedAt && tg.pendingReviewAt) {
            const hours = (new Date(tg.reviewedAt).getTime() - new Date(tg.pendingReviewAt).getTime()) / 3600000;
            if (hours >= 0 && hours < 24 * 90) s.reviewHours.push(hours);
          }
        }
      }
      // رفضٌ سبقه اعتراض ثم اكتملت المهمة لاحقاً = اعتراض نُقض لصالح الموظف.
      if (lastRejector && comments.some((c) => c.is_dispute)) sup(lastRejector).overturned += 1;
    }
    // عدالة التوزيع: حمل الأوزان لكل موظف داخل محطته (المهام الفردية فقط).
    if (tg.assignment_type === "member" && tg.employee_id) {
      const st = tg.station_id || "hq";
      if (!stationLoads[st]) stationLoads[st] = {};
      if (!stationLoads[st][tg.employee_id]) stationLoads[st][tg.employee_id] = { weightLoad: 0, tasks: 0 };
      stationLoads[st][tg.employee_id].weightLoad += Number(tg.effortWeight) || 1;
      stationLoads[st][tg.employee_id].tasks += 1;
    }
  }

  const supList = Object.values(supervisors)
    .map((s) => {
      const reviewed = s.rejections + s.approvals;
      return {
        ...s,
        name: nameOf(s.id) || s.name,
        rejectionRate: reviewed ? s.rejections / reviewed : 0,
        avgReviewHours: s.reviewHours.length ? s.reviewHours.reduce((a, b) => a + b, 0) / s.reviewHours.length : null,
      };
    })
    .filter((s) => s.rejections + s.approvals + s.autoApprovals + s.overturned > 0)
    .sort((a, b) => b.rejectionRate - a.rejectionRate);

  const rates = supList.filter((s) => s.rejections + s.approvals > 0).map((s) => s.rejectionRate);
  const peerAvgRejection = rates.length ? rates.reduce((a, b) => a + b, 0) / rates.length : 0;

  const stations = Object.entries(stationLoads).map(([stationId, byEmp]) => {
    const rows = Object.entries(byEmp)
      .map(([empId, v]) => ({ empId, name: nameOf(empId) || empId, ...v }))
      .sort((a, b) => b.weightLoad - a.weightLoad);
    const loads = rows.map((r) => r.weightLoad);
    const max = Math.max(...loads);
    const min = Math.min(...loads);
    const ratio = rows.length >= 2 && min > 0 ? max / min : null;
    return {
      stationId,
      name: (data?.stations || []).find((s) => s.id === stationId)?.name || stationId,
      rows,
      maxLoad: max,
      ratio,
      imbalanced: ratio !== null && ratio > 2,
    };
  });

  return { supervisors: supList, peerAvgRejection, stations };
}