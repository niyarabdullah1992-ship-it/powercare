import { profilePages } from "@/lib/powerCareProfileContent";
import { acwaProposalPages } from "@/lib/acwaProposalContent";

const screenByProfileNumber = {
  "06": "hr", "07": "employees", "08": "stations", "09": "attendance",
  "11": "tasks", "12": "chat", "13": "complaints", "15": "payroll",
  "16": "expenses", "17": "inventory", "18": "safety", "19": "files",
  "20": "signing", "21": "niro", "22": "dashboard", "24": "performance",
};

const platformPages = profilePages.slice(3, 24).map((item) => {
  const screenId = screenByProfileNumber[item.number];
  return { ...item, screenId, image: screenId ? null : item.image };
});

const conceptImages = [profilePages[0].image, profilePages[4].image, profilePages[2].image];
const opening = acwaProposalPages.slice(0, 3).map((item, index) => ({
  ...item,
  kind: index === 0 ? "cover" : undefined,
  image: conceptImages[index],
}));

const pilotVisuals = ["dashboard", null, "hr", null, "security", "reports", null, null];
const pilotImages = [null, profilePages[1].image, null, profilePages[3].image, null, null, profilePages[2].image, profilePages[4].image];
const pilot = acwaProposalPages.slice(4).map((item, index) => ({
  ...item,
  screenId: pilotVisuals[index],
  image: pilotImages[index],
}));

const closing = {
  ...profilePages[24],
  eyebrow: "ACWA POWER • PROPOSED NEXT STEP",
  titleAr: "ابدأ بتجربة محدودة، وتوسع بالدليل",
  titleEn: "Start focused. Scale with evidence.",
  summaryAr: "الخطوة المقترحة هي ورشة نطاق مشتركة لاختيار الموقع وحالات الاستخدام والمستخدمين وخط الأساس، ثم اعتماد ميثاق مشروع تجريبي لمدة 12 أسبوعًا.",
  summaryEn: "The proposed next step is a joint scoping workshop to select the site, use cases, users and baseline, followed by approval of a 12-week pilot charter.",
  bulletsAr: ["اختيار موقع تجريبي واحد", "تسمية المالك التنفيذي والتشغيلي", "اعتماد ثلاث حالات استخدام", "تحديد مقاييس النجاح", "بدء التنفيذ وفق جدول مشترك"],
  bulletsEn: ["Select one pilot site", "Name executive and operational owners", "Approve three use cases", "Define success measures", "Launch on a joint schedule"],
};

export const acwaComprehensivePages = [...opening, ...platformPages, ...pilot, closing].map((item, index, all) => ({
  ...item,
  number: String(index + 1).padStart(2, "0"),
  total: all.length,
}));