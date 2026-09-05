import React from "react";
import { idTypeLabel } from "@/components/workproof/CrewEditor";

// Printable two-sheet work-proof certificate: page 1 = the work record,
// page 2 = photo evidence + the two signatures (employee then client).
const Sheet = ({ children }) => (
  <section className="guide-page mx-auto w-[794px] max-w-full bg-white p-10 text-[#1b2a3b]" style={{ fontFamily: "'Noto Kufi Arabic', 'Inter Tight', sans-serif" }}>
    {children}
  </section>
);

const Table = ({ head, rows }) => (
  <table className="w-full border-collapse text-[11px]">
    <thead>
      <tr className="bg-[#f4efe4]">
        {head.map((h) => <th key={h} className="border border-[#e2d9c6] px-2 py-2 font-semibold">{h}</th>)}
      </tr>
    </thead>
    <tbody>
      {rows.map((row, i) => (
        <tr key={i}>{row.map((cell, j) => <td key={j} className="border border-[#e2d9c6] px-2 py-2 text-center">{cell || "—"}</td>)}</tr>
      ))}
    </tbody>
  </table>
);

const Box = ({ label, value }) => (
  <div className="rounded-lg border border-[#e2d9c6] bg-[#faf7f0] px-3 py-2">
    <p className="text-[9px] text-[#8a7c63]">{label}</p>
    <p className="mt-1 text-[13px] font-semibold">{value ?? "—"}</p>
  </div>
);

const Caption = ({ children }) => <p className="mb-2 mt-6 text-[11px] font-bold text-[#8a6d3b]">{children}</p>;

export default function ProofCertificate({ proof, stationName, companyName, ar, innerRef }) {
  const t = (a, e) => (ar ? a : e);
  const photos = [...(proof.beforeImageUrls || []), ...(proof.afterImageUrls || [])];

  return (
    <div ref={innerRef} dir={ar ? "rtl" : "ltr"} className="space-y-6 bg-[#f3f2ef] py-6">
      <Sheet>
        <header className="flex items-start justify-between rounded-xl bg-[#16263a] px-6 py-5 text-white">
          <div>
            <h1 className="font-heading text-2xl font-bold">{t("شهادة إثبات عمل", "Work Proof Certificate")}</h1>
            <p className="mt-1 text-[11px] text-white/70">{companyName} — {stationName}</p>
          </div>
          <p className="font-mono text-[11px] text-[#d9b26a]">{proof.proofNumber}</p>
        </header>

        <div className="mt-5 grid grid-cols-4 gap-3">
          <Box label={t("المحطة", "Station")} value={stationName} />
          <Box label={t("تاريخ العمل", "Work date")} value={proof.workDate} />
          <Box label={t("أيام مخططة", "Planned days")} value={proof.plannedDays} />
          <Box label={t("أيام فعلية", "Actual days")} value={proof.actualDays} />
        </div>

        <Caption>{t("وصف العمل المنفَّذ", "Work description")}</Caption>
        <p className="rounded-lg border border-[#e2d9c6] bg-[#faf7f0] p-3 text-[12px] leading-6">{proof.workTitle}{proof.workDescription ? ` — ${proof.workDescription}` : ""}</p>

        <Caption>{t("العمال المنفذون", "Crew on site")}</Caption>
        <Table
          head={[t("الاسم", "Name"), t("نوع الهوية", "ID type"), t("رقم الهوية", "ID number"), t("الجوال", "Phone")]}
          rows={(proof.workers || []).map((w) => [w.name, idTypeLabel(w.idType, ar), w.idNumber, w.phone])}
        />

        <Caption>{t("المركبات الداخلة للموقع", "Vehicles entering site")}</Caption>
        <Table
          head={[t("رقم اللوحة", "Plate"), t("النوع", "Type"), t("الطراز", "Make / model"), t("السائق", "Driver")]}
          rows={(proof.vehicles || []).map((v) => [v.plate, v.type, [v.make, v.model, v.year].filter(Boolean).join(" "), v.driverName])}
        />

        <p className="mt-8 border-t border-[#e2d9c6] pt-3 text-center text-[9px] text-[#8a7c63]">
          {t("شهادة إثبات عمل صادرة من منصة", "Work proof certificate issued by")} PowerCare — {proof.proofNumber} · {t("صفحة ١ من ٢", "Page 1 of 2")}
        </p>
      </Sheet>

      <Sheet>
        <div className="flex items-baseline justify-between border-b border-[#e2d9c6] pb-3">
          <h2 className="font-heading text-xl font-bold">{t("الإثبات المصوَّر والاعتماد", "Photo evidence & approval")}</h2>
          <p className="font-mono text-[10px] text-[#8a7c63]">{proof.proofNumber}</p>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          {(photos.length ? photos.slice(0, 4) : [null, null, null, null]).map((url, i) => (
            <div key={i} className="flex h-40 items-center justify-center overflow-hidden rounded-lg border border-[#e2d9c6] bg-[#f0ece2]">
              {url ? <img src={url} alt="" crossOrigin="anonymous" className="h-full w-full object-cover" /> : <span className="text-[10px] text-[#b3a68c]">{t("لا توجد صورة", "No photo")}</span>}
            </div>
          ))}
        </div>

        <p className="mt-4 rounded-lg border border-[#e2d9c6] bg-[#faf7f0] p-3 text-[11px] leading-6">
          {t(
            "أقر بأن الأعمال الموضحة أعلاه نُفِّذت في الموقع وفق الوصف والصور المرفقة، وأن هذه الشهادة تُعد إثباتًا رسميًا للعمل المنجز.",
            "The works described above were executed on site as documented, and this certificate serves as formal proof of the completed work."
          )}
        </p>

        <div className="mt-5 grid grid-cols-2 gap-4">
          <div className="rounded-lg border border-[#e2d9c6] bg-[#faf7f0] p-4">
            <p className="text-[9px] text-[#8a7c63]">{t("توقيع المنفِّذ", "Executed by")}</p>
            <div className="mt-2 flex h-24 items-center justify-center rounded-md border border-[#e2d9c6] bg-white text-center text-[10px] text-[#8a6d3b]">
              {proof.employeeSignatureUrl
                ? <img src={proof.employeeSignatureUrl} alt="employee signature" crossOrigin="anonymous" className="h-full object-contain" />
                : t("اعتماد داخلي — تم توثيق العمل", "Internal approval — work documented")}
            </div>
            <p className="mt-2 text-[12px] font-bold">{proof.performedByName}</p>
            <p className="text-[10px] text-[#8a7c63]">{(proof.employeeSignedAt || proof.closedAt) ? new Date(proof.employeeSignedAt || proof.closedAt).toLocaleString(ar ? "ar" : "en") : proof.workDate}</p>
          </div>

          <div className="rounded-lg border border-[#e2d9c6] bg-[#faf7f0] p-4">
            <p className="text-[9px] text-[#8a7c63]">{t("توقيع ممثل العميل", "Client representative")}</p>
            <div className="mt-2 flex h-24 items-center justify-center rounded-md border border-[#e2d9c6] bg-white">
              {proof.clientSignatureUrl
                ? <img src={proof.clientSignatureUrl} alt="signature" crossOrigin="anonymous" className="h-full object-contain" />
                : <span className="text-[10px] text-[#b3a68c]">{t("بانتظار توقيع العميل", "Awaiting client signature")}</span>}
            </div>
            <p className="mt-2 text-[12px] font-bold">{proof.clientName || "—"}{proof.clientTitle ? ` — ${proof.clientTitle}` : ""}</p>
            <p className="text-[10px] text-[#8a7c63]">{proof.clientEmail || ""}</p>
            <p className="text-[10px] text-[#8a7c63]">{proof.signedAt ? new Date(proof.signedAt).toLocaleString(ar ? "ar" : "en") : ""}</p>
          </div>
        </div>

        <div className="mt-5 rounded-lg border border-[#e2d9c6] bg-white p-3">
          <p className="text-[9px] font-bold text-[#8a6d3b]">{t("التحقق من الشهادة", "Certificate verification")}</p>
          <p className="mt-1 break-all font-mono text-[9px] text-[#6b6250]">{proof.id}</p>
          <p className="mt-1 text-[9px] text-[#8a7c63]">
            {proof.signedAt
              ? t("موثّقة بتوقيع العميل إلكترونيًا — غير قابلة للتعديل.", "Sealed with the client's electronic signature — immutable.")
              : t("مسودة — تصبح موثّقة بعد توقيع العميل.", "Draft — sealed once the client signs.")}
          </p>
        </div>

        <p className="mt-6 text-center text-[9px] text-[#8a7c63]">{t("صفحة ٢ من ٢", "Page 2 of 2")}</p>
      </Sheet>
    </div>
  );
}