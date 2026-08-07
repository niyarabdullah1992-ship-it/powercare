import React, { useState, useMemo } from "react";
import { Search } from "lucide-react";
import ChatBubble from "@/components/chat/ChatBubble";

export default function ChatSearchPanel({ messages, tasks, currentUserId, t, lang }) {
  const [query, setQuery] = useState("");
  const [date, setDate] = useState("");
  const [taskType, setTaskType] = useState("all");

  const taskTypes = useMemo(() => {
    const set = new Set();
    (tasks || []).forEach((tk) => { if (tk.taskType) set.add(tk.taskType); });
    return [...set];
  }, [tasks]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    // Titles of tasks belonging to the selected type — a message "matches" a type
    // if it mentions the type name itself or any task title of that type.
    const typeTerms = taskType === "all" ? null : [
      taskType.toLowerCase(),
      ...(tasks || []).filter((tk) => tk.taskType === taskType).map((tk) => (tk.title || "").toLowerCase()).filter(Boolean),
    ];
    return (messages || []).filter((m) => {
      const body = (m.text || "").toLowerCase();
      if (q && !body.includes(q) && !(m.user_name || "").toLowerCase().includes(q)) return false;
      if (date) {
        const d = new Date(m.created_at || m.createdAt);
        if (isNaN(d) || d.toISOString().slice(0, 10) !== date) return false;
      }
      if (typeTerms && !typeTerms.some((term) => body.includes(term))) return false;
      return true;
    });
  }, [messages, query, date, taskType, tasks]);

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="px-5 py-3 border-b border-border space-y-2">
        <div className="relative">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("searchChatPlaceholder")}
            className="w-full ps-9 pe-3 py-2 rounded-md border border-input bg-card text-sm font-body focus:outline-none focus:ring-2 focus:ring-ring"
            dir="auto"
            autoFocus
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="px-3 py-1.5 rounded-md border border-input bg-card text-xs font-body"
            aria-label={t("byDateFilter")}
          />
          <select
            value={taskType}
            onChange={(e) => setTaskType(e.target.value)}
            className="px-3 py-1.5 rounded-md border border-input bg-card text-xs font-body"
          >
            <option value="all">{t("allTaskTypes")}</option>
            {taskTypes.map((tt) => (
              <option key={tt} value={tt}>{tt}</option>
            ))}
          </select>
          {(query || date || taskType !== "all") && (
            <button
              type="button"
              onClick={() => { setQuery(""); setDate(""); setTaskType("all"); }}
              className="text-xs text-accent hover:underline font-body"
            >
              {t("cancel")}
            </button>
          )}
          <span className="ms-auto text-[11px] text-muted-foreground font-body">
            {results.length} {t("matchingMessages")}
          </span>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
        {results.length === 0 ? (
          <p className="text-sm text-muted-foreground font-body text-center mt-10">{t("noMessages")}</p>
        ) : (
          results.map((m) => (
            <ChatBubble key={m.id} msg={m} isMine={m.user_id === currentUserId} lang={lang} />
          ))
        )}
      </div>
    </div>
  );
}