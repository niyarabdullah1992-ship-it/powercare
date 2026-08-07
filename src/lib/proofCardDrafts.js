// مسودات بطاقات العميل تُحفظ محليًا لكل محطة حتى لا تضيع عند تحديث الصفحة.
const key = (companyId, stationId) => `powercare_proof_cards_${companyId || "c"}_${stationId || "s"}`;

export function loadProofCards(companyId, stationId) {
  if (!stationId) return [];
  try {
    const raw = localStorage.getItem(key(companyId, stationId));
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveProofCards(companyId, stationId, cards) {
  if (!stationId) return;
  try {
    if (cards?.length) localStorage.setItem(key(companyId, stationId), JSON.stringify(cards));
    else localStorage.removeItem(key(companyId, stationId));
  } catch {
    // تجاهل امتلاء مساحة التخزين
  }
}