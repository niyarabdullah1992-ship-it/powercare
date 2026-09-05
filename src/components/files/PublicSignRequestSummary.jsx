import React from "react";
import { CalendarClock, FileText, ShieldCheck, UserRound, UsersRound } from "lucide-react";
import IdentityCard from "@/components/shared/IdentityCard";
import { BORDER, MUTED, NAVY, SURFACE, ui, CARD } from "@/lib/platformStyles";

export default function PublicSignRequestSummary({ ar, info, onContinue }) {
  const expiry = info.expiresAt ? new Date(info.expiresAt).toLocaleString(ar ? "ar-SA" : "en-GB") : "—";
  const rows = [
    { icon: UserRound, label: ar ? "مرسل الطلب" : "Requested by", value: info.creatorName },
    { icon: FileText, label: ar ? "المستند" : "Document", value: info.fileName },
    { icon: UsersRound, label: ar ? "تسلسل التوقيع" : "Signing sequence", value: `${info.signedCount + 1} / ${info.totalCount}` },
    { icon: CalendarClock, label: ar ? "صلاحية الرابط" : "Link expires", value: expiry },
  ];
  return (
    <IdentityCard
      icon={ShieldCheck}
      kicker={ar ? "طلب" : "Request"}
      title={ar ? "ملخص طلب التوقيع" : "Signature request summary"}
      subtitle={ar ? "راجع بيانات الطلب والمستند كاملًا قبل الانتقال إلى التوقيع." : "Review the request details and full document before moving to signature."}
      dir={ar ? "rtl" : "ltr"}
      bodySurface
    >
      <div style={{ borderRadius: 12, border: `1px solid ${BORDER}`, background: CARD, marginBottom: 12, overflow: "hidden" }}>
        {rows.map(({ icon: Icon, label, value }) => (
          <div key={label} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 12px", borderBottom: `1px solid ${BORDER}` }}>
            <Icon style={{ width: 16, height: 16, marginTop: 2, color: NAVY, flexShrink: 0 }} />
            <div style={{ minWidth: 0 }}>
              <p style={{ margin: 0, fontSize: 10, fontWeight: 600, color: MUTED }}>{label}</p>
              <p style={{ margin: "4px 0 0", fontSize: 13, fontWeight: 600, color: NAVY, overflowWrap: "anywhere" }}>{value || "—"}</p>
            </div>
          </div>
        ))}
      </div>
      <p style={{ margin: 0, padding: 10, borderRadius: 12, background: SURFACE, fontSize: 12, color: MUTED, lineHeight: 1.55 }}>
        {ar ? "الرابط خاص بك، وكل إجراء يُسجّل زمنيًا لحماية المستند." : "This link is unique to you and every action is timestamped for document protection."}
      </p>
      <button type="button" onClick={onContinue} style={{ ...ui.btnBlock }}>
        {ar ? "راجعت المستند — متابعة للتوقيع" : "I reviewed the document — continue"}
      </button>
    </IdentityCard>
  );
}
