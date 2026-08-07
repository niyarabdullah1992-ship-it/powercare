import { checklistCompliance, safetyKpis } from "@/lib/safetyStandards";

const levelColors = {
  green: "hsl(160 60% 38%)",
  amber: "hsl(38 92% 50%)",
  red: "hsl(0 72% 51%)",
};

const monthKey = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

export function buildSafetyDashboardData(safety = [], stations = [], lang = "en") {
  const ar = lang === "ar";
  const now = new Date();
  const months = Array.from({ length: 6 }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1);
    return { key: monthKey(date), month: date.toLocaleDateString(ar ? "ar-SA" : "en-US", { month: "short" }), incidents: 0 };
  });
  const monthMap = new Map(months.map((item) => [item.key, item]));

  safety.forEach((record) => (record.incidentLog || []).forEach((incident) => {
    const date = new Date(incident.at);
    if (!Number.isNaN(date.getTime())) {
      const month = monthMap.get(monthKey(date));
      if (month) month.incidents += 1;
    }
  }));

  const hazards = stations.map((station) => {
    const record = safety.find((item) => item.stationId === station.id);
    return { station: station.name, hazards: (record?.hazards || []).length, fill: levelColors[record?.level] || "hsl(var(--muted-foreground))" };
  });
  const selectedMonth = monthKey(now);
  const currentMonth = monthMap.get(selectedMonth)?.incidents || 0;
  const monthlyKpis = safety.map((record) => safetyKpis(record, selectedMonth));
  const totalHours = monthlyKpis.reduce((sum, kpi) => sum + kpi.hours, 0);
  const totalLti = monthlyKpis.reduce((sum, kpi) => sum + kpi.lti, 0);
  const totalIncidents = monthlyKpis.reduce((sum, kpi) => sum + kpi.incidents, 0);
  const complianceValues = stations.map((station) => checklistCompliance(safety.find((item) => item.stationId === station.id)?.checklistResults || {}));
  const compliance = complianceValues.length ? Math.round(complianceValues.reduce((sum, value) => sum + value, 0) / complianceValues.length) : 0;

  return {
    months,
    hazards,
    companyKpis: {
      trir: totalHours ? (totalIncidents * 200000) / totalHours : 0,
      ltifr: totalHours ? (totalLti * 1000000) / totalHours : 0,
      totalHours,
      totalLti,
      compliance,
    },
    stats: {
      currentMonth,
      critical: stations.filter((station) => safety.find((item) => item.stationId === station.id)?.level === "red").length,
      openHazards: hazards.reduce((sum, item) => sum + item.hazards, 0),
      approved: stations.filter((station) => safety.find((item) => item.stationId === station.id)?.approvedBy).length,
    },
  };
}