import React, { useState, useEffect, useRef } from "react";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/PowerCareAuth";
import { base44 } from "@/api/base44Client";
import { canSeeAllStations, visibleEmployees, visibleStations, isCompanyOwner, canTransferOwnership } from "@/lib/permissions";
import { stationInHeaderScope, isWorkplaceStation } from "@/lib/stationTree";
import { updateCompany, addStationChatGroup, removeStationChatGroup, getCompanyToken } from "@/lib/store";
import { MessageSquare, Mail, Search, Paperclip } from "lucide-react";
import ChatBubble from "@/components/chat/ChatBubble";
import ChatInboxList from "@/components/chat/ChatInboxList";
import ChatMediaGallery from "@/components/chat/ChatMediaGallery";
import ChatGroupManager from "@/components/chat/ChatGroupManager";
import ChatSearchPanel from "@/components/chat/ChatSearchPanel";
import CompanyEmailComposer from "@/components/chat/CompanyEmailComposer";
import CommentFiles from "@/components/tasks/CommentFiles";
import { checkSendGate } from "@/lib/chatDerivations";
import { getChatSeenMap, markChatSeen, setChatUnreadTotal, threadIsUnread } from "@/lib/chatUnreadStore";
import { toast } from "@/components/ui/use-toast";
import useStationScope from "@/hooks/useStationScope";
import PlatformStampShell from "@/components/shared/PlatformStampShell";
import { erpKicker } from "@/lib/erpModuleMeta";
import { BORDER, CARD, MUTED, NAVY, SURFACE, paneHeader, composerInput, ui } from "@/lib/chatUiStyles";

export default function StationChat() {
  const { t, lang } = useI18n();
  const { data, currentUser, company } = useAuth();
  const [selectedStation, setSelectedStation] = useState(null);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [files, setFiles] = useState([]);
  const [sending, setSending] = useState(false);
  const [activeTab, setActiveTab] = useState("chat");
  const [showEmail, setShowEmail] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [listQuery, setListQuery] = useState("");
  const [listFilter, setListFilter] = useState("all");
  const [inboxThreads, setInboxThreads] = useState([]);
  const bottomRef = useRef(null);
  const headerScope = useStationScope();

  const workplaces = !data || !currentUser ? [] : visibleStations(currentUser, data);
  const baseRooms = workplaces.map((s) => ({ key: s.id, name: s.name }));
  const isOwner = isCompanyOwner(currentUser, data) || canTransferOwnership(currentUser);
  const chatGroups = data?.stationChatGroups || [];
  const myGroups = chatGroups.filter((g) =>
    isOwner || canSeeAllStations(currentUser) ||
    (g.stationIds || []).includes(currentUser?.stationId)
  );
  const groupRooms = myGroups.map((g) => ({ key: `group_${g.id}`, name: g.name, isGroup: true }));
  const stationRooms = [
    ...(data?.crossStationChatEnabled ? [{ key: "all", name: t("allStationsChat") }] : []),
    ...groupRooms,
    ...baseRooms,
  ];
  const scopedRooms = headerScope && headerScope !== "all"
    ? stationRooms.filter((r) => {
        if (r.key === "all") return false;
        if (stationInHeaderScope(r.key, headerScope, data?.stations)) return true;
        if (r.isGroup) {
          const group = chatGroups.find((g) => `group_${g.id}` === r.key);
          return (group?.stationIds || []).some((id) => stationInHeaderScope(id, headerScope, data?.stations));
        }
        return false;
      })
    : stationRooms;
  const toggleCrossStationChat = () => {
    updateCompany(company.id, (d) => {
      d.crossStationChatEnabled = !d.crossStationChatEnabled;
    });
  };
  const addChatGroup = ({ name, stationIds }) => addStationChatGroup(company.id, { name, stationIds });
  const deleteChatGroup = (groupId) => removeStationChatGroup(company.id, groupId);

  const pickRoom = (key) => {
    if (company?.id && currentUser?.id) markChatSeen(company.id, currentUser.id, key);
    setSelectedStation(key);
    setActiveChat({ type: "general" });
    setActiveTab("chat");
    setShowEmail(false);
    setShowSettings(false);
  };

  const pickPerson = (person) => {
    if (company?.id && currentUser?.id) markChatSeen(company.id, currentUser.id, `dm:${person.id}`);
    setSelectedStation(person.stationId || null);
    setActiveChat({ type: "dm", userId: person.id, name: person.name });
    setActiveTab("chat");
    setShowEmail(false);
    setShowSettings(false);
  };

  useEffect(() => {
    if (!selectedStation || selectedStation === "all" || String(selectedStation).startsWith("group_")) return;
    const station = (data?.stations || []).find((item) => String(item.id) === String(selectedStation));
    if (station && !isWorkplaceStation(station)) {
      setSelectedStation(null);
      setActiveChat(null);
    }
  }, [selectedStation, data?.stations]);

  useEffect(() => {
    if (scopedRooms.length !== 1 || selectedStation) return;
    setSelectedStation(scopedRooms[0].key);
    setActiveChat({ type: "general" });
  }, [scopedRooms.length, selectedStation]);

  const roomKeys = scopedRooms.map((r) => String(r.key)).join("|");
  useEffect(() => {
    if (headerScope === "all") return;
    if (!roomKeys.split("|").includes(String(headerScope))) return;
    setSelectedStation(String(headerScope));
    setActiveChat((current) => current || { type: "general" });
  }, [headerScope, roomKeys]);

  const fetchMessages = async () => {
    if (!activeChat) return;
    try {
      if (activeChat.type === "general") {
        const res = await base44.functions.invoke("supabaseTargets", { action: "listChatMessages", stationId: selectedStation });
        const rows = [...(res?.data?.messages || [])].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        setMessages(rows);
      } else {
        const res = await base44.functions.invoke("supabaseTargets", { action: "listDirectMessages", userId: currentUser.id, otherUserId: activeChat.userId });
        const rows = (res?.data?.messages || [])
          .map((m) => ({ ...m, user_id: m.sender_id, user_name: m.sender_name }))
          .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
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
    if (!company?.id || !currentUser?.id) {
      setInboxThreads([]);
      setChatUnreadTotal(0);
      return undefined;
    }
    let cancelled = false;
    const load = () => {
      base44.functions
        .invoke("supabaseTargets", {
          action: "listUnreadInbox",
          companyId: company.id,
          sessionToken: getCompanyToken(company.id),
          stationIds: scopedRooms.map((room) => room.key),
        })
        .then((res) => {
          if (cancelled) return;
          const rows = Array.isArray(res?.data?.threads) ? res.data.threads : [];
          setInboxThreads(rows);
        })
        .catch(() => {
          if (!cancelled) setInboxThreads([]);
        });
    };
    load();
    const interval = setInterval(load, 12000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [company?.id, currentUser?.id, roomKeys]);

  useEffect(() => {
    if (!currentUser?.id) {
      setChatUnreadTotal(0);
      return;
    }
    const seen = getChatSeenMap(company?.id, currentUser.id);
    const activeKey = activeChat?.type === "dm" ? `dm:${activeChat.userId}` : selectedStation;
    const count = inboxThreads.filter((thread) =>
      String(thread.key) !== String(activeKey)
      && threadIsUnread(thread, seen[thread.key], currentUser.id)
    ).length;
    setChatUnreadTotal(count);
  }, [inboxThreads, activeChat, selectedStation, company?.id, currentUser?.id]);

  useEffect(() => {
    setActiveTab("chat");
    setShowEmail(false);
  }, [activeChat]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (e) => {
    e.preventDefault();
    const trimmed = text.trim();
    const gate = checkSendGate({
      text: trimmed,
      hasFiles: files.length > 0,
      channelId: selectedStation || activeChat?.userId || null,
      stationKey: selectedStation || null,
      companyId: company?.id,
      actor: {
        role: currentUser?.role,
        owner: isOwner,
        admin: currentUser?.role === "admin",
        userId: currentUser?.id,
        stationId: currentUser?.stationId || null,
        stationIds: currentUser?.stationId
          ? [currentUser.stationId, ...(currentUser.managedStations || [])]
          : (currentUser?.managedStations || []),
        allStations: canSeeAllStations(currentUser),
      },
      crossStationChatEnabled: !!data?.crossStationChatEnabled,
      stations: data?.stations || [],
    });
    if (!gate.ok) {
      toast({
        title: lang === "ar" ? gate.reason : gate.reasonEn,
        variant: "destructive",
      });
      return;
    }
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
      const msg = err?.response?.data?.reason || err?.response?.data?.error || "Failed to send message";
      toast({ title: msg, variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  const deleteMessage = async (msg) => {
    try {
      const action = activeChat?.type === "general" ? "deleteChatMessage" : "deleteDirectMessage";
      await base44.functions.invoke("supabaseTargets", { action, messageId: msg.id, userId: currentUser.id });
      fetchMessages();
    } catch (err) {
      alert(err?.response?.data?.error || "Failed to delete message");
    }
  };

  if (!data || !currentUser) return null;

  const stationName = scopedRooms.find((r) => r.key === selectedStation)?.name
    || stationRooms.find((r) => r.key === selectedStation)?.name
    || "";
  const chatTitle = activeChat?.type === "general" ? t("generalChat") : activeChat?.name || "";
  const ar = lang === "ar";
  const canSend = text.trim().length > 0 || files.length > 0;
  const sendStyle = {
    ...ui.btnCreate,
    height: 40,
    opacity: canSend && !sending ? 1 : 0.45,
    cursor: canSend && !sending ? "pointer" : "not-allowed",
  };
  const inboxPeople = visibleEmployees(currentUser, data).filter((person) => {
    if (person.id === currentUser.id) return false;
    if (headerScope && headerScope !== "all" && !stationInHeaderScope(person.stationId, headerScope, data?.stations)) return false;
    if (listQuery.trim()) return true;
    const home = selectedStation && !String(selectedStation).startsWith("group_") && selectedStation !== "all"
      ? selectedStation
      : currentUser.stationId;
    return String(person.stationId || "") === String(home || "");
  });
  const seenMap = getChatSeenMap(company?.id, currentUser.id);
  const activeThreadKey = activeChat?.type === "dm" ? `dm:${activeChat.userId}` : selectedStation;
  const unreadByKey = {};
  for (const thread of inboxThreads) {
    if (String(thread.key) === String(activeThreadKey)) continue;
    if (threadIsUnread(thread, seenMap[thread.key], currentUser.id)) {
      unreadByKey[thread.key] = { unread: true, preview: thread.preview, count: 1 };
    }
  }
  const stationLabel = (id) => {
    if (!id || id === "hq") return ar ? "بدون فرع" : "No branch";
    return (data?.stations || []).find((station) => String(station.id) === String(id))?.name || id;
  };

  const openTool = (key) => {
    setShowEmail(false);
    setShowSettings(false);
    setActiveTab(key);
  };

  return (
    <PlatformStampShell
      ar={ar}
      kicker={erpKicker("/app/chat", lang)}
      title={ar ? "المحادثات التشغيلية" : "Operations Chat"}
      hint={ar ? "قناة فرعك أولاً — ابحث عن أي زميل." : "Your branch channel first — search any colleague."}
      flushBody
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(280px, 320px) minmax(0, 1fr)",
          height: "min(78vh, 840px)",
          minHeight: 540,
          background: CARD,
        }}
        className="ops-chat-grid"
      >
        <aside style={{ height: "100%", minHeight: 0, overflow: "hidden", borderInlineEnd: `1px solid ${BORDER}` }}>
          <ChatInboxList
            ar={ar}
            query={listQuery}
            onQueryChange={setListQuery}
            filter={listFilter}
            onFilterChange={setListFilter}
            rooms={scopedRooms}
            people={inboxPeople}
            stationName={stationLabel}
            selectedStation={selectedStation}
            activeChat={activeChat}
            showSettings={showSettings}
            isOwner={isOwner}
            onPickRoom={pickRoom}
            onPickPerson={pickPerson}
            onOpenSettings={() => {
              setShowSettings(true);
              setShowEmail(false);
            }}
            unreadByKey={unreadByKey}
          />
        </aside>

        <section style={{ display: "flex", flexDirection: "column", height: "100%", minHeight: 0, minWidth: 0, background: CARD }}>
          {showSettings && isOwner ? (
            <>
              <div style={{ ...paneHeader, justifyContent: "space-between" }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: NAVY }}>{ar ? "إعدادات القنوات" : "Channel settings"}</div>
                  <div style={{ fontSize: 11, color: MUTED, marginTop: 2 }}>
                    {ar ? "اربط الفروع أو فعّل الدردشة المشتركة." : "Link branches or enable the shared company chat."}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowEmail((value) => !value)}
                  style={showEmail ? ui.btnCreateQuiet : { ...ui.btnCreateQuiet, background: SURFACE }}
                >
                  <Mail style={{ width: 13, height: 13 }} strokeWidth={1.75} />
                  {t("email")}
                </button>
              </div>
              {showEmail ? (
                <div style={{ flex: 1, overflowY: "auto", padding: 16, minHeight: 0 }}>
                  <CompanyEmailComposer employees={data.employees} currentUser={currentUser} companyId={company.id} />
                </div>
              ) : (
                <div style={{ flex: 1, overflowY: "auto", padding: 16, minHeight: 0, display: "flex", flexDirection: "column", gap: 12, background: SURFACE }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 10,
                      borderRadius: 12,
                      border: `1px solid ${BORDER}`,
                      background: CARD,
                      padding: "12px 14px",
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: NAVY }}>{t("enableCrossStationChat")}</div>
                      <div style={{ fontSize: 11, color: MUTED, marginTop: 3, lineHeight: 1.55 }}>
                        {ar ? "عند التفعيل تظهر غرفة واحدة لكل الموظفين." : "When on, one room is available to every employee."}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={toggleCrossStationChat}
                      aria-pressed={!!data.crossStationChatEnabled}
                      style={{
                        position: "relative",
                        width: 40,
                        height: 22,
                        borderRadius: 20,
                        border: "none",
                        background: data.crossStationChatEnabled ? "var(--nv-accent, #1E9E63)" : "#CBD5E1",
                        cursor: "pointer",
                        padding: 0,
                        flexShrink: 0,
                      }}
                    >
                      <span
                        style={{
                          position: "absolute",
                          top: 2,
                          insetInlineStart: data.crossStationChatEnabled ? 20 : 2,
                          width: 18,
                          height: 18,
                          borderRadius: "50%",
                          background: CARD,
                          boxShadow: "0 1px 2px rgba(20,40,75,.2)",
                        }}
                      />
                    </button>
                  </div>
                  <ChatGroupManager t={t} stations={workplaces} groups={chatGroups} onAdd={addChatGroup} onDelete={deleteChatGroup} />
                </div>
              )}
            </>
          ) : !selectedStation || !activeChat ? (
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 32, flexDirection: "column", gap: 8 }}>
              <span style={{ width: 48, height: 48, borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", background: SURFACE, color: NAVY, border: `1px solid ${BORDER}` }}>
                <MessageSquare style={{ width: 22, height: 22 }} strokeWidth={1.75} />
              </span>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: NAVY }}>
                {ar ? "اختر قناة أو زميلاً" : "Pick a channel or colleague"}
              </p>
              <p style={{ margin: 0, fontSize: 12, color: MUTED, textAlign: "center", maxWidth: 280 }}>
                {ar ? "من القائمة: قناة الفرع، مجموعة مرتبطة، أو محادثة مباشرة." : "From the list: a branch channel, linked group, or direct message."}
              </p>
            </div>
          ) : (
            <>
              <div style={{ ...paneHeader, justifyContent: "space-between", flexWrap: "wrap", gap: 10, flexShrink: 0 }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: NAVY, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {chatTitle || stationName}
                  </div>
                  <div style={{ fontSize: 11, color: MUTED, marginTop: 2 }}>
                    {stationName}{ar ? " · مرتبطة بالفرع" : " · bound to the station"}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => { setShowEmail((value) => !value); setActiveTab("chat"); }}
                  style={{
                    ...(showEmail ? ui.btnCreateQuiet : { ...ui.btnCreateQuiet, background: SURFACE }),
                    gap: 6,
                  }}
                >
                  <Mail style={{ width: 13, height: 13 }} strokeWidth={1.75} />
                  {t("email")}
                </button>
              </div>

              {!showEmail && (
                <div className="nv-tabrail" style={{ marginInline: 16, marginTop: 8 }}>
                  {[
                    { key: "chat", label: ar ? "المحادثة" : "Chat", icon: MessageSquare },
                    { key: "media", label: t("filesAndMedia"), icon: Paperclip },
                    { key: "search", label: t("search"), icon: Search },
                  ].map((tb) => {
                    const Icon = tb.icon;
                    const on = activeTab === tb.key;
                    return (
                      <button key={tb.key} type="button" aria-current={on ? "true" : undefined} onClick={() => openTool(tb.key)}>
                        <Icon style={{ width: 12, height: 12 }} strokeWidth={2} />
                        {tb.label}
                      </button>
                    );
                  })}
                </div>
              )}

              {showEmail ? (
                <div style={{ flex: 1, overflowY: "auto", padding: 16, minHeight: 0 }}>
                  <CompanyEmailComposer employees={data.employees} currentUser={currentUser} companyId={company.id} />
                </div>
              ) : activeTab === "search" ? (
                <ChatSearchPanel messages={messages} currentUserId={currentUser.id} t={t} lang={lang} />
              ) : activeTab === "media" ? (
                <ChatMediaGallery messages={messages} t={t} lang={lang} />
              ) : (
                <>
                  <div style={{ flex: 1, padding: 16, display: "flex", flexDirection: "column", gap: 12, overflowY: "auto", background: SURFACE, minHeight: 0 }}>
                    {messages.length === 0 && (
                      <p style={{ margin: "40px 0 0", textAlign: "center", fontSize: 13, color: MUTED }}>{t("noMessages")}</p>
                    )}
                    {messages.map((m) => (
                      <ChatBubble
                        key={m.id}
                        msg={m}
                        isMine={m.user_id === currentUser.id}
                        lang={lang}
                        onDelete={deleteMessage}
                      />
                    ))}
                    <div ref={bottomRef} />
                  </div>
                  <form onSubmit={sendMessage} style={{ background: CARD, borderTop: `1px solid ${BORDER}`, flexShrink: 0 }}>
                    {files.length > 0 && (
                      <div style={{ paddingTop: 10 }}>
                        <CommentFiles files={files} setFiles={setFiles} disabled={sending} variant="icon" showList showAttach={false} />
                      </div>
                    )}
                    <div style={{ padding: "10px 14px 12px", display: "flex", alignItems: "center", gap: 6 }}>
                      <CommentFiles files={files} setFiles={setFiles} disabled={sending} variant="icon" showList={false} />
                      <input
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        placeholder={ar ? "اكتب رسالة..." : t("typeMessage")}
                        style={composerInput}
                      />
                      <button type="submit" disabled={sending || !canSend} style={sendStyle}>
                        {ar ? "إرسال" : "Send"}
                      </button>
                    </div>
                  </form>
                </>
              )}
            </>
          )}
        </section>
      </div>

      <style>{`
        @media (max-width: 860px) {
          .ops-chat-grid {
            grid-template-columns: 1fr !important;
            height: auto !important;
            min-height: 0 !important;
          }
          .ops-chat-grid > aside,
          .ops-chat-grid > section {
            height: min(70vh, 640px) !important;
          }
        }
      `}</style>
    </PlatformStampShell>
  );
}
