import React from "react";
import { Users } from "lucide-react";

export default function ChatContactList({ contacts, activeChat, onSelectGeneral, onSelectContact, t }) {
  return (
    <div className="flex-1 overflow-y-auto">
      <button
        onClick={onSelectGeneral}
        className={`w-full flex items-center gap-3 px-4 py-3 text-start border-b border-border/50 hover:bg-muted transition ${activeChat?.type === "general" ? "bg-muted" : ""}`}
      >
        <div className="w-9 h-9 rounded-full bg-accent/15 text-accent flex items-center justify-center shrink-0">
          <Users className="w-4 h-4" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium font-body truncate">{t("generalChat")}</p>
          <p className="text-[11px] text-muted-foreground font-body">{t("station")}</p>
        </div>
      </button>
      {contacts.map((c) => (
        <button
          key={c.id}
          onClick={() => onSelectContact(c)}
          className={`w-full flex items-center gap-3 px-4 py-3 text-start border-b border-border/50 hover:bg-muted transition ${activeChat?.type === "dm" && activeChat.userId === c.id ? "bg-muted" : ""}`}
        >
          <div className="w-9 h-9 rounded-full bg-foreground text-background flex items-center justify-center text-xs font-medium overflow-hidden shrink-0">
            {c.profile?.avatarUrl ? <img src={c.profile.avatarUrl} alt={c.name} className="w-full h-full object-cover" /> : c.name.charAt(0)}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium font-body truncate">{c.name}</p>
            <p className="text-[11px] text-muted-foreground font-body truncate">{t(c.role)}</p>
          </div>
        </button>
      ))}
      {contacts.length === 0 && (
        <p className="px-4 py-6 text-xs text-muted-foreground font-body text-center">{t("noResults")}</p>
      )}
    </div>
  );
}