import { updateCompany } from "@/lib/store";

export const DEFAULT_ORG_TRACKS = [
  { id: "track_lead", title: "قيادي", titleEn: "Leadership" },
  { id: "track_admin", title: "إداري", titleEn: "Administrative" },
  { id: "track_tech", title: "فني", titleEn: "Technical" },
  { id: "track_ops", title: "تشغيلي", titleEn: "Operational" },
];

export function trackLabel(track, ar = true) {
  if (!track) return "";
  return ar ? track.title : (track.titleEn || track.title);
}

export function orderedOrgTracks(data) {
  const source = Array.isArray(data?.orgTracks) && data.orgTracks.length
    ? data.orgTracks
    : DEFAULT_ORG_TRACKS;
  return [...source]
    .sort((a, b) => (a.order || 0) - (b.order || 0))
    .map((track, order) => ({ ...track, order: track.order ?? order }));
}

export function orgTrackById(data, id) {
  return orderedOrgTracks(data).find((track) => track.id === id) || null;
}

function persistDefaults(data) {
  if (Array.isArray(data.orgTracks) && data.orgTracks.length) return;
  data.orgTracks = DEFAULT_ORG_TRACKS.map((track, order) => ({ ...track, order }));
}

export function saveOrgTrack(companyId, { id, title, titleEn }) {
  const name = String(title || "").trim();
  if (!companyId || !name) return null;
  let savedId = id || "";
  updateCompany(companyId, (data) => {
    persistDefaults(data);
    const index = savedId ? data.orgTracks.findIndex((track) => track.id === savedId) : -1;
    if (index >= 0) {
      data.orgTracks[index] = {
        ...data.orgTracks[index],
        title: name,
        titleEn: String(titleEn || data.orgTracks[index].titleEn || name).trim(),
      };
      savedId = data.orgTracks[index].id;
      return;
    }
    savedId = `track_${Date.now().toString(36)}`;
    data.orgTracks.push({
      id: savedId,
      title: name,
      titleEn: String(titleEn || name).trim(),
      order: data.orgTracks.length,
    });
  });
  return savedId;
}

export function orgTrackUsage(data, id) {
  const seats = (data?.orgPositions || []).filter((item) => item.trackId === id);
  const grades = (data?.jobGrades || []).filter((item) => item.trackId === id);
  const titles = new Set(seats.map((item) => item.title).filter(Boolean));
  const gradeIds = new Set(grades.map((item) => item.id));
  const assigned = (data?.employees || []).filter((employee) => {
    const title = employee?.profile?.position || employee?.position || "";
    const gradeId = employee?.profile?.gradeId || "";
    return titles.has(title) || gradeIds.has(gradeId);
  }).length;
  return { seats: seats.length, grades: grades.length, assigned };
}

export function deleteOrgTrack(companyId, id, { cascade = false } = {}) {
  if (!companyId || !id) return { ok: false };
  let result = { ok: false };
  updateCompany(companyId, (data) => {
    persistDefaults(data);
    const usage = orgTrackUsage(data, id);
    if ((usage.seats || usage.grades) && !cascade) {
      result = { ok: false, used: true, ...usage };
      return;
    }
    if (data.orgTracks.length <= 1) {
      result = { ok: false, last: true, ...usage };
      return;
    }
    if (cascade) {
      const removedGradeIds = new Set(
        (data.jobGrades || []).filter((item) => item.trackId === id).map((item) => item.id),
      );
      data.orgPositions = (data.orgPositions || []).filter((item) => item.trackId !== id);
      data.jobGrades = (data.jobGrades || []).filter((item) => item.trackId !== id);
      (data.employees || []).forEach((employee) => {
        if (!removedGradeIds.has(employee?.profile?.gradeId)) return;
        employee.profile = { ...(employee.profile || {}), gradeId: null };
      });
    }
    data.orgTracks = data.orgTracks.filter((track) => track.id !== id);
    data.orgTracks.forEach((track, order) => { track.order = order; });
    result = { ok: true, nextId: data.orgTracks[0]?.id || "", ...usage };
  });
  return result;
}

export function moveOrgTrack(companyId, id, direction) {
  if (!companyId || !id) return;
  updateCompany(companyId, (data) => {
    persistDefaults(data);
    const list = [...data.orgTracks].sort((a, b) => (a.order || 0) - (b.order || 0));
    const index = list.findIndex((track) => track.id === id);
    const next = index + direction;
    if (index < 0 || next < 0 || next >= list.length) return;
    const swap = list[next];
    list[next] = list[index];
    list[index] = swap;
    list.forEach((track, order) => { track.order = order; });
    data.orgTracks = list;
  });
}
