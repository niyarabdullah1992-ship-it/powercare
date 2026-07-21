import React from "react";
import { CalendarClock, FileText, ShieldCheck, UserRound, UsersRound } from "lucide-react";

export default function PublicSignRequestSummary({ ar, info, onContinue }) {
  const expiry = info.expiresAt ? new Date(info.expiresAt).toLocaleString(ar ? "ar-SA" : "en-GB") : "—";
  const rows = [
    { icon: UserRound, label: ar ? "مرسل الطلب" : "Requested by", value: info.creatorName },
    { icon: FileText, label: ar ? "المستند" : "Document", value: info.fileName },
    { icon: UsersRound, label: ar ? "تسلسل التوقيع" : "Signing sequence", value: `${info.signedCount + 1} / ${info.totalCount}` },
    { icon: CalendarClock, label: ar ? "صلاحية الرابط" : "Link expires", value: expiry },
  ];
  return (
    <aside className="rounded-3xl border border-accent/20 bg-card p-6 shadow-elevated sm:p-7">
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/10"><ShieldCheck className="h-6 w-6 text-accent" /></span>
      <h3 className="mt-5 font-heading text-2xl font-semibold">{ar ? "ملخص طلب التوقيع" : "Signature request summary"}</h3>
      <p className="mt-2 text-xs leading-5 text-muted-foreground">{ar ? "راجع بيانات الطلب والمستند كاملًا قبل الانتقال إلى التوقيع." : "Review the request details and full document before moving to signature."}</p>
      <div className="my-6 divide-y divide-border rounded-2xl border border-border bg-landing-bg/40 px-4">{rows.map(({ icon: Icon, label, value }) => <div key={label} className="flex items-start gap-3 py-3"><Icon className="mt-0.5 h-4 w-4 shrink-0 text-accent" /><div className="min-w-0"><p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{label}</p><p className="mt-1 break-words text-sm font-semibold">{value || "—"}</p></div></div>)}</div>
      <div className="rounded-xl bg-secondary px-4 py-3 text-xs leading-5 text-muted-foreground"><ShieldCheck className="me-1 inline h-4 w-4 text-accent" />{ar ? "الرابط خاص بك، وكل إجراء يُسجّل زمنيًا لحماية المستند." : "This link is unique to you and every action is timestamped for document protection."}</div>
      <button onClick={onContinue} className="mt-5 min-h-[52px] w-full rounded-xl bg-accent px-5 py-3 text-[15px] font-bold text-accent-foreground shadow-lg">{ar ? "راجعت المستند — متابعة للتوقيع" : "I reviewed the document — continue"}</button>
    </aside>
  );
}