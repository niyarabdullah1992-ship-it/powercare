import React from "react";
import { ExternalLink, FileText } from "lucide-react";
import { Image } from "@/components/ui/image";
import { ACCENT, MUTED, NAVY, BORDER, SURFACE, emptyState, NEUTRAL, WARN, OK, BAD, ui, CARD } from "@/lib/platformStyles";

const TYPE = { travel: ["Travel", "سفر"], accommodation: ["Accommodation", "سكن"], fuel: ["Fuel", "وقود"], overtime_meals: ["Overtime Meals", "وجبات العمل الإضافي"], tools_equipment: ["Tools & Equipment", "أدوات ومعدات"], training: ["Training", "تدريب"] };
const STATUS = { submitted: ["Manager review", "مراجعة المدير"], manager_approved: ["Finance review", "مراجعة المالية"], manager_rejected: ["Manager rejected", "مرفوض من المدير"], finance_approved: ["Approved", "معتمد"], finance_rejected: ["Finance rejected", "مرفوض من المالية"] };
const STATUS_STYLE = {
  submitted: WARN,
  manager_approved: WARN,
  manager_rejected: BAD,
  finance_approved: OK,
  finance_rejected: BAD,
};
const isPdf = (url = "") => decodeURIComponent(url).toLowerCase().includes(".pdf");

export default function ExpenseList({ claims, stations, canManagerReview, canFinanceReview, onManagerReview, onFinanceReview, ar }) {
  if (!claims.length) return <div style={emptyState}>{ar ? "لا توجد مصروفات بعد." : "No expenses yet."}</div>;
  const stationNames = (claim) => (claim.stationIds?.length ? claim.stationIds : [claim.stationId]).map((id) => stations.find((station) => station.stationId === id)?.name || id).join("، ");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      {claims.map((claim) => (
        <article key={claim.id} style={{ borderRadius: "16px", border: `1px solid ${BORDER}`, background: CARD, padding: "16px 18px" }}>
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-start", justifyContent: "space-between", gap: "12px" }}>
            <div>
              <h3 style={{ margin: 0, fontSize: "14px", fontWeight: 600, color: NAVY }}>
                {claim.expenseType === "other" ? claim.customExpenseType : TYPE[claim.expenseType]?.[ar ? 1 : 0]}
              </h3>
              <p style={{ margin: "4px 0 0", fontSize: "12px", color: MUTED }}>{claim.requesterName} · {claim.expenseDate}</p>
              <p style={{ margin: "4px 0 0", fontSize: "12px", color: MUTED }}>{stationNames(claim)}</p>
            </div>
            <div style={{ textAlign: "end" }}>
              <p style={{ margin: 0, fontSize: "20px", fontWeight: 600, color: NAVY, fontFamily: "'IBM Plex Sans',sans-serif" }}>
                {Number(claim.totalAmount || claim.amount).toLocaleString()} {claim.currency}
              </p>
              <p style={{ margin: "4px 0 0", fontSize: "12px", color: MUTED }}>
                {Number(claim.amount).toLocaleString()} × {(claim.stationIds?.length || 1)}
              </p>
              <span style={{ ...(STATUS_STYLE[claim.status] || NEUTRAL), marginTop: "6px" }}>
                {STATUS[claim.status]?.[ar ? 1 : 0]}
              </span>
            </div>
          </div>
          <div style={{
            marginTop: "12px",
            display: "grid",
            gap: "8px",
            borderRadius: "11px",
            background: SURFACE,
            border: `1px solid ${BORDER}`,
            padding: "12px",
            fontSize: "13px",
            color: NAVY,
            gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
          }}>
            <p style={{ margin: 0 }}><span style={{ color: MUTED }}>{ar ? "قبل الضريبة" : "Before tax"}: </span>{Number(claim.beforeTaxAmount ?? claim.amount).toLocaleString()} {claim.currency}</p>
            <p style={{ margin: 0 }}><span style={{ color: MUTED }}>{ar ? "الضريبة" : "Tax"}: </span>{Number(claim.taxAmount || 0).toLocaleString()} {claim.currency}</p>
            <p style={{ margin: 0, fontWeight: 600 }}><span style={{ color: MUTED }}>{ar ? "بعد الضريبة" : "After tax"}: </span>{Number(claim.afterTaxAmount ?? claim.amount).toLocaleString()} {claim.currency}</p>
            {(claim.quantity ?? claim.itemCount) != null && <p style={{ margin: 0 }}><span style={{ color: MUTED }}>{ar ? "الكمية" : "Quantity"}: </span>{Number(claim.quantity ?? claim.itemCount).toLocaleString()}</p>}
            {claim.invoiceNumber && <p style={{ margin: 0 }}><span style={{ color: MUTED }}>{ar ? "رقم الفاتورة" : "Invoice no."}: </span>{claim.invoiceNumber}</p>}
          </div>
          {claim.description && <p style={{ margin: "12px 0 0", fontSize: "13px", color: MUTED }}>{claim.description}</p>}
          <div style={{ marginTop: "14px", display: "flex", flexWrap: "wrap", alignItems: "center", gap: "8px", borderTop: `1px solid ${BORDER}`, paddingTop: "12px" }}>
            <a href={claim.receiptUrl} target="_blank" rel="noreferrer" style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: ACCENT, textDecoration: "none" }}>
              {isPdf(claim.receiptUrl)
                ? <span style={{ display: "flex", height: 48, width: 48, alignItems: "center", justifyContent: "center", borderRadius: "10px", border: `1px solid ${BORDER}`, background: SURFACE }}><FileText style={{ width: 20, height: 20 }} /></span>
                : <Image src={claim.receiptUrl} alt={ar ? "صورة الفاتورة" : "Invoice image"} className="h-12 w-12 rounded-lg border" fittingType="fill" style={{ border: `1px solid ${BORDER}`, borderRadius: "10px" }} />}
              <ExternalLink style={{ width: 16, height: 16 }} />
              {ar ? "عرض الإيصال" : "View receipt"}
            </a>
            {canManagerReview && claim.status === "submitted" && (
              <>
                <button onClick={() => onManagerReview(claim.id, "manager_approved")} style={{ ...ui.btnPrimary, marginInlineStart: "auto" }}>{ar ? "اعتماد" : "Approve"}</button>
                <button onClick={() => onManagerReview(claim.id, "manager_rejected")} style={ui.btnDanger}>{ar ? "رفض" : "Reject"}</button>
              </>
            )}
            {canFinanceReview && claim.status === "manager_approved" && (
              <>
                <button onClick={() => onFinanceReview(claim.id, "finance_approved")} style={{ ...ui.btnPrimary, marginInlineStart: "auto" }}>{ar ? "اعتماد نهائي" : "Final approve"}</button>
                <button onClick={() => onFinanceReview(claim.id, "finance_rejected")} style={ui.btnDanger}>{ar ? "رفض" : "Reject"}</button>
              </>
            )}
          </div>
        </article>
      ))}
    </div>
  );
}
