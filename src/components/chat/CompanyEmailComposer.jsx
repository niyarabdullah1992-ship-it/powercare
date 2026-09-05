
import React, { useState } from "react";
import { Mail, Loader2, Send } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { getCompanyToken } from "@/lib/store";
import { useI18n } from "@/lib/i18n";
import MobileSelect from "@/components/mobile/MobileSelect";
import { ACCENT, MUTED, NAVY, SURFACE, field, textarea, ui, CARD } from "@/lib/platformStyles";

export default function CompanyEmailComposer({ employees, currentUser, companyId }) {
  const { t, lang } = useI18n();
  const [recipientId, setRecipientId] = useState("");
  const [subject, setSubject] = useState("");
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState("");
  const recipients = employees.filter((employee) => employee.email && employee.id !== currentUser.id);
  const recipient = recipients.find((employee) => employee.id === recipientId);
  const ar = lang === "ar";
  const canSubmit = !sending && recipient && subject.trim() && text.trim();

  const submit = async (event) => {
    event.preventDefault();
    if (!recipient || !subject.trim() || !text.trim()) return;
    setSending(true);
    setStatus("");
    try {
      await base44.functions.invoke("gmailNotify", {
        companyId,
        sessionToken: getCompanyToken(companyId),
        to: recipient.email,
        subject: subject.trim(),
        text: text.trim(),
      });
      setRecipientId("");
      setSubject("");
      setText("");
      setStatus(ar ? "تم إرسال البريد بنجاح." : "Email sent successfully.");
    } catch {
      setStatus(ar ? "تعذر إرسال البريد." : "Email could not be sent.");
    } finally {
      setSending(false);
    }
  };

  return (
    <form
      onSubmit={submit}
      style={{
        borderRadius: 14,
        border: "1px solid #E2E8F0",
        background: CARD,
        padding: "16px 18px",
        display: "flex",
        flexDirection: "column",
        gap: 12,
        boxShadow: "0 1px 0 #E2E8F0",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#ECFDF3",
            color: ACCENT,
          }}
        >
          <Mail style={{ width: 16, height: 16 }} strokeWidth={1.75} />
        </span>
        <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: NAVY }}>
          {ar ? "إرسال بريد لموظف" : "Email an employee"}
        </h3>
      </div>

      <MobileSelect
        value={recipientId}
        onChange={setRecipientId}
        placeholder={ar ? "اختر الموظف" : "Select employee"}
        options={recipients.map((employee) => ({
          value: employee.id,
          label: `${employee.name} — ${employee.email}`,
        }))}
      />

      <input
        value={subject}
        onChange={(event) => setSubject(event.target.value)}
        placeholder={ar ? "موضوع الرسالة" : "Subject"}
        style={{ ...field, height: 38, background: SURFACE }}
      />

      <textarea
        value={text}
        onChange={(event) => setText(event.target.value)}
        placeholder={t("typeMessage")}
        rows={4}
        style={{ ...textarea, background: SURFACE, minHeight: 96 }}
      />

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <span style={{ fontSize: 12, color: MUTED }}>{status}</span>
        <button
          type="submit"
          disabled={!canSubmit}
          style={{
            ...ui.btnPrimary,
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            opacity: canSubmit ? 1 : 0.45,
            cursor: canSubmit ? "pointer" : "not-allowed",
          }}
        >
          {sending ? <Loader2 style={{ width: 14, height: 14 }} className="animate-spin" /> : <Send style={{ width: 14, height: 14 }} />}
          {t("send")}
        </button>
      </div>
    </form>
  );
}
