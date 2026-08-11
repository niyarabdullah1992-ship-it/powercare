import React, { useEffect, useState } from "react";
import { Check, Loader2, Upload } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { checkPublicApplyGate } from "@/lib/hiringDerivations";
import {
  CAREERS_ROLE_SECTIONS,
  CAREERS_SAMPLE_ROLES,
  CAREERS_STEPS,
} from "@/lib/careersContent";

async function hiringPublic(payload) {
  const res = await base44.functions.invoke("hiring", payload);
  return res?.data ?? res;
}

function FactChip({ value, label }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-[9px] border border-[#E2E8F0] bg-white px-3 py-1.5 text-[12px] text-[#5A6B85]">
      <span className="font-semibold text-[#14284B]">{value}</span>
      <span>{label}</span>
    </span>
  );
}

export default function CareersIntake({
  ar,
  companyId,
  initialJobKey,
  onJobChange,
}) {
  const [loading, setLoading] = useState(Boolean(companyId));
  const [company, setCompany] = useState(null);
  const [vacancies, setVacancies] = useState([]);
  const [error, setError] = useState(null);
  const [jobKey, setJobKey] = useState(initialJobKey || "");
  const [form, setForm] = useState({
    name: "",
    nameEn: "",
    nationalId: "",
    phone: "",
    email: "",
    nat: "saudi",
    cvName: "",
  });
  const [busy, setBusy] = useState(false);
  const [sentRef, setSentRef] = useState(null);
  const [gateMsg, setGateMsg] = useState(null);
  const [demoNotify, setDemoNotify] = useState("");
  const [demoNotified, setDemoNotified] = useState(false);

  const live = Boolean(companyId);

  useEffect(() => {
    if (!companyId) {
      setLoading(false);
      setCompany(null);
      setVacancies([]);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const remote = await hiringPublic({ action: "publicList", companyId });
        if (cancelled) return;
        if (remote?.error) {
          setError(ar ? (remote.reason || remote.error) : (remote.reasonEn || remote.reason || remote.error));
          setVacancies([]);
          setCompany(null);
        } else {
          setCompany(remote.company || { companyId, name: companyId });
          setVacancies(remote.vacancies || []);
          const keys = (remote.vacancies || []).map((v) => v.key);
          if (initialJobKey && keys.includes(initialJobKey)) setJobKey(initialJobKey);
          else if (keys.length && !keys.includes(jobKey)) setJobKey(keys[0]);
        }
      } catch (err) {
        if (!cancelled) {
          setError(String(err?.message || err));
          setVacancies([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reload on tenant / lang only
  }, [companyId, ar]);

  useEffect(() => {
    if (initialJobKey) setJobKey(initialJobKey);
  }, [initialJobKey]);

  const selectJob = (key) => {
    setJobKey(key);
    setSentRef(null);
    setGateMsg(null);
    onJobChange?.(key);
  };

  const liveJob = vacancies.find((v) => v.key === jobKey) || vacancies[0] || null;
  const sampleJob =
    CAREERS_SAMPLE_ROLES.find((r) => r.key === jobKey) || CAREERS_SAMPLE_ROLES[0];
  const hasJob = live ? Boolean(liveJob) : Boolean(sampleJob);
  const isNone = live && !loading && vacancies.length === 0;

  const title = live
    ? liveJob?.title || (ar ? "لا شواغر معلنة حاليًا" : "No vacancies advertised")
    : ar
      ? sampleJob.titleAr
      : sampleJob.titleEn;

  const facts = live && liveJob
    ? [
        { value: liveJob.stationName, label: ar ? "الموقع" : "Location" },
        { value: ar ? "دوام كامل" : "Full time", label: ar ? "نوع التعاقد" : "Contract" },
        { value: liveJob.grade, label: ar ? "الدرجة" : "Grade" },
        {
          value: liveJob.saudiFirst ? (ar ? "سعودة أولًا" : "Saudi-first") : (ar ? "مفتوح" : "Open"),
          label: ar ? "القناة" : "Channel",
        },
      ]
    : [
        { value: ar ? sampleJob.stationAr : sampleJob.stationEn, label: ar ? "الموقع" : "Location" },
        { value: ar ? sampleJob.contractAr : sampleJob.contractEn, label: ar ? "نوع التعاقد" : "Contract" },
        { value: sampleJob.grade, label: ar ? "الدرجة" : "Grade" },
        { value: ar ? sampleJob.expAr : sampleJob.expEn, label: ar ? "الخبرة" : "Experience" },
      ];

  const others = live
    ? vacancies.filter((v) => v.key !== (liveJob?.key || jobKey)).slice(0, 4)
    : CAREERS_SAMPLE_ROLES.filter((r) => r.key !== sampleJob.key);

  const submit = async (e) => {
    e.preventDefault();
    setGateMsg(null);
    if (!live) {
      setGateMsg(
        ar
          ? "هذه صفحة تعريفية. افتح رابط الشركة من التوظيف لإرسال طلب حقيقي إلى طابور التوظيف."
          : "This is the product surface. Open a company careers link from Recruitment to submit a real application into the hiring queue.",
      );
      return;
    }
    if (!liveJob) {
      setGateMsg(ar ? "لا يوجد شاغر مفتوح للتقديم." : "No open vacancy to apply for.");
      return;
    }
    const gate = checkPublicApplyGate({
      name: form.name,
      phone: form.phone,
      vacancyKey: liveJob.key,
    });
    if (!gate.ok) {
      setGateMsg(ar ? gate.reason : gate.reasonEn);
      return;
    }
    setBusy(true);
    try {
      const remote = await hiringPublic({
        action: "publicApply",
        companyId,
        vacancyKey: liveJob.key,
        name: form.name,
        nameEn: form.nameEn,
        phone: form.phone,
        email: form.email,
        nationalId: form.nationalId,
        nat: form.nat,
        cvName: form.cvName,
        saudi: form.nat !== "other",
      });
      if (remote?.error) {
        setGateMsg(ar ? (remote.reason || remote.error) : (remote.reasonEn || remote.reason || remote.error));
      } else if (remote?.ref) {
        setSentRef(remote.ref);
      } else {
        setGateMsg(ar ? "تعذّر إرسال الطلب." : "Could not submit the application.");
      }
    } catch (err) {
      setGateMsg(String(err?.message || err));
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-[#5A6B85]">
        <Loader2 className="h-6 w-6 animate-spin text-[#0E7A4B]" />
      </div>
    );
  }

  return (
    <div className="careers-intake mx-auto max-w-[960px] px-5 pb-16 pt-8 sm:px-6">
      {live && company?.name ? (
        <p className="text-[13px] font-semibold text-[#14284B]">
          <span className="font-normal text-[#5A6B85]">{ar ? "الوظائف" : "Careers"}</span>
          {" · "}
          {company.name}
        </p>
      ) : (
        <p className="text-[13px] text-[#5A6B85]">
          {ar
            ? "قناة عامة للمتقدمين — بلا حساب موظف وبلا كلمة مرور."
            : "Public candidate channel — no employee account, no password."}
        </p>
      )}

      {live && liveJob ? (
        <p dir="ltr" className="mt-3 font-mono text-[11px] text-[#5A6B85]" style={{ textAlign: ar ? "right" : "left" }}>
          nirovera / careers / {liveJob.key}
        </p>
      ) : null}

      <h1 className="mt-2 font-heading text-[28px] font-semibold leading-tight tracking-[-0.02em] text-[#14284B] sm:text-[30px] text-pretty">
        {title}
      </h1>

      {hasJob && !isNone ? (
        <div className="mt-3.5 flex flex-wrap gap-2">
          {facts.map((f) => (
            <FactChip key={f.label} value={f.value} label={f.label} />
          ))}
        </div>
      ) : null}

      {error ? (
        <div className="mt-4 rounded-[14px] border border-[#FECACA] bg-[#FEF2F2] px-4 py-3 text-[13px] text-[#B91C1C]">
          {error}
        </div>
      ) : null}

      {isNone ? (
        <div className="careers-panel mt-5 max-w-[620px] rounded-[14px] border border-[#E2E8F0] bg-white px-6 py-6">
          <p className="text-[13px] leading-relaxed text-[#5A6B85]">
            {ar
              ? `لا شواغر معلنة في ${company?.name || "هذه الشركة"} حاليًا. اترك بريدك لنُعلمك عند فتح شاغر.`
              : `No vacancies currently posted at ${company?.name || "this company"}. Leave your email and we will notify you when a role opens.`}
          </p>
          {demoNotified ? (
            <div className="mt-3.5 rounded-[10px] border border-[#BBF7D0] bg-[#ECFDF3] px-3 py-2.5 text-[12px] text-[#166534]">
              {ar ? "سجّلنا طلب الإشعار — بلا حساب." : "Notification request noted — no account created."}
            </div>
          ) : (
            <div className="mt-3.5 flex flex-wrap gap-2">
              <input
                type="email"
                value={demoNotify}
                onChange={(e) => setDemoNotify(e.target.value)}
                placeholder={ar ? "بريدك" : "Your email"}
                className="h-10 min-w-[200px] flex-1 rounded-[10px] border border-[#E2E8F0] bg-[#F7F8FA] px-3 text-[13px] text-[#14284B] outline-none focus:border-[#0E7A4B]"
              />
              <button
                type="button"
                onClick={() => {
                  if (demoNotify.trim().includes("@")) setDemoNotified(true);
                }}
                className="h-10 rounded-[10px] bg-[#0E7A4B] px-4 text-[13px] font-semibold text-white hover:bg-[#0B5F3A]"
              >
                {ar ? "أعلمني" : "Notify me"}
              </button>
            </div>
          )}
        </div>
      ) : null}

      {!isNone && hasJob ? (
        <>
          <div className="mt-3.5 flex flex-wrap items-center gap-2.5 rounded-[11px] border border-[#BBF7D0] bg-[#ECFDF3] px-3.5 py-2.5">
            <span className="h-2 w-2 shrink-0 rounded-full bg-[#1E9E63]" />
            <span className="min-w-0 flex-1 text-[12px] leading-relaxed text-[#166534]">
              {ar
                ? "التقديم مفتوح، وتُراجَع الطلبات أولًا بأول — بلا حساب موظف."
                : "Applications are open and reviewed as they arrive — no employee account."}
            </span>
            {live && liveJob?.opened ? (
              <span className="whitespace-nowrap text-[12px] font-semibold text-[#14683F]" dir="ltr">
                {ar ? `فُتح ${liveJob.opened}` : `Opened ${liveJob.opened}`}
              </span>
            ) : null}
          </div>

          <div className="mt-6 flex flex-wrap items-start gap-5">
            <div className="flex min-w-0 flex-[1_1_420px] flex-col gap-3.5">
              {CAREERS_ROLE_SECTIONS.map((section) => (
                <section key={section.titleEn} className="careers-panel rounded-[14px] border border-[#E2E8F0] bg-white px-5 py-4">
                  <h2 className="text-[14px] font-semibold text-[#14284B]">
                    {ar ? section.titleAr : section.titleEn}
                  </h2>
                  <ul className="mt-2.5 space-y-2.5">
                    {(ar ? section.itemsAr : section.itemsEn).map((item) => (
                      <li key={item} className="flex gap-2.5 text-[13px] leading-relaxed text-[#5A6B85]">
                        <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1E9E63]" />
                        <span className="text-pretty">{item}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              ))}

              <section className="careers-panel rounded-[14px] border border-[#E2E8F0] bg-white px-5 py-4">
                <h2 className="text-[14px] font-semibold text-[#14284B]">
                  {ar ? "ماذا يحدث بعد أن ترسل طلبك" : "What happens after you apply"}
                </h2>
                <p className="mt-1 text-[12px] leading-relaxed text-[#5A6B85]">
                  {ar
                    ? "لكل مرحلة مهلة معلنة من يوم فتح الشاغر. إن تجاوزناها فاسأل بالرقم المرجعي."
                    : "Every stage has a published deadline from the vacancy open day. If we exceed it, ask with your reference number."}
                </p>
                <div className="mt-2.5">
                  {CAREERS_STEPS.map((step) => (
                    <div
                      key={step.n}
                      className="flex items-center gap-3 border-t border-[#F1F5F9] py-2.5 first:border-t-0"
                    >
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#EAF6EF] text-[12px] font-semibold text-[#14683F]">
                        {step.n}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-[13px] font-semibold text-[#14284B]">
                          {ar ? step.ar.label : step.en.label}
                        </span>
                        <span className="mt-0.5 block text-[12px] text-[#5A6B85]">
                          {ar ? step.ar.when : step.en.when}
                        </span>
                      </span>
                    </div>
                  ))}
                </div>
              </section>

              <section className="rounded-[14px] border border-dashed border-[#E2E8F0] bg-white px-4 py-4">
                <h2 className="text-[12px] font-semibold text-[#14284B]">
                  {ar ? "بياناتك" : "Your data"}
                </h2>
                <p className="mt-1.5 text-[12px] leading-relaxed text-[#5A6B85] text-pretty">
                  {ar
                    ? "تُستخدم بياناتك لتقييم هذا الطلب فقط، وتُحفظ سنة ثم تُحذف ما لم تأذن ببقائها لشواغر أخرى. احذفها في أي وقت بالرقم المرجعي — هذه القناة لا تقرأ بيانات الموظفين."
                    : "Your data is used to assess this application only. It is kept for one year unless you allow retention for other vacancies. Request deletion anytime with your reference — this channel never reads employee data."}
                </p>
              </section>
            </div>

            <aside className="sticky top-[72px] min-w-0 flex-[1_1_320px]">
              <div className="careers-panel rounded-[14px] border border-[#E2E8F0] bg-white px-5 py-4">
                {sentRef ? (
                  <div className="px-1 py-2 text-center">
                    <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full border border-[#BBF7D0] bg-[#ECFDF3] text-[#15803D]">
                      <Check className="h-5 w-5" strokeWidth={2.25} />
                    </div>
                    <h3 className="mt-3 text-[15px] font-semibold text-[#14284B]">
                      {ar ? "وصل طلبك" : "Your application is in"}
                    </h3>
                    <p className="mt-1.5 text-[12px] leading-relaxed text-[#5A6B85]">
                      {ar
                        ? "سيصلك إشعار عند كل تغيّر في حالة طلبك — لن نتركك بلا رد."
                        : "You will be notified at every status change — you will not be left without an answer."}
                    </p>
                    <div
                      dir="ltr"
                      className="mt-3 rounded-[9px] border border-[#BBF7D0] bg-[#ECFDF3] px-3 py-2 font-mono text-[13px] font-semibold text-[#14683F]"
                    >
                      {sentRef}
                    </div>
                    <p className="mt-2 text-[12px] text-[#5A6B85]">
                      {ar
                        ? "احفظ هذا الرقم — به تتابع طلبك أو تطلب حذف بياناتك."
                        : "Keep this number — use it to follow up or request deletion."}
                    </p>
                  </div>
                ) : (
                  <form onSubmit={submit} className="space-y-3">
                    <div>
                      <h3 className="text-[15px] font-semibold text-[#14284B]">
                        {ar ? "قدّم على هذه الوظيفة" : "Apply for this role"}
                      </h3>
                      <p className="mt-1 text-[12px] leading-relaxed text-[#5A6B85]">
                        {ar
                          ? "دقيقتان — بلا حساب وبلا كلمة مرور."
                          : "Two minutes — no account, no password."}
                      </p>
                    </div>

                    {[
                      ["name", ar ? "الاسم الكامل" : "Full name", ar ? "الاسم كما في الهوية" : "Name as on ID"],
                      ["nameEn", ar ? "الاسم بالإنجليزية (اختياري)" : "Name in English (optional)", ""],
                      ["nationalId", ar ? "رقم الهوية / الإقامة" : "National ID / Iqama", ""],
                      ["phone", ar ? "الجوال" : "Mobile", "+966…"],
                      ["email", ar ? "البريد (اختياري)" : "Email (optional)", ""],
                    ].map(([key, label, ph]) => (
                      <label key={key} className="block">
                        <span className="mb-1.5 block text-[11px] font-semibold text-[#5A6B85]">{label}</span>
                        <input
                          value={form[key]}
                          onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                          placeholder={ph}
                          required={key === "name" || key === "phone"}
                          className="h-10 w-full rounded-[10px] border border-[#E2E8F0] bg-[#F7F8FA] px-3 text-[13px] text-[#14284B] outline-none focus:border-[#0E7A4B]"
                        />
                      </label>
                    ))}

                    <label className="block">
                      <span className="mb-1.5 block text-[11px] font-semibold text-[#5A6B85]">
                        {ar ? "الجنسية" : "Nationality"}
                      </span>
                      <select
                        value={form.nat}
                        onChange={(e) => setForm((f) => ({ ...f, nat: e.target.value }))}
                        className="h-10 w-full rounded-[10px] border border-[#E2E8F0] bg-[#F7F8FA] px-3 text-[13px] text-[#14284B] outline-none"
                      >
                        <option value="saudi">{ar ? "سعودي / سعودية" : "Saudi"}</option>
                        <option value="other">{ar ? "غير سعودي" : "Non-Saudi"}</option>
                      </select>
                    </label>

                    <label className="block">
                      <span className="mb-1.5 block text-[11px] font-semibold text-[#5A6B85]">
                        {ar ? "السيرة الذاتية (PDF أو Word)" : "CV (PDF or Word)"}
                      </span>
                      <span className="relative flex h-10 items-center gap-2 overflow-hidden rounded-[10px] border border-dashed border-[#E2E8F0] bg-[#F7F8FA] px-3 text-[12px] text-[#5A6B85]">
                        <Upload className="h-3.5 w-3.5 shrink-0" strokeWidth={1.75} />
                        <span className="truncate">{form.cvName || (ar ? "اختر ملفًا (اختياري)" : "Choose a file (optional)")}</span>
                        <input
                          type="file"
                          accept=".pdf,.doc,.docx"
                          className="absolute inset-0 cursor-pointer opacity-0"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            setForm((f) => ({ ...f, cvName: file?.name || "" }));
                          }}
                        />
                      </span>
                    </label>

                    {gateMsg ? (
                      <p className="rounded-[9px] border border-[#FDE68A] bg-[#FFFBEB] px-3 py-2 text-[12px] text-[#B45309]">
                        {gateMsg}
                      </p>
                    ) : null}

                    <button
                      type="submit"
                      disabled={busy}
                      className="institutional-cta flex h-11 w-full items-center justify-center gap-2 rounded-[10px] bg-[#0E7A4B] text-[13px] font-semibold text-white hover:bg-[#0B5F3A] disabled:opacity-60"
                    >
                      {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                      {ar ? "أرسل الطلب" : "Submit application"}
                    </button>
                    <p className="text-[12px] leading-relaxed text-[#5A6B85]">
                      {ar
                        ? "بإرسال الطلب توافق على مراجعة بياناتك لهذا الشاغر وفق ما ورد أعلاه."
                        : "By submitting you agree to your data being reviewed for this vacancy as described above."}
                    </p>
                  </form>
                )}
              </div>

              {others.length > 0 ? (
                <div className="mt-3.5 rounded-[14px] bg-[#14284B] px-4 py-4 text-white">
                  <p className="text-[11px] font-semibold tracking-[0.1em] text-[#6EE7B7]">
                    {ar ? "شواغر أخرى مفتوحة" : "OTHER OPEN ROLES"}
                  </p>
                  <div className="mt-2">
                    {others.map((o) => {
                      const key = o.key;
                      const oTitle = live ? o.title : ar ? o.titleAr : o.titleEn;
                      const meta = live
                        ? `${o.stationName} · ${o.grade}`
                        : `${ar ? o.stationAr : o.stationEn} · ${o.grade}`;
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => selectJob(key)}
                          className="flex w-full items-center gap-2.5 border-t border-white/10 py-2.5 text-start first:border-t-0"
                        >
                          <span className="min-w-0 flex-1">
                            <span className="block text-[13px] font-semibold text-white">{oTitle}</span>
                            <span className="mt-0.5 block text-[11px] text-[#A8B4C8]">{meta}</span>
                          </span>
                          <span className="text-[13px] text-[#6EE7B7]">{ar ? "←" : "→"}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : null}
            </aside>
          </div>
        </>
      ) : null}

      {!live ? (
        <p className="mt-8 max-w-[640px] text-[12.5px] leading-relaxed text-[#5A6B85]">
          {ar
            ? "للشركات على NiroVera: انشر الشاغر من التوظيف داخل المنصة، ثم شارك رابط /careers?company=… — الطلبات تدخل طابور التوظيف باتجاه واحد دون إنشاء حساب موظف."
            : "For companies on NiroVera: publish a vacancy from in-app Recruitment, then share /careers?company=… — applications enter the hiring queue one-way without creating an employee account."}
        </p>
      ) : null}
    </div>
  );
}
