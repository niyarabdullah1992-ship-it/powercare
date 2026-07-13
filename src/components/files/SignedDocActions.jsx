import React, { useState } from "react";
import { Download, Mail, MessageSquare, Loader2, CheckCircle2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/PowerCareAuth";
import MobileSelect from "@/components/mobile/MobileSelect";

// Actions for an already-signed document: download it, email it to one or more
// recipients at once, or send it to anyone from the same station via chat.
export default function SignedDocActions({ signed, currentUser, companyName, ar }) {
  const { data } = useAuth();
  const [to, setTo] = useState("");
  const [subject, setSubject] = useState(ar ? `مستند موقّع: ${signed.name}` : `Signed document: ${signed.name}`);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sentTo, setSentTo] = useState("");
  const [chatTarget, setChatTarget] = useState("general");
  const [chatSending, setChatSending] = useState(false);
  const [chatSent, setChatSent] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState("");

  // Force a real download (an <a download> is ignored for cross-origin URLs).
  const downloadFile = async () => {
    setDownloading(true);
    try {
      const blob = await fetch(signed.url).then((r) => r.blob());
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `signed-${signed.name.replace(/\.[^.]+$/, "")}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      window.open(signed.url, "_blank");
    } finally {
      setDownloading(false);
    }
  };

  const stationKey = currentUser.stationId || "hq";
  const stationMates = (data?.employees || []).filter(
    (e) => (e.stationId || "hq") === stationKey && e.id !== currentUser.id
  );
  const emails = to.split(/[,\s;]+/).filter((x) => /\S+@\S+\.\S+/.test(x));

  const sendEmails = async () => {
    setError("");
    setSending(true);
    try {
      const date = new Date().toLocaleString(ar ? "ar" : "en");
      const body = [
        message,
        "",
        "----------------------------------------",
        ar ? `المستند: ${signed.name}` : `Document: ${signed.name}`,
        ar ? `رابط التنزيل: ${signed.url}` : `Download link: ${signed.url}`,
        ...(signed.verificationId ? [ar ? `رقم التحقق المشفّر: ${signed.verificationId}` : `Encrypted verification ID: ${signed.verificationId}`] : []),
        ...(signed.hash ? [`SHA-256: ${signed.hash}`] : []),
        ar ? `وقّعه: ${currentUser.name}${currentUser.position ? ` — ${currentUser.position}` : ""}` : `Signed by: ${currentUser.name}${currentUser.position ? ` — ${currentUser.position}` : ""}`,
        ar ? `التاريخ: ${date}` : `Date: ${date}`,
        companyName ? (ar ? `الشركة: ${companyName}` : `Company: ${companyName}`) : "",
      ].join("\n");
      // Send to every recipient at the same moment.
      await Promise.all(
        emails.map((addr) =>
          base44.integrations.Core.SendEmail({ from_name: companyName || "PowerCare", to: addr, subject: subject.trim() || signed.name, body })
        )
      );
      setSentTo(emails.join(", "));
      setTo("");
    } catch {
      setError(ar ? "تعذّر الإرسال — تحقق من العناوين وحاول مجددًا." : "Sending failed — check the addresses and try again.");
    } finally {
      setSending(false);
    }
  };

  const sendToChat = async () => {
    setError("");
    setChatSending(true);
    try {
      const text = [
        ar ? `📌 مستند موقّع: ${signed.name}` : `📌 Signed document: ${signed.name}`,
        signed.verificationId ? (ar ? `رقم التحقق: ${signed.verificationId}` : `Verification ID: ${signed.verificationId}`) : "",
      ].filter(Boolean).join("\n");
      const files = [{ url: signed.url, name: `signed-${signed.name}.pdf`, type: "application/pdf" }];
      if (chatTarget === "general") {
        await base44.functions.invoke("supabaseTargets", {
          action: "sendChatMessage", stationId: stationKey, userId: currentUser.id, userName: currentUser.name, text, files,
        });
      } else {
        await base44.functions.invoke("supabaseTargets", {
          action: "sendDirectMessage", senderId: currentUser.id, senderName: currentUser.name, receiverId: chatTarget, text, files,
        });
      }
      setChatSent(true);
    } catch (err) {
      setError(err?.response?.data?.error || (ar ? "تعذّر الإرسال عبر الدردشة." : "Chat send failed."));
    } finally {
      setChatSending(false);
    }
  };

  return (
    <div className="space-y-3 pt-1">
      {/* Fingerprint summary */}
      <div className="p-3 rounded-lg bg-muted/60 space-y-1">
        <p className="text-xs font-body" dir="ltr"><span className="text-muted-foreground">ID:</span> <span className="font-mono">{signed.verificationId || "—"}</span></p>
        {signed.hash && (
          <p className="text-[10px] font-mono text-muted-foreground break-all" dir="ltr">SHA-256: {signed.hash}</p>
        )}
      </div>

      {/* Download */}
      <button
        onClick={downloadFile} disabled={downloading}
        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md border border-border text-xs font-body hover:bg-muted disabled:opacity-40"
      >
        {downloading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
        {ar ? "تنزيل الملف الموقّع" : "Download signed file"}
      </button>

      {/* Email — one or more recipients */}
      <div className="space-y-2 pt-1 border-t border-border">
        <p className="text-xs font-semibold font-body flex items-center gap-1.5 pt-2">
          <Mail className="w-3.5 h-3.5 text-accent" /> {ar ? "إرسال بالبريد (شخص أو أكثر)" : "Send by email (one or more)"}
        </p>
        {sentTo && (
          <p className="flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-md px-3 py-2 font-body">
            <CheckCircle2 className="w-3.5 h-3.5" /> {ar ? `أُرسل إلى: ${sentTo}` : `Sent to: ${sentTo}`}
          </p>
        )}
        <input
          dir="ltr" value={to} onChange={(e) => setTo(e.target.value)}
          placeholder={ar ? "بريد المستلمين — افصل بينهم بفاصلة" : "Recipient emails — comma separated"}
          className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm font-body focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <input
          value={subject} onChange={(e) => setSubject(e.target.value)} dir="auto"
          placeholder={ar ? "الموضوع" : "Subject"}
          className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm font-body focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <textarea
          value={message} onChange={(e) => setMessage(e.target.value)} rows={2} dir="auto"
          placeholder={ar ? "رسالة اختيارية…" : "Optional message…"}
          className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm font-body focus:outline-none focus:ring-2 focus:ring-ring resize-none"
        />
        <button
          onClick={sendEmails} disabled={emails.length === 0 || sending}
          className="flex items-center gap-1.5 px-4 py-2 rounded-md bg-foreground text-background text-xs font-body disabled:opacity-40"
        >
          {sending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Mail className="w-3.5 h-3.5" />}
          {sending ? (ar ? "جارٍ الإرسال…" : "Sending…") : ar ? `إرسال (${emails.length || 0})` : `Send (${emails.length || 0})`}
        </button>
      </div>

      {/* Chat — station general or a specific colleague */}
      <div className="space-y-2 pt-1 border-t border-border">
        <p className="text-xs font-semibold font-body flex items-center gap-1.5 pt-2">
          <MessageSquare className="w-3.5 h-3.5 text-accent" /> {ar ? "إرسال عبر شات المحطة" : "Send via station chat"}
        </p>
        {chatSent && (
          <p className="flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-md px-3 py-2 font-body">
            <CheckCircle2 className="w-3.5 h-3.5" /> {ar ? "أُرسل الملف عبر الدردشة." : "File sent via chat."}
          </p>
        )}
        <div className="flex flex-col sm:flex-row gap-2">
          <MobileSelect
            value={chatTarget}
            onChange={setChatTarget}
            placeholder={ar ? "اختر الوجهة" : "Choose destination"}
            options={[
              { value: "general", label: ar ? "الدردشة العامة للمحطة" : "Station general chat" },
              ...stationMates.map((e) => ({ value: e.id, label: e.name })),
            ]}
          />
          <button
            onClick={sendToChat} disabled={chatSending}
            className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-md border border-accent/60 text-accent text-xs font-body hover:bg-accent/10 disabled:opacity-40"
          >
            {chatSending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <MessageSquare className="w-3.5 h-3.5" />}
            {ar ? "إرسال للشات" : "Send to chat"}
          </button>
        </div>
      </div>

      {error && <p className="text-xs text-destructive font-body">{error}</p>}
    </div>
  );
}