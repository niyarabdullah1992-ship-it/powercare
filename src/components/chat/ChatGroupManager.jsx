import React, { useState } from "react";
import { Link2, Plus, X, Trash2 } from "lucide-react";
import ConfirmDeleteDialog from "@/components/ConfirmDeleteDialog";

// Owner-only control panel: link two or more stations (or HQ) into their own shared
// chat room, and create as many independent groups as needed.
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
    <div className="p-3 rounded-lg border border-border space-y-3">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <Link2 className="w-4 h-4 text-accent shrink-0" />
          <div>
            <p className="text-sm font-medium font-body">{t("chatGroups")}</p>
            <p className="text-xs text-muted-foreground font-body">{t("chatGroupsNote")}</p>
          </div>
        </div>
        <button
          onClick={() => setShowForm((s) => !s)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-body border border-border hover:bg-muted shrink-0"
        >
          <Plus className="w-3.5 h-3.5" /> {t("addChatGroup")}
        </button>
      </div>

      {groups.length > 0 && (
        <div className="space-y-2">
          {groups.map((g) => (
            <div key={g.id} className="flex items-center justify-between gap-2 p-2 rounded-md bg-background border border-border">
              <div className="flex flex-wrap items-center gap-1.5 min-w-0">
                <span className="text-xs font-medium font-body">{g.name}</span>
                {(g.stationIds || []).map((id) => (
                  <span key={id} className="px-2 py-0.5 rounded-full text-[10px] bg-muted text-muted-foreground font-body">{stationLabel(id)}</span>
                ))}
              </div>
              <ConfirmDeleteDialog
                trigger={<button className="p-1.5 rounded-md hover:bg-muted text-muted-foreground shrink-0"><Trash2 className="w-3.5 h-3.5" /></button>}
                onConfirm={() => onDelete(g.id)}
              />
            </div>
          ))}
        </div>
      )}

      {groups.length === 0 && !showForm && (
        <p className="text-xs text-muted-foreground font-body">{t("noChatGroups")}</p>
      )}

      {showForm && (
        <div className="p-3 rounded-md border border-border bg-background space-y-2.5">
          <div className="flex items-center gap-2">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("groupName")}
              className="flex-1 px-3 py-1.5 rounded-md border border-input text-xs font-body"
            />
            <button type="button" onClick={() => setShowForm(false)} className="p-1.5 rounded-md hover:bg-muted"><X className="w-3.5 h-3.5" /></button>
          </div>
          <p className="text-[11px] text-muted-foreground font-body">{t("selectStationsForGroup")}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 max-h-48 overflow-y-auto rounded-md border border-border p-1.5">
            {options.map((o) => (
              <button
                key={o.id}
                type="button"
                onClick={() => toggleStation(o.id)}
                className={`flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs font-body text-start transition ${selected.includes(o.id) ? "bg-foreground text-background" : "hover:bg-muted"}`}
              >
                <span className={`w-3.5 h-3.5 rounded-sm border shrink-0 flex items-center justify-center ${selected.includes(o.id) ? "bg-background border-background" : "border-current"}`}>
                  {selected.includes(o.id) && <span className="w-2 h-2 rounded-[1px] bg-foreground" />}
                </span>
                <span className="truncate">{o.name}</span>
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={submit}
            disabled={!name.trim() || selected.length < 2}
            className="px-3 py-1.5 rounded-md bg-foreground text-background text-xs font-body disabled:opacity-40"
          >
            {t("save")}
          </button>
        </div>
      )}
    </div>
  );
}