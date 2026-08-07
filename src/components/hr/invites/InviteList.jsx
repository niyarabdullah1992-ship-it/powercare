import React from "react";
import { Copy, XCircle, BadgeCheck } from "lucide-react";

const STATUS = {
  pending: { ar: "بانتظار القبول", en: "Pending", cls: "bg-amber-500/15 text-amber-700" },
  awaiting_approval: { ar: "بانتظار الاعتماد", en: "Awaiting approval", cls: "bg-blue-500/15 text-blue-700" },
  approved: { ar: "معتمد ومفعّل", en: "Approved", cls: "bg-accent/15 text-accent-text" },
  revoked: { ar: "ملغاة", en: "Revoked", cls: "bg-destructive/15 text-destructive" },
};

export default function InviteList({ invites, links, onRevoke, onApprove, lang }) {
  const ar = lang === "ar";
  if (!invites.length) return <p className="text-sm text-muted-foreground text-center py-6">{ar ? "لا توجد دعوات بعد." : "No invites yet."}</p>;
  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-card">
      <table className="w-full text-sm mobile-cards">
        <thead>
          <tr className="text-start">
            {[ar ? "الاسم" : "Name", ar ? "الرقم الوظيفي" : "Job no.", ar ? "الجوال" : "Mobile", ar ? "البريد" : "Email", ar ? "الحالة" : "Status", ar ? "تنتهي" : "Expires", ""].map((h, i) => (
              <th key={i} className="px-3 py-2.5 text-start font-medium">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {invites.map((inv) => {
            const st = STATUS[inv.status] || STATUS.pending;
            const expired = inv.status === "pending" && new Date(inv.expiresAt).getTime() < Date.now();
            return (
              <tr key={inv.inviteId} className="border-t border-border">
                <td data-label={ar ? "الاسم" : "Name"} className="px-3 py-2.5 font-medium">{inv.name}</td>
                <td data-label={ar ? "الرقم الوظيفي" : "Job no."} className="px-3 py-2.5">{inv.jobNumber}</td>
                <td data-label={ar ? "الجوال" : "Mobile"} className="px-3 py-2.5" dir="ltr">{inv.phone || "—"}</td>
                <td data-label={ar ? "البريد" : "Email"} className="px-3 py-2.5" dir="ltr">{inv.email || "—"}</td>
                <td data-label={ar ? "الحالة" : "Status"} className="px-3 py-2.5">
                  <span className={`inline-block rounded-full px-2 py-0.5 text-xs ${expired ? "bg-muted text-muted-foreground" : st.cls}`}>
                    {expired ? (ar ? "منتهية" : "Expired") : ar ? st.ar : st.en}
                  </span>
                </td>
                <td data-label={ar ? "تنتهي" : "Expires"} className="px-3 py-2.5 text-xs text-muted-foreground">{new Date(inv.expiresAt).toLocaleDateString(lang)}</td>
                <td className="px-3 py-2.5">
                  <div className="flex items-center gap-1.5 justify-end">
                    {links[inv.inviteId] && (
                      <button onClick={() => navigator.clipboard.writeText(links[inv.inviteId])} title={ar ? "نسخ رابط الدعوة" : "Copy invite link"} className="p-1.5 rounded-md hover:bg-muted"><Copy className="w-4 h-4" /></button>
                    )}
                    {inv.status === "awaiting_approval" && (
                      <button onClick={() => onApprove(inv)} className="flex items-center gap-1 rounded-md bg-accent px-2.5 py-1.5 text-xs text-accent-foreground"><BadgeCheck className="w-3.5 h-3.5" />{ar ? "اعتماد وربط بمقعد" : "Approve & seat"}</button>
                    )}
                    {["pending", "awaiting_approval"].includes(inv.status) && (
                      <button onClick={() => onRevoke(inv)} title={ar ? "إلغاء" : "Revoke"} className="p-1.5 rounded-md text-destructive hover:bg-muted"><XCircle className="w-4 h-4" /></button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}