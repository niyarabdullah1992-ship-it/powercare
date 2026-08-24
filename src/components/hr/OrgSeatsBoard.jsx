import React from "react";
import { Link } from "react-router-dom";
import { Briefcase } from "lucide-react";
import { formatSalaryRange, occupiedSeats, orgSeats, seatReadout, vacantSeats } from "@/lib/orgHire";
import { BORDER, CARD, MUTED, NAVY, SURFACE, ui } from "@/lib/platformStyles";

export default function OrgSeatsBoard({ data, ar, onAssign }) {
  const vacant = vacantSeats(data);
  const filled = occupiedSeats(data);
  const rows = [...vacant, ...filled];
  const employees = data?.employees || [];

  return (
    <section
      style={{
        background: CARD,
        border: `1px solid ${BORDER}`,
        borderRadius: 16,
        overflow: "hidden",
        boxShadow: "0 8px 24px rgba(20,40,75,.06)",
      }}
      dir={ar ? "rtl" : "ltr"}
    >
      <header style={{ padding: "14px 16px", borderBottom: `1px solid ${BORDER}` }}>
        <p style={{ margin: 0, fontSize: 10, letterSpacing: "0.14em", fontWeight: 600, color: MUTED }}>
          {ar ? "من المنصب" : "From the seat"}
        </p>
        <h2 style={{ margin: "4px 0 0", fontSize: 15, fontWeight: 600, color: NAVY }}>
          {ar ? "المناصب" : "Seats"}
        </h2>
        <p style={{ margin: "6px 0 0", fontSize: 12, color: MUTED, lineHeight: 1.55 }}>
          {ar
            ? "عيّن من الشاغر: الفرع والقائمة والدرجة والراتب والمعتمِد جاهزة. تكتب الاسم والهوية فقط."
            : "Assign from a vacancy: branch, list, grade, salary, and approver are already on the seat."}
        </p>
      </header>

      {!rows.length ? (
        <div style={{ padding: 28, textAlign: "center" }}>
          <Briefcase style={{ width: 28, height: 28, margin: "0 auto 8px", color: NAVY }} />
          <p style={{ margin: 0, fontSize: 13, color: MUTED, lineHeight: 1.6 }}>
            {ar
              ? "لا مناصب بعد. أنشئ منصبًا من «+» على بطاقة الوحدة في الشجرة."
              : "No seats yet. Create one from + on a unit card in the tree."}
          </p>
        </div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr style={{ background: SURFACE, color: MUTED, textAlign: "start" }}>
                <th style={{ padding: "10px 14px", fontWeight: 600 }}>{ar ? "المنصب" : "Seat"}</th>
                <th style={{ padding: "10px 14px", fontWeight: 600 }}>{ar ? "الفرع" : "Branch"}</th>
                <th style={{ padding: "10px 14px", fontWeight: 600 }}>{ar ? "القائمة" : "List"}</th>
                <th style={{ padding: "10px 14px", fontWeight: 600 }}>{ar ? "الدرجة" : "Grade"}</th>
                <th style={{ padding: "10px 14px", fontWeight: 600 }}>{ar ? "الحالة" : "Status"}</th>
                <th style={{ padding: "10px 14px", fontWeight: 600 }} />
              </tr>
            </thead>
            <tbody>
              {rows.map((seat) => {
                const info = seatReadout(seat, data, ar);
                const person = employees.find((item) => item.id === seat.employeeId);
                const open = !seat.employeeId;
                return (
                  <tr key={seat.id} style={{ borderTop: `1px solid ${BORDER}` }}>
                    <td style={{ padding: "12px 14px", fontWeight: 600, color: NAVY }}>{seat.title}</td>
                    <td style={{ padding: "12px 14px", color: MUTED }}>{info?.branch}</td>
                    <td style={{ padding: "12px 14px", color: MUTED }}>{info?.list}</td>
                    <td style={{ padding: "12px 14px", color: MUTED }}>
                      {info?.grade || "—"}
                      <div style={{ fontSize: 10, marginTop: 2 }}>
                        {formatSalaryRange(info?.salaryMin, info?.salaryMax, ar)}
                      </div>
                    </td>
                    <td style={{ padding: "12px 14px" }}>
                      {open ? (
                        <span style={{ color: "#1E9E63", fontWeight: 600 }}>{ar ? "شاغر" : "Vacant"}</span>
                      ) : (
                        <Link to={`/app/employees/${person?.id}`} style={{ color: NAVY, fontWeight: 600, textDecoration: "none" }}>
                          {person?.name || (ar ? "مشغول" : "Filled")}
                        </Link>
                      )}
                    </td>
                    <td style={{ padding: "12px 14px", textAlign: "end" }}>
                      {open ? (
                        <button type="button" onClick={() => onAssign?.(seat)} style={{ ...ui.btnPrimary, height: 32 }}>
                          {ar ? "عيّن" : "Assign"}
                        </button>
                      ) : null}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      <p style={{ margin: 0, padding: "10px 14px", fontSize: 11, color: MUTED, borderTop: `1px solid ${BORDER}` }}>
        {ar
          ? `${vacant.length} شاغر · ${orgSeats(data).length} منصبًا — ليست طبقة كراسٍ منفصلة عن الشجرة.`
          : `${vacant.length} vacant · ${orgSeats(data).length} seats — not a second chair layer beside the tree.`}
      </p>
    </section>
  );
}
