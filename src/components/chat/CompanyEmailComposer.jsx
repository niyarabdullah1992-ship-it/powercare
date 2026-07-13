import React, { useState } from "react";
import { Mail, Loader2, Send } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { getCompanyToken } from "@/lib/store";
import { useI18n } from "@/lib/i18n";
import MobileSelect from "@/components/mobile/MobileSelect";

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

  const submit = async (event) => {
    event.preventDefault();
    if (!recipient || !subject.trim() || !text.trim()) return;
    setSending(true);
    setStatus("");
    try {
      await base44.functions.invoke("gmailNotify", { companyId, sessionToken: getCompanyToken(companyId), to: recipient.email, subject: subject.trim(), text: text.trim() });
      setRecipientId(""); setSubject(""); setText("");
      setStatus(ar ? "تم إرسال البريد بنجاح." : "Email sent successfully.");
    } catch {
      setStatus(ar ? "تعذر إرسال البريد." : "Email could not be sent.");
    } finally {
      setSending(false);
    }
  };

  return (
    <form onSubmit={submit} className="rounded-xl border border-border bg-background p-4 space-y-3">
      <div className="flex items-center gap-2"><Mail className="h-4 w-4 text-accent" /><h3 className="font-heading font-semibold">{ar ? "إرسال بريد لموظف" : "Email an employee"}</h3></div>
      <MobileSelect value={recipientId} onChange={setRecipientId} placeholder={ar ? "اختر الموظف" : "Select employee"} options={recipients.map((employee) => ({ value: employee.id, label: `${employee.name} — ${employee.email}` }))} />
      <input value={subject} onChange={(event) => setSubject(event.target.value)} placeholder={ar ? "موضوع الرسالة" : "Subject"} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
      <textarea value={text} onChange={(event) => setText(event.target.value)} placeholder={t("typeMessage")} rows={3} className="w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm" />
      <div className="flex items-center justify-between gap-3"><span className="text-xs text-muted-foreground">{status}</span><button type="submit" disabled={sending || !recipient || !subject.trim() || !text.trim()} className="flex items-center gap-2 rounded-md bg-foreground px-4 py-2 text-sm text-background disabled:opacity-50">{sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}{t("send")}</button></div>
    </form>
  );
}