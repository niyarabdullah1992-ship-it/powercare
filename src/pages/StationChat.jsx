import React, { useState, useEffect, useRef } from "react";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/PowerCareAuth";
import { base44 } from "@/api/base44Client";
import { canSeeAllStations, visibleStations } from "@/lib/permissions";
import { MessageSquare, Send, ArrowLeft, Building2, Radio } from "lucide-react";
import ChatBubble from "@/components/chat/ChatBubble";
import ChatContactList from "@/components/chat/ChatContactList";
import CommentFiles from "@/components/tasks/CommentFiles";
import VoiceRecorder from "@/components/tasks/VoiceRecorder";

export default function StationChat() {
  const { t, dir, lang } = useI18n();
  const { data, currentUser, company } = useAuth();
  const [selectedStation, setSelectedStation] = useState(null);
  const [activeChat, setActiveChat] = useState(null); // { type: "general" } | { type: "dm", userId, name }
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [files, setFiles] = useState([]);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  const baseRooms = !data || !currentUser ? [] : canSeeAllStations(currentUser)
    ? [{ key: "hq", name: t("hq") }, ...data.stations.map((s) => ({ key: s.id, name: s.name }))]
    : currentUser.role === "pgm"
      ? visibleStations(currentUser, data).map((s) => ({ key: s.id, name: s.name }))
      : [{
          key: currentUser.stationId || "hq",
          name: currentUser.stationId ? (data.stations.find((s) => s.id === currentUser.stationId)?.name || t("station")) : t("hq"),
        }];
  const stationRooms = company?.crossStationChatEnabled
    ? [{ key: "all", name: t("allStationsChat") }, ...baseRooms]
    : baseRooms;

  useEffect(() => {
    if (stationRooms.length === 1 && !selectedStation) setSelectedStation(stationRooms[0].key);
  }, [stationRooms.length, selectedStation]);

  const contacts = !data || !selectedStation ? [] : data.employees.filter((e) => {
    if (e.id === currentUser.id) return false;
    if (selectedStation === "all") return true;
    return selectedStation === "hq" ? !e.stationId : e.stationId === selectedStation;
  });

  const fetchMessages = async () => {
    if (!activeChat) return;
    try {
      if (activeChat.type === "general") {
        const res = await base44.functions.invoke("supabaseTargets", { action: "listChatMessages", stationId: selectedStation });
        setMessages(res?.data?.messages || []);
      } else {
        const res = await base44.functions.invoke("supabaseTargets", { action: "listDirectMessages", userId: currentUser.id, otherUserId: activeChat.userId });
        const rows = (res?.data?.messages || []).map((m) => ({ ...m, user_id: m.sender_id, user_name: m.sender_name }));
        setMessages(rows);
      }
    } catch {
      setMessages([]);
    }
  };

  useEffect(() => {
    if (!activeChat) return;
    fetchMessages();
    const interval = setInterval(fetchMessages, 4000);
    return () => clearInterval(interval);
  }, [activeChat, selectedStation]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (e) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed && files.length === 0) return;
    setSending(true);
    try {
      if (activeChat.type === "general") {
        await base44.functions.invoke("supabaseTargets", {
          action: "sendChatMessage", stationId: selectedStation, userId: currentUser.id, userName: currentUser.name, text: trimmed, files,
        });
      } else {
        await base44.functions.invoke("supabaseTargets", {
          action: "sendDirectMessage", senderId: currentUser.id, senderName: currentUser.name, receiverId: activeChat.userId, text: trimmed, files,
        });
      }
      setText("");
      setFiles([]);
      fetchMessages();
    } catch (err) {
      alert(err?.response?.data?.error || "Failed to send message");
    } finally {
      setSending(false);
    }
  };

  if (!data || !currentUser) return null;

  const stationName = stationRooms.find((r) => r.key === selectedStation)?.name || "";
  const chatTitle = activeChat?.type === "general" ? t("generalChat") : activeChat?.name || "";

  return (
    <div className="space-y-6">
      <div className="border-b border-border pb-6">
        <p className="text-[11px] tracking-widest-xl uppercase text-muted-foreground font-body mb-2">{t("station")}</p>
        <h1 className="hero-title text-4xl md:text-5xl">{t("chat")}</h1>
      </div>

      {!selectedStation ? (
        <div className="border border-border bg-card p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {stationRooms.map((r) => (
            <button key={r.key} onClick={() => setSelectedStation(r.key)} className="flex items-center gap-3 p-4 rounded-lg border border-border hover:bg-muted transition text-start">
              <div className="w-9 h-9 rounded-md bg-foreground/5 flex items-center justify-center">
                {r.key === "all" ? <MessageSquare className="w-4 h-4" /> : r.key === "hq" ? <Building2 className="w-4 h-4" /> : <Radio className="w-4 h-4" />}
              </div>
              <p className="text-sm font-medium font-body">{r.name}</p>
            </button>
          ))}
        </div>
      ) : (
        <div className="border border-border bg-card flex h-[70vh]">
          <div className="w-64 shrink-0 border-e border-border flex flex-col">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
              {stationRooms.length > 1 && (
                <button onClick={() => { setSelectedStation(null); setActiveChat(null); }} className="p-1 rounded-md hover:bg-muted text-muted-foreground">
                  <ArrowLeft className={`w-4 h-4 ${dir === "rtl" ? "rotate-180" : ""}`} />
                </button>
              )}
              <p className="text-sm font-medium font-body truncate">{stationName}</p>
            </div>
            <ChatContactList
              contacts={contacts}
              activeChat={activeChat}
              onSelectGeneral={() => setActiveChat({ type: "general" })}
              onSelectContact={(c) => setActiveChat({ type: "dm", userId: c.id, name: c.name })}
              t={t}
            />
          </div>

          <div className="flex-1 flex flex-col">
            {!activeChat ? (
              <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground font-body">{t("noMessages")}</div>
            ) : (
              <>
                <div className="flex items-center gap-3 px-5 py-4 border-b border-border">
                  <MessageSquare className="w-4 h-4 text-accent" />
                  <h3 className="hero-title text-xl">{chatTitle}</h3>
                </div>
                <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
                  {messages.length === 0 ? (
                    <p className="text-sm text-muted-foreground font-body text-center mt-10">{t("noMessages")}</p>
                  ) : (
                    messages.map((m) => <ChatBubble key={m.id} msg={m} isMine={m.user_id === currentUser.id} lang={lang} />)
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
                    <button type="submit" disabled={sending} className="p-2.5 rounded-md bg-foreground text-background disabled:opacity-50">
                      <Send className={`w-4 h-4 ${dir === "rtl" ? "-scale-x-100" : ""}`} />
                    </button>
                  </div>
                  <div className="flex flex-wrap items-end gap-2">
                    <CommentFiles files={files} setFiles={setFiles} disabled={sending} />
                    <VoiceRecorder files={files} setFiles={setFiles} disabled={sending} />
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}