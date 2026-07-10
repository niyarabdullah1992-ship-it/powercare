import React, { useState, useEffect, useRef } from "react";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/PowerCareAuth";
import { base44 } from "@/api/base44Client";
import { canSeeAllStations, visibleStations } from "@/lib/permissions";
import { MessageSquare, Send, ArrowLeft, Building2, Radio } from "lucide-react";
import ChatBubble from "@/components/chat/ChatBubble";
import CommentFiles from "@/components/tasks/CommentFiles";

export default function StationChat() {
  const { t, dir, lang } = useI18n();
  const { data, currentUser } = useAuth();
  const [selected, setSelected] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [files, setFiles] = useState([]);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  const rooms = !data || !currentUser ? [] : canSeeAllStations(currentUser)
    ? [{ key: "hq", name: t("hq") }, ...data.stations.map((s) => ({ key: s.id, name: s.name }))]
    : currentUser.role === "pgm"
      ? visibleStations(currentUser, data).map((s) => ({ key: s.id, name: s.name }))
      : [{
          key: currentUser.stationId || "hq",
          name: currentUser.stationId ? (data.stations.find((s) => s.id === currentUser.stationId)?.name || t("station")) : t("hq"),
        }];

  useEffect(() => {
    if (rooms.length === 1 && !selected) setSelected(rooms[0].key);
  }, [rooms.length, selected]);

  const fetchMessages = async (stationKey) => {
    try {
      const res = await base44.functions.invoke("supabaseTargets", { action: "listChatMessages", stationId: stationKey });
      setMessages(res?.data?.messages || []);
    } catch {
      setMessages([]);
    }
  };

  useEffect(() => {
    if (!selected) return;
    fetchMessages(selected);
    const interval = setInterval(() => fetchMessages(selected), 4000);
    return () => clearInterval(interval);
  }, [selected]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (e) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed && files.length === 0) return;
    setSending(true);
    try {
      await base44.functions.invoke("supabaseTargets", {
        action: "sendChatMessage",
        stationId: selected,
        userId: currentUser.id,
        userName: currentUser.name,
        text: trimmed,
        files,
      });
      setText("");
      setFiles([]);
      fetchMessages(selected);
    } catch (err) {
      alert(err?.response?.data?.error || "Failed to send message");
    } finally {
      setSending(false);
    }
  };

  if (!data || !currentUser) return null;

  const roomName = rooms.find((r) => r.key === selected)?.name || "";

  return (
    <div className="space-y-6">
      <div className="border-b border-border pb-6">
        <p className="text-[11px] tracking-widest-xl uppercase text-muted-foreground font-body mb-2">{t("station")}</p>
        <h1 className="hero-title text-4xl md:text-5xl">{t("chat")}</h1>
      </div>

      <div className="border border-border bg-card">
        {!selected ? (
          <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {rooms.map((r) => (
              <button
                key={r.key}
                onClick={() => setSelected(r.key)}
                className="flex items-center gap-3 p-4 rounded-lg border border-border hover:bg-muted transition text-start"
              >
                <div className="w-9 h-9 rounded-md bg-foreground/5 flex items-center justify-center">
                  {r.key === "hq" ? <Building2 className="w-4 h-4" /> : <Radio className="w-4 h-4" />}
                </div>
                <p className="text-sm font-medium font-body">{r.name}</p>
              </button>
            ))}
          </div>
        ) : (
          <div className="flex flex-col h-[65vh]">
            <div className="flex items-center gap-3 px-5 py-4 border-b border-border">
              {rooms.length > 1 && (
                <button onClick={() => setSelected(null)} className="p-1.5 rounded-md hover:bg-muted text-muted-foreground">
                  <ArrowLeft className={`w-4 h-4 ${dir === "rtl" ? "rotate-180" : ""}`} />
                </button>
              )}
              <MessageSquare className="w-4 h-4 text-accent" />
              <h3 className="hero-title text-xl">{roomName}</h3>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
              {messages.length === 0 ? (
                <p className="text-sm text-muted-foreground font-body text-center mt-10">{t("noMessages")}</p>
              ) : (
                messages.map((m) => (
                  <ChatBubble key={m.id} msg={m} isMine={m.user_id === currentUser.id} lang={lang} />
                ))
              )}
              <div ref={bottomRef} />
            </div>

            <form onSubmit={sendMessage} className="border-t border-border p-4 space-y-2">
              <div className="flex items-end gap-2">
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(e); } }}
                  rows={1}
                  placeholder={t("typeMessage")}
                  className="flex-1 px-3 py-2 rounded-md border border-input text-sm font-body resize-none"
                />
                <button
                  type="submit"
                  disabled={sending}
                  className="p-2.5 rounded-md bg-foreground text-background disabled:opacity-50"
                >
                  <Send className={`w-4 h-4 ${dir === "rtl" ? "-scale-x-100" : ""}`} />
                </button>
              </div>
              <CommentFiles files={files} setFiles={setFiles} disabled={sending} />
            </form>
          </div>
        )}
      </div>
    </div>
  );
}