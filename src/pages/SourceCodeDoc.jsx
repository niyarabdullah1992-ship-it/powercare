import React, { useState, useEffect } from "react";
import { Printer, Loader2, FileCode2 } from "lucide-react";

// مستند الكود المصدري الكامل — لتسجيل حقوق الملكية الفكرية (المصنفات).
// يجمع كل ملفات المشروع (واجهة + خلفية + إعدادات) نصًا كاملًا في صفحة واحدة
// قابلة للطباعة/الحفظ PDF، مع صفحة غلاف تتضمن بيانات المصنف المطلوبة.
const FILE_MODULES = import.meta.glob(
  [
    "/index.html",
    "/package.json",
    "/tailwind.config.js",
    "/vite.config.js",
    "/src/**/*.{js,jsx,css,ts}",
    "/base44/**/*.{ts,jsonc}",
  ],
  { query: "?raw", import: "default" }
);

export default function SourceCodeDoc() {
  const [files, setFiles] = useState(null);
  const [author, setAuthor] = useState("");

  useEffect(() => {
    document.title = "PowerCare — Source Code / الكود المصدري الكامل";
    (async () => {
      const paths = Object.keys(FILE_MODULES).sort();
      const loaded = [];
      for (const p of paths) {
        try {
          const content = await FILE_MODULES[p]();
          loaded.push({ path: p.replace(/^\//, ""), content: String(content) });
        } catch {
          // skip unreadable file
        }
      }
      setFiles(loaded);
    })();
  }, []);

  const totalLines = (files || []).reduce((sum, f) => sum + f.content.split("\n").length, 0);

  return (
    <div dir="rtl" className="min-h-screen bg-white text-black">
      <style>{`
        @page { size: A4 portrait; margin: 12mm; }
        @media print { .no-print { display: none !important; } }
        .code-block { direction: ltr; text-align: left; font-family: "Courier New", monospace; font-size: 8.5px; line-height: 1.45; white-space: pre-wrap; word-break: break-all; background: #faf8f5; border: 1px solid #e5ddd0; padding: 10px; }
        .file-head { break-inside: avoid; }
      `}</style>

      {/* شريط التحكم — لا يظهر في الطباعة */}
      <div className="no-print sticky top-0 z-10 bg-white border-b border-gray-200 px-6 py-3 flex flex-wrap items-center gap-3">
        <FileCode2 className="w-5 h-5 text-amber-700" />
        <p className="text-sm font-semibold">مستند الكود المصدري الكامل — للتسجيل في حقوق الملكية الفكرية</p>
        <input
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
          placeholder="اسم المؤلف / المبرمج (كما في الطلب)"
          className="px-3 py-1.5 rounded-md border border-gray-300 text-sm w-72"
        />
        <button
          onClick={() => window.print()}
          disabled={!files}
          className="flex items-center gap-1.5 px-4 py-2 rounded-md bg-black text-white text-sm disabled:opacity-50"
        >
          <Printer className="w-4 h-4" /> طباعة / حفظ PDF
        </button>
        {!files && (
          <span className="flex items-center gap-1.5 text-xs text-gray-500">
            <Loader2 className="w-3.5 h-3.5 animate-spin" /> جاري تجميع كل ملفات الكود…
          </span>
        )}
      </div>

      <div className="max-w-[190mm] mx-auto px-6 py-10">
        {/* صفحة الغلاف — بيانات المصنف */}
        <div className="border-2 border-black p-10 mb-10" style={{ breakAfter: "page" }}>
          <p className="text-xs tracking-widest text-amber-800 font-bold mb-4">SOURCE CODE DEPOSIT — نسخة إيداع الكود المصدري</p>
          <h1 className="text-3xl font-bold mb-2">منصة PowerCare</h1>
          <p className="text-sm text-gray-700 mb-8">نظام سحابي متكامل لإدارة المحطات، الموارد البشرية، الحضور بالموقع الجغرافي، المهام، السلامة، والتوقيع الرقمي للمستندات.</p>

          <table className="w-full text-sm border-collapse">
            <tbody>
              {[
                ["اسم المصنف", "PowerCare — منصة إدارة المحطات والقوى العاملة"],
                ["اسم المؤلف / المبرمج", author || "……………………………………"],
                ["لغة/لغات البرمجة المستخدمة", "JavaScript (React JSX)، TypeScript، HTML، CSS (Tailwind)، JSON"],
                ["نظام التشغيل", "مستقل عن نظام التشغيل — يعمل عبر المتصفح على Windows، macOS، Linux، Android، iOS"],
                ["بيئة التشغيل", "ويب / سحابي (SaaS) — واجهة React + خدمات خلفية سحابية (Deno / قاعدة بيانات سحابية)"],
                ["عدد الملفات المصدرية", files ? `${files.length} ملفًا` : "…"],
                ["إجمالي أسطر الكود", files ? `${totalLines.toLocaleString("en-US")} سطرًا` : "…"],
                ["تاريخ إصدار هذه النسخة", new Date().toLocaleDateString("ar-SA")],
              ].map(([k, v]) => (
                <tr key={k}>
                  <td className="border border-gray-400 bg-gray-50 font-semibold p-2.5 w-56">{k}</td>
                  <td className="border border-gray-400 p-2.5">{v}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <p className="text-xs text-gray-600 mt-8 leading-relaxed">
            يحتوي هذا المستند على النسخة الكاملة وغير المنقوصة من الأكواد المصدرية للبرنامج، مرتبة حسب مسار كل ملف داخل المشروع،
            من أول ملف حتى آخر ملف — لأغراض إيداع وتسجيل حقوق الملكية الفكرية.
          </p>
        </div>

        {/* فهرس الملفات */}
        {files && (
          <div className="mb-10" style={{ breakAfter: "page" }}>
            <h2 className="text-xl font-bold border-b-2 border-black pb-2 mb-4">فهرس الملفات ({files.length})</h2>
            <ol dir="ltr" className="text-[10px] font-mono leading-5 list-decimal list-inside columns-2">
              {files.map((f) => (
                <li key={f.path}>{f.path}</li>
              ))}
            </ol>
          </div>
        )}

        {/* الكود الكامل ملفًا ملفًا */}
        {files ? (
          files.map((f, i) => (
            <div key={f.path} className="mb-6">
              <div className="file-head flex items-baseline justify-between border-b-2 border-black pb-1 mb-2" dir="ltr">
                <p className="font-mono text-[11px] font-bold">{i + 1}. {f.path}</p>
                <p className="font-mono text-[9px] text-gray-500">{f.content.split("\n").length} lines</p>
              </div>
              <div className="code-block">{f.content}</div>
            </div>
          ))
        ) : (
          <div className="flex items-center justify-center gap-2 py-20 text-gray-500">
            <Loader2 className="w-5 h-5 animate-spin" /> جاري تحميل الكود المصدري الكامل…
          </div>
        )}

        {files && (
          <div className="border-t-2 border-black pt-4 mt-10 text-xs text-gray-600 flex justify-between">
            <span>PowerCare — نهاية الكود المصدري ({files.length} ملفًا • {totalLines.toLocaleString("en-US")} سطرًا)</span>
            <span>{new Date().toLocaleDateString("ar-SA")}</span>
          </div>
        )}
      </div>
    </div>
  );
}