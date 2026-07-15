// Content of the official copyright registration document (SAIP) —
// program description + representative source-code excerpts.

export const AUTHOR = {
  nameAr: "نيار عبدالله سويلم الرنياوي",
  nameEn: "NIYAR ABDULLAH SUWAILEM ALRANIAWI",
};

export const PROGRAM = {
  nameAr: "باور كير — PowerCare",
  nameEn: "PowerCare",
};

export const DESCRIPTION_SECTIONS = [
  {
    title: "فكرة البرنامج",
    body: "«باور كير» (PowerCare) منصة رقمية سحابية متكاملة لإدارة الشركات والموارد البشرية، صُممت لتمكين المؤسسات من إدارة موظفيها ومحطات عملها ومهامها اليومية من مكان واحد. يقوم البرنامج على فكرة ربط الحضور الوظيفي بالموقع الجغرافي الفعلي للموظف: فلا يُقبل تسجيل الحضور إلا إذا كان الموظف داخل النطاق الجغرافي المحدد لمقر عمله، مع تحديد نطاق المسافة المسموح لكل محطة عمل على الخريطة. كما تدعم المنصة نمط «المساحة الشخصية» للأفراد، بأدوات إنتاجية شخصية تشمل مخطط اليوم، ويوميات الحياة، والتقويم الشهري.",
  },
  {
    title: "المكونات الرئيسية",
    body: "1) نظام حضور وانصراف مرتبط بالموقع الجغرافي (GPS) مع خرائط تفاعلية وتقارير شهرية.\n2) نظام مهام هرمي بمجلدات قابلة للتخصيص لكل محطة، مع تصعيد تلقائي للمهام الحرجة، وأرشيف ذكي يصنف المهام حسب مدتها (سنوية/نصفية/ربعية/شهرية).\n3) هيكل موارد بشرية مرن بدرجات وصلاحيات قابلة للتخصيص، يشكل سلسلة تصعيد للشكاوى والاعتراضات، مع نظام بلاغات مجهولة الهوية محمية بتشفير أحادي الاتجاه.\n4) نظام توقيع إلكتروني للمستندات: توقيع شخصي (كتابةً أو رسمًا) برقم تحقق مشفّر فريد (SHA-256)، وتوقيع متعدد الأطراف عبر روابط خاصة، والتحقق من صحة المستندات الموقعة.\n5) مساعد ذكاء اصطناعي «نيرو» يجيب عن أسئلة الإدارة، ويولّد ملخصات يومية ذكية، واقتراحات تنبيهية تلقائية.\n6) دعم 9 لغات مع اتجاه كتابة تلقائي (RTL) للعربية، وتقارير قابلة للتصدير PDF/Excel بهوية الشركة البصرية.\n7) نظام اشتراكات وخطط أسعار مع بوابة دفع إلكترونية (Stripe).",
  },
  {
    title: "البنية التقنية",
    body: "بُني البرنامج بتقنية React مع Vite للواجهة الأمامية، وTailwind CSS لنظام التصميم، وقاعدة بيانات سحابية (Supabase وBase44) للتخزين والمزامنة اللحظية، ووظائف خلفية (Backend Functions) بتقنية Deno للتكاملات الخارجية: البريد الإلكتروني عبر Gmail، وتقويم Google، وخدمات الموقع الجغرافي، وبوابة الدفع Stripe. يعتمد النظام عزلًا كاملًا لبيانات كل شركة (Multi-Tenancy) وجلسات دخول مشفّرة مع تحقق ثنائي عبر رمز OTP بالبريد الإلكتروني.",
  },
];

// Representative source-code excerpts (the full source exceeds 200 files).
export const CODE_FILES = [
  {
    name: "src/App.jsx — موجّه التطبيق الرئيسي (Application Router)",
    code: `import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { AuthProvider as PowerCareAuthProvider, useAuth as usePowerCareAuth } from '@/lib/PowerCareAuth';
import Layout from '@/components/Layout';
import { lazy, Suspense } from 'react';
import Landing from './pages/Landing';

const Dashboard = lazy(() => import('./pages/Dashboard'));
const MyTasks = lazy(() => import('./pages/MyTasks'));
const Attendance = lazy(() => import('./pages/Attendance'));
const FileSigning = lazy(() => import('./pages/FileSigning'));
const HR = lazy(() => import('./pages/HR'));

function RequireAuth({ children }) {
  const { session } = usePowerCareAuth();
  if (!session) return <Navigate to="/" replace />;
  return <Layout>{children}</Layout>;
}

function AppRoutes() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/sign" element={<PublicSign />} />
        <Route path="/verify" element={<Verify />} />
        <Route path="/app" element={<RequireAuth><Dashboard /></RequireAuth>} />
        <Route path="/app/tasks" element={<RequireAuth><MyTasks /></RequireAuth>} />
        <Route path="/app/attendance" element={<RequireAuth><Attendance /></RequireAuth>} />
        <Route path="/app/signing" element={<RequireAuth><FileSigning /></RequireAuth>} />
        <Route path="/app/hr" element={<RequireAuth><HR /></RequireAuth>} />
      </Routes>
    </Suspense>
  );
}`,
  },
  {
    name: "src/components/files/MySignatureCard.jsx — التوقيع الإلكتروني برقم تحقق مشفّر",
    code: `// DocuSign-style unique signature ID: a non-reversible SHA-256 hash of the
// signer + timestamp, formatted as PWC-XXXX-XXXX-XXXX for verification.
async function generateSignatureId(userId) {
  const data = new TextEncoder().encode(\`\${userId}::\${Date.now()}::\${Math.random()}\`);
  const hash = await crypto.subtle.digest("SHA-256", data);
  const hex = [...new Uint8Array(hash)]
    .map((b) => b.toString(16).padStart(2, "0")).join("").toUpperCase();
  return \`PWC-\${hex.slice(0, 4)}-\${hex.slice(4, 8)}-\${hex.slice(8, 12)}\`;
}

const saveSignature = async (dataUrl, typedName) => {
  setSaving(true);
  try {
    const blob = dataUrlToBlob(dataUrl);
    const file = new File([blob], "signature.png", { type: "image/png" });
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    const sigId = await generateSignatureId(currentUser.id);
    const savedProfile = {
      signatureUrl: file_url,
      signatureId: sigId,
      signatureName: typedName || currentUser.name,
      signatureUpdatedAt: new Date().toISOString(),
    };
    updateEmployeeProfile(companyId, currentUser.id, savedProfile);
    onSaved?.(savedProfile);
    setEditing(false);
  } finally {
    setSaving(false);
  }
};`,
  },
  {
    name: "src/components/dashboard/StationsMapCard.jsx — خريطة مقرات العمل التلقائية",
    code: `import { MapContainer, TileLayer, CircleMarker, Tooltip } from "react-leaflet";
import { resolveStationPositions } from "@/lib/geocodeStations";

// Stations without a pinned GPS point are placed automatically from the
// coordinates or city name written in their "location" field.
export default function StationsMapCard({ stations, t }) {
  const [located, setLocated] = useState(null);

  useEffect(() => {
    let cancelled = false;
    resolveStationPositions(stations).then((rows) => {
      if (!cancelled) setLocated(rows);
    });
    return () => { cancelled = true; };
  }, [stations.map((s) => s.id).join("|")]);

  const rows = located || [];
  const center = rows.length ? [rows[0].lat, rows[0].lng] : [24.7136, 46.6753];

  return (
    <MapContainer center={center} zoom={rows.length > 1 ? 5 : 11}>
      <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />
      {rows.map((s) => (
        <CircleMarker key={s.id} center={[s.lat, s.lng]} radius={8}
          pathOptions={{ color: "#a9782f", fillColor: "#c99b4f", fillOpacity: 0.9 }}>
          <Tooltip>{s.name}</Tooltip>
        </CircleMarker>
      ))}
    </MapContainer>
  );
}`,
  },
  {
    name: "src/components/mobile/PullToRefresh.jsx — إيماءة السحب للتحديث (تجربة تطبيق أصلي)",
    code: `// Native-style pull-to-refresh: swipe down from the top of the page to
// trigger onRefresh. touchmove is registered { passive: false } so
// preventDefault() suppresses the native overscroll only while dragging
// down from the very top (window.scrollY === 0).
const onTouchMove = (e) => {
  if (startY.current == null || refreshingRef.current) return;
  if (window.scrollY !== 0) { reset(); return; }
  const dy = e.touches[0].clientY - startY.current;
  if (dy > 0) {
    pulling.current = true;
    if (e.cancelable) e.preventDefault();
    setPullBoth(Math.min(dy * 0.4, 90));
  } else if (!pulling.current) {
    startY.current = null;
  }
};

const onTouchEnd = async () => {
  const finalPull = pullRef.current;
  startY.current = null;
  if (finalPull >= 45) {
    refreshingRef.current = true;
    setRefreshing(true);
    try { await onRefreshRef.current?.(); } finally {
      refreshingRef.current = false;
      setRefreshing(false);
      setPullBoth(0);
    }
  } else {
    setPullBoth(0);
  }
};`,
  },
  {
    name: "src/lib/sectionGuides.js — نظام الشروحات التفاعلية لكل قسم",
    code: `// Per-section usage guides shown at the top of every app page.
const GUIDES = {
  "/app/attendance": {
    ar: ["سجّل حضورك بزر «تسجيل حضور» — قد يُطلب تحديد موقعك للتحقق من وجودك في المقر.",
         "من «الإعدادات» حدد مواقع المقرات على الخريطة ونطاق المسافة المسموح."],
    en: ["Check in with the Check-In button — GPS verifies you are on site.",
         "In Settings, set workplace locations and the allowed radius."],
  },
  "/app/signing": {
    ar: ["احفظ توقيعك مرة واحدة — يحصل على رقم تحقق مشفّر فريد.",
         "لتواقيع عدة أطراف استخدم «طلب تواقيع متعددة» — كل طرف يوقّع من رابط خاص به."],
    en: ["Save your signature once — it gets a unique encrypted ID.",
         "For multiple parties use Multi-Sign — each signer gets their own link."],
  },
};

export function getGuide(pathname, lang) {
  const guide = GUIDES[pathname];
  if (!guide) return null;
  return lang === "ar" ? guide.ar : guide.en;
}`,
  },
];