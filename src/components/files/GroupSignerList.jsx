import React from "react";
import { Plus, X } from "lucide-react";
import { BORDER, MUTED, NAVY, SURFACE, field, CARD } from "@/lib/platformStyles";

const EMPTY = { name: "", email: "", employeeId: null, role: "", stationId: null, signatureUrl: "", external: false };

const addBtn = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 5,
  minHeight: 34,
  padding: "6px 12px",
  borderRadius: 8,
  border: `1px solid ${BORDER}`,
  background: CARD,
  color: NAVY,
  fontSize: 11,
  fontWeight: 600,
  cursor: "pointer",
  fontFamily: "inherit",
};

export default function GroupSignerList({ ar, currentUser, employees, signers, setSigners, activeSigner, setActiveSigner, stampPreviews = [], spots = {} }) {
  const update = (index, patch) => setSigners((rows) => rows.map((row, rowIndex) => rowIndex === index ? { ...row, ...patch } : row));
  const choose = (index, value) => {
    const employee = employees.find((item) => item.email === value || item.name === value);
    update(index, employee
      ? { name: employee.name, email: employee.email || "", employeeId: employee.id || employee.employeeId, role: employee.role || "", stationId: employee.stationId || null, signatureUrl: employee.profile?.signatureUrl || "", external: false }
      : { name: value });
  };
  const self = (signer) => signer.email.trim().toLowerCase() === String(currentUser.email || "").trim().toLowerCase();

  return (
    <div style={{ display: "grid", gap: 8 }}>
      <datalist id="group-team-signers">{employees.filter((employee) => employee.email).map((employee) => <option key={employee.id || employee.employeeId} value={employee.name}>{employee.email}</option>)}</datalist>
      {signers.map((signer, index) => {
        const selected = activeSigner === index;
        const placed = (spots[index] || []).some((item) => item.type === "signature");
        const preview = stampPreviews[index];
        return (
          <div
            key={index}
            onClick={() => setActiveSigner(index)}
            style={{
              display: "flex",
              alignItems: "stretch",
              borderRadius: 10,
              border: `1px solid ${selected ? NAVY : BORDER}`,
              background: selected ? CARD : SURFACE,
              overflow: "hidden",
              cursor: "pointer",
            }}
          >
            <span aria-hidden style={{ width: 3, background: selected ? NAVY : "#CBD5E1", flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0, padding: "10px 10px 10px 12px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <span style={{
                  fontSize: 9,
                  letterSpacing: "0.12em",
                  fontWeight: 600,
                  color: MUTED,
                }}
                >
                  {ar ? `موقّع ${String(index + 1).padStart(2, "0")}` : `SIGNER ${String(index + 1).padStart(2, "0")}`}
                </span>
                <span style={{
                  marginInlineStart: "auto",
                  fontSize: 10,
                  fontWeight: 600,
                  color: placed ? "#15803D" : MUTED,
                }}
                >
                  {placed ? (ar ? "حقل جاهز" : "Field placed") : (ar ? "بدون حقل" : "No field")}
                </span>
                {signers.length > 1 ? (
                  <button
                    type="button"
                    onClick={(event) => { event.stopPropagation(); setSigners((rows) => rows.filter((_, rowIndex) => rowIndex !== index)); }}
                    style={{ border: "none", background: "transparent", color: "#DC2626", cursor: "pointer", padding: 2 }}
                    aria-label={ar ? "حذف الموقّع" : "Remove signer"}
                  >
                    <X style={{ width: 13, height: 13 }} />
                  </button>
                ) : null}
              </div>
              <div style={{ display: "grid", gap: 6 }}>
                <input
                  readOnly={self(signer)}
                  list={self(signer) ? undefined : "group-team-signers"}
                  value={signer.name}
                  onChange={(event) => choose(index, event.target.value)}
                  placeholder={ar ? "اسم الموقّع" : "Signer name"}
                  style={{ ...field, height: 32, fontSize: 12, background: self(signer) ? SURFACE : CARD }}
                />
                <input
                  readOnly={self(signer)}
                  value={signer.email}
                  onChange={(event) => update(index, { email: event.target.value })}
                  placeholder={ar ? "البريد الإلكتروني" : "Email address"}
                  dir="ltr"
                  style={{ ...field, height: 32, fontSize: 12, fontFamily: "'IBM Plex Mono', monospace", background: self(signer) ? SURFACE : CARD }}
                />
              </div>
              {preview ? (
                <img
                  src={preview}
                  alt=""
                  style={{
                    width: "100%",
                    height: 36,
                    objectFit: "fill",
                    display: "block",
                    marginTop: 8,
                    borderRadius: 5,
                    border: `1px solid ${BORDER}`,
                    background: CARD,
                  }}
                />
              ) : null}
            </div>
          </div>
        );
      })}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
        <button type="button" onClick={() => setSigners((rows) => [...rows, { ...EMPTY }])} style={addBtn}>
          <Plus style={{ width: 13, height: 13 }} />
          {ar ? "موظف" : "Employee"}
        </button>
        <button type="button" onClick={() => setSigners((rows) => [...rows, { ...EMPTY, external: true }])} style={addBtn}>
          <Plus style={{ width: 13, height: 13 }} />
          {ar ? "خارجي" : "External"}
        </button>
      </div>
    </div>
  );
}
