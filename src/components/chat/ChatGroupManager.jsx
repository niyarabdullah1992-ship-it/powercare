
import React, { useState } from "react";
import { Link2, Plus, X, Trash2 } from "lucide-react";
import ConfirmDeleteDialog from "@/components/ConfirmDeleteDialog";
import { ACCENT, CARD, MUTED, NAVY, SURFACE, field, ui } from "@/lib/chatUiStyles";

export default function ChatGroupManager({ t, stations, groups, onAdd, onDelete }) {
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [selected, setSelected] = useState([]);

  const options = [{ id: "hq", name: t("hq") }, ...stations.map((s) => ({ id: s.id, name: s.name }))];
  const stationLabel = (id) => options.find((o) => o.id === id)?.name || id;

  const toggleStation = (id) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const submit = () => {
    const trimmed = name.trim();
    if (!trimmed || selected.length < 2) return;
    onAdd({ name: trimmed, stationIds: selected });
    setName("");
    setSelected([]);
    setShowForm(false);
  };

  return (
    <div
      style={{
        borderRadius: 12,
        border: "1px solid #E2E8F0",
        background: SURFACE,
        padding: "12px 14px",
        display: "flex",
        flexDirection: "column",
        gap: 12,
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 10, minWidth: 0 }}>
          <span
            style={{
              width: 32,
              height: 32,
              borderRadius: 9,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "#ECFDF3",
              color: ACCENT,
              flexShrink: 0,
            }}
          >
            <Link2 style={{ width: 15, height: 15 }} strokeWidth={1.75} />
          </span>
          <div>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: NAVY }}>{t("chatGroups")}</p>
            <p style={{ margin: "3px 0 0", fontSize: 11, lineHeight: 1.55, color: MUTED }}>{t("chatGroupsNote")}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setShowForm((s) => !s)}
          style={{
            ...ui.btnGhost,
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            height: 32,
            padding: "0 11px",
          }}
        >
          <Plus style={{ width: 14, height: 14 }} /> {t("addChatGroup")}
        </button>
      </div>

      {groups.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {groups.map((g) => (
            <div
              key={g.id}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 8,
                padding: "9px 11px",
                borderRadius: 10,
                background: CARD,
                border: "1px solid #E2E8F0",
              }}
            >
              <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 6, minWidth: 0 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: NAVY }}>{g.name}</span>
                {(g.stationIds || []).map((id) => (
                  <span
                    key={id}
                    style={{
                      padding: "2px 8px",
                      borderRadius: 8,
                      fontSize: 10,
                      fontWeight: 500,
                      background: SURFACE,
                      color: MUTED,
                      border: "1px solid #E2E8F0",
                    }}
                  >
                    {stationLabel(id)}
                  </span>
                ))}
              </div>
              <ConfirmDeleteDialog
                trigger={(
                  <button
                    type="button"
                    style={{
                      ...ui.btnGhost,
                      width: 32,
                      height: 32,
                      padding: 0,
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: MUTED,
                    }}
                  >
                    <Trash2 style={{ width: 14, height: 14 }} />
                  </button>
                )}
                onConfirm={() => onDelete(g.id)}
              />
            </div>
          ))}
        </div>
      )}

      {groups.length === 0 && !showForm && (
        <p style={{ margin: 0, fontSize: 11, color: MUTED }}>{t("noChatGroups")}</p>
      )}

      {showForm && (
        <div
          style={{
            padding: 12,
            borderRadius: 10,
            border: "1px solid #E2E8F0",
            background: CARD,
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("groupName")}
              style={{ ...field, flex: 1, height: 34, background: SURFACE }}
            />
            <button
              type="button"
              onClick={() => setShowForm(false)}
              style={{
                ...ui.btnGhost,
                width: 34,
                height: 34,
                padding: 0,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <X style={{ width: 14, height: 14 }} />
            </button>
          </div>
          <p style={{ margin: 0, fontSize: 11, color: MUTED }}>{t("selectStationsForGroup")}</p>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
              gap: 4,
              maxHeight: 180,
              overflowY: "auto",
              borderRadius: 10,
              border: "1px solid #E2E8F0",
              padding: 6,
            }}
          >
            {options.map((o) => {
              const on = selected.includes(o.id);
              return (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => toggleStation(o.id)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "8px 10px",
                    borderRadius: 8,
                    border: on ? `1px solid color-mix(in oklab, ${ACCENT} 40%, #fff)` : "1px solid transparent",
                    background: on ? "color-mix(in oklab, #1E9E63 10%, #fff)" : "transparent",
                    color: NAVY,
                    fontSize: 12,
                    fontWeight: on ? 600 : 500,
                    cursor: "pointer",
                    fontFamily: "inherit",
                    textAlign: "start",
                  }}
                >
                  <span
                    style={{
                      width: 14,
                      height: 14,
                      borderRadius: 4,
                      border: on ? `1px solid ${ACCENT}` : "1px solid #CBD5E1",
                      background: on ? ACCENT : CARD,
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    {on && <span style={{ width: 6, height: 6, borderRadius: 1, background: CARD }} />}
                  </span>
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{o.name}</span>
                </button>
              );
            })}
          </div>
          <button
            type="button"
            onClick={submit}
            disabled={!name.trim() || selected.length < 2}
            style={{
              ...ui.btnPrimary,
              opacity: !name.trim() || selected.length < 2 ? 0.4 : 1,
              cursor: !name.trim() || selected.length < 2 ? "not-allowed" : "pointer",
              alignSelf: "flex-start",
            }}
          >
            {t("save")}
          </button>
        </div>
      )}
    </div>
  );
}
