// مصدر واحد لمصطلحات الجهة: شركة أو جهة حكومية.
// كل الصفحات تقرأ المصطلحات من هنا ولا تكتبها داخلها.

const TERMS = {
  company: {
    ar: { unit: "محطة", units: "المحطات", site: "الفرع", sites: "الفروع", head: "الرئيس التنفيذي", byUnits: "حسب الإدارات", bySites: "حسب المقرات", levels: ["قطاع", "إدارة عامة", "إدارة", "قسم"] },
    en: { unit: "Station", units: "Stations", site: "Branch", sites: "Branches", head: "Chief Executive Officer", byUnits: "By departments", bySites: "By sites", levels: ["Sector", "General department", "Department", "Section"] },
  },
  gov: {
    ar: { unit: "دائرة", units: "الدوائر", site: "المقر", sites: "المقرات", head: "معالي الوزير", byUnits: "حسب الإدارات", bySites: "حسب المقرات", levels: ["وكالة", "إدارة عامة", "إدارة", "قسم"] },
    en: { unit: "Directorate", units: "Directorates", site: "Headquarters", sites: "Headquarters", head: "His Excellency the Minister", byUnits: "By departments", bySites: "By headquarters", levels: ["Deputyship", "General department", "Department", "Section"] },
  },
};

export function getOrgType(data) {
  return data?.orgType === "gov" ? "gov" : "company";
}

export function orgTerms(data, lang) {
  return TERMS[getOrgType(data)][lang === "ar" ? "ar" : "en"];
}