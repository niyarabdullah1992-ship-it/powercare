import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useI18n } from "@/lib/i18n";
import { Megaphone, Loader2, CheckCircle2 } from "lucide-react";

// Platform-owner tool: compose site news and email it to every subscriber.
export default function NewsBroadcast() {
  const { lang } = useI18n();
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState(null); // null | "sending" | {sent, total} | "error"

  const handleSend = async (e) => {
    e.preventDefault();
    setStatus("sending");
    try {
      const res = await base44.functions.invoke("subscriberEmails", {
        action: "broadcast", subject, message,
      });
      if (res.data?.ok) {
        setStatus({ sent: res.data.sent, total: res.data.total });
        setSubject("");
        setMessage("");
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-xl">
      <h3 className="font-heading text-lg font-semibold mb-1 flex items-center gap-2 text-[#3a2f22]">
        <Megaphone className="w-4 h-4 text-landing-gold" />
        {lang === "ar" ? "إرسال أخبار الموقع للمشتركين" : "Email Site News to Subscribers"}
      </h3>
      <p className="text-xs text-[#3a2f22]/50 font-body mb-4">
        {lang === "ar"
          ? "تُرسل الرسالة إلى البريد الإلكتروني المسجل لكل شركة مشتركة."
          : "The message is sent to the registered email of every subscribed company."}
      </p>
      <form onSubmit={handleSend} className="space-y-3">
        <input
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder={lang === "ar" ? "عنوان الرسالة" : "Subject"}
          required
          className="w-full px-3 py-2 rounded-lg bg-landing-bg text-[#3a2f22] text-sm font-body focus:outline-none focus:ring-2 focus:ring-landing-gold"
        />
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={lang === "ar" ? "نص الخبر..." : "News content..."}
          required
          rows={4}
          className="w-full px-3 py-2 rounded-lg bg-landing-bg text-[#3a2f22] text-sm font-body focus:outline-none focus:ring-2 focus:ring-landing-gold resize-none"
        />
        <button
          type="submit"
          disabled={status === "sending"}
          className="w-full py-2.5 rounded-lg bg-gradient-to-b from-landing-gold-light to-landing-gold text-white text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {status === "sending" && <Loader2 className="w-4 h-4 animate-spin" />}
          {lang === "ar" ? "إرسال للجميع" : "Send to all subscribers"}
        </button>
      </form>
      {status && typeof status === "object" && (
        <p className="mt-3 text-sm text-green-600 font-body flex items-center gap-1.5">
          <CheckCircle2 className="w-4 h-4" />
          {lang === "ar" ? `تم الإرسال إلى ${status.sent} من ${status.total} مشترك.` : `Sent to ${status.sent} of ${status.total} subscribers.`}
        </p>
      )}
      {status === "error" && (
        <p className="mt-3 text-sm text-red-500 font-body">
          {lang === "ar" ? "تعذر إرسال الرسالة — حاول مجددًا." : "Could not send the message — try again."}
        </p>
      )}
    </div>
  );
}