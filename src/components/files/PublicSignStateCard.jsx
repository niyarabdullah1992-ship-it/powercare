import React from "react";
import { AlertCircle, CheckCircle2, Clock3, Download, Loader2, RefreshCw } from "lucide-react";
import IdentityCard from "@/components/shared/IdentityCard";
import { BORDER, MUTED, NAVY, OK, ui, CARD } from "@/lib/platformStyles";

export default function PublicSignStateCard({ ar, type, info, done, message, onRetry }) {
  if (type === "loading") {
    return (
      <IdentityCard title={ar ? "جاري فتح الطلب" : "Opening request"}>
        <div style={{ minHeight: 160, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Loader2 style={{ width: 22, height: 22, color: MUTED }} className="animate-spin" />
        </div>
      </IdentityCard>
    );
  }
  const success = type === "success";
  const rejected = type === "rejected";
  const waiting = type === "waiting";
  const finalUrl = done?.docUrl || info?.docUrl;
  const fingerprint = done?.finalHash || info?.finalHash;
  const Icon = success ? CheckCircle2 : waiting ? Clock3 : AlertCircle;
  const title = success
    ? (ar ? "تم تسجيل توقيعك" : "Your signature was recorded")
    : rejected
      ? (ar ? "تم رفض المستند" : "Document rejected")
      : waiting
        ? (ar ? "بانتظار الموقّع السابق" : "Waiting for the previous signer")
        : (ar ? "تعذّر فتح الطلب" : "The request couldn't be opened");
  const subtitle = success
    ? (done?.completed || info?.status === "completed"
      ? (ar ? "اكتملت جميع التوقيعات وتم توثيق النسخة النهائية." : "All signatures are complete and the final copy is verified.")
      : (ar ? "تم حفظ توقيعك، والطلب بانتظار بقية الأطراف." : "Your signature is saved; the request is waiting for the remaining parties."))
    : rejected
      ? (done?.reason || info?.rejectionReason || (ar ? "توقف مسار التوقيع وتم إشعار المرسل." : "The signing flow stopped and the sender was notified."))
      : waiting
        ? (ar ? "يجب أن يوقّع الطرف السابق أولًا حسب ترتيب الطلب." : "The previous party must sign first according to the request order.")
        : message;

  return (
    <IdentityCard icon={Icon} title={title} subtitle={subtitle} dir={ar ? "rtl" : "ltr"} bodySurface>
      {fingerprint ? (
        <div style={{ padding: 12, borderRadius: 12, border: `1px solid ${BORDER}`, background: CARD, marginBottom: 12 }}>
          <p style={{ margin: 0, ...OK }}>{ar ? "بصمة الملف النهائية" : "Final file fingerprint"}</p>
          <p dir="ltr" style={{ margin: "8px 0 0", wordBreak: "break-all", fontFamily: "ui-monospace, monospace", fontSize: 10, color: NAVY }}>{fingerprint}</p>
        </div>
      ) : null}
      <div style={{ display: "flex", justifyContent: "center" }}>
        {success && (done?.completed || info?.status === "completed") ? (
          <a href={finalUrl} target="_blank" rel="noreferrer" style={{ ...ui.btnPrimary, display: "inline-flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
            <Download style={{ width: 14, height: 14 }} />{ar ? "تنزيل النسخة النهائية" : "Download final copy"}
          </a>
        ) : !success && !rejected ? (
          <button type="button" onClick={onRetry} style={{ ...ui.btnPrimary, display: "inline-flex", alignItems: "center", gap: 8 }}>
            <RefreshCw style={{ width: 14, height: 14 }} />{waiting ? (ar ? "تحديث الحالة" : "Refresh status") : (ar ? "إعادة المحاولة" : "Try again")}
          </button>
        ) : null}
      </div>
    </IdentityCard>
  );
}
