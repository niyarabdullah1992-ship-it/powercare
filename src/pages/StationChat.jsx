import React, { useState, useEffect, useRef } from "react";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/PowerCareAuth";
import { base44 } from "@/api/base44Client";
import { canSeeAllStations, visibleStations, isCompanyOwner, canTransferOwnership } from "@/lib/permissions";
import { stationInHeaderScope, isWorkplaceStation } from "@/lib/stationTree";
import { updateCompany, addStationChatGroup, removeStationChatGroup, getCompanyToken } from "@/lib/store";
import { MessageSquare, Building2, Radio, Link2, Users, Settings2, Mail, Search, Paperclip } from "lucide-react";
import ChatBubble from "@/components/chat/ChatBubble";
import ChatContactList from "@/components/chat/ChatContactList";
import ChatMediaGallery from "@/components/chat/ChatMediaGallery";
import ChatGroupManager from "@/components/chat/ChatGroupManager";
import ChatSearchPanel from "@/components/chat/ChatSearchPanel";
import CompanyEmailComposer from "@/components/chat/CompanyEmailComposer";
import CommentFiles from "@/components/tasks/CommentFiles";
import { checkSendGate } from "@/lib/chatDerivations";
import { toast } from "@/components/ui/use-toast";
import useStationScope from "@/hooks/useStationScope";
import PlatformStampShell from "@/components/shared/PlatformStampShell";
import { ACCENT, BORDER, CARD, MUTED, NAVY, SURFACE, NEUTRAL, pane, paneHeader, channelBtn, composerInput, iconTile, ui } from "@/lib/chatUiStyles";

export default function StationChat() {
  const { t, dir, lang } = useI18n();
  const { data, currentUser, company } = useAuth();
  const [selectedStation, setSelectedStation] = useState(null);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [files, setFiles] = useState([]);
  const [sending, setSending] = useState(false);
  const [activeTab, setActiveTab] = useState("chat");
  const [showEmail, setShowEmail] = useState(false);
  const bottomRef = useRef(null);
  const headerScope = useStationScope();

  const workplaces = !data || !currentUser ? [] : visibleStations(currentUser, data);
  const baseRooms = workplaces.map((s) => ({ key: s.id, name: s.name }));
  const isOwner = isCompanyOwner(currentUser, data) || canTransferOwnership(currentUser);
  const chatGroups = data?.stationChatGroups || [];
  const myGroups = chatGroups.filter((g) =>
    isOwner || canSeeAllStations(currentUser) ||
    (g.stationIds || []).includes(currentUser?.stationId || "hq")
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
  const activeGroup = selectedStation?.startsWith("group_")
    ? chatGroups.find((g) => `group_${g.id}` === selectedStation)
    : null;
  const toggleCrossStationChat = () => {
    updateCompany(company.id, (d) => {
      d.crossStationChatEnabled = !d.crossStationChatEnabled;
    });
  };
  const addChatGroup = ({ name, stationIds }) => addStationChatGroup(company.id, { name, stationIds });
  const deleteChatGroup = (groupId) => removeStationChatGroup(company.id, groupId);

  const pickRoom = (key) => {
    setSelectedStation(key);
    setActiveChat({ type: "general" });
    setActiveTab("chat");
    setShowEmail(false);
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

  const contacts = !data || !selectedStation ? [] : (data.employees || []).filter((e) => {
    if (e.id === currentUser.id) return false;
    if (selectedStation === "all") return true;
    if (activeGroup) {
      const ids = activeGroup.stationIds || [];
      return ids.includes(e.stationId ? e.stationId : "hq");
    }
    return selectedStation === "hq" ? !e.stationId : e.stationId === selectedStation;
  });

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
      if (activeChat.type === "general" && company?.id && selectedStation) {
        try {
          await base44.functions.invoke("chat", {
            action: "send",
            companyId: company.id,
            sessionToken: getCompanyToken(company.id),
            channelId: selectedStation,
            stationKey: selectedStation,
            text: trimmed,
            files,
            stationIds: currentUser?.stationId
              ? [currentUser.stationId, ...(currentUser.managedStations || [])]
              : (currentUser?.managedStations || []),
            stations: (data?.stations || []).map((station) => ({ id: station.id, unitKind: station.unitKind })),
          });
        } catch {
          // Board blob may not have this station key yet — legacy path still runs.
        }
      }
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
    ...ui.btnPrimary,
    opacity: canSend && !sending ? 1 : 0.45,
    cursor: canSend && !sending ? "pointer" : "not-allowed",
  };

  const roomIcon = (r) => {
    const props = { width: 14, height: 14, strokeWidth: 1.75, style: { flexShrink: 0, color: selectedStation === r.key ? ACCENT : MUTED } };
    if (r.key === "all") return <MessageSquare {...props} />;
    if (r.isGroup) return <Link2 {...props} />;
    if (r.key === "hq") return <Building2 {...props} />;
    return <Radio {...props} />;
  };

  const openTool = (key) => {
    setShowEmail(false);
    setActiveTab(key);
  };

  return (
    <PlatformStampShell
      ar={ar}
      title={ar ? "المحادثات التشغيلية" : "Operations Chat"}
      hint={ar ? "القائمة تختار · الخيط يقرّر · المرفق يُثبت" : "List chooses · thread decides · attachment proves"}
      meta={<span style={NEUTRAL}>{ar ? "غرفة عمليات" : "Ops room"}</span>}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(260px, 300px) minmax(0, 1fr)",
          gap: 14,
          height: "min(78vh, 840px)",
          minHeight: 540,
        }}
        className="ops-chat-grid"
      >
        {/* Context column — choose only */}
        <aside style={{ ...pane, height: "100%", minHeight: 0, overflow: "hidden" }}>
          <div style={{ ...paneHeader, fontSize: 12, fontWeight: 600, color: NAVY, flexShrink: 0, letterSpacing: "0.02em" }}>
            {ar ? "السياق" : "Context"}
          </div>

          <div style={{ flexShrink: 0, padding: "10px 10px 8px", borderBottom: "1px solid #E2E8F0" }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: MUTED, letterSpacing: "0.05em", marginBottom: 8, paddingInline: 4 }}>
              {ar ? "الفرع / المجموعة" : "Station / group"}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4, maxHeight: 148, overflowY: "auto", overscrollBehavior: "contain" }}>
              {scopedRooms.map((r) => {
                const active = selectedStation === r.key;
                return (
                  <button key={r.key} type="button" onClick={() => pickRoom(r.key)} style={channelBtn(active)}>
                    {roomIcon(r)}
                    <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", padding: "10px 10px 0" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, paddingInline: 4, flexShrink: 0 }}>
              <Users style={{ width: 13, height: 13, color: MUTED }} strokeWidth={1.75} />
              <span style={{ fontSize: 10, fontWeight: 600, color: MUTED, letterSpacing: "0.05em" }}>
                {ar ? "الأعضاء" : "Members"}
              </span>
            </div>
            <div
              style={{
                flex: 1,
                minHeight: 0,
                borderRadius: 12,
                border: `1px solid ${BORDER}`,
                overflow: "hidden",
                background: CARD,
                display: "flex",
                flexDirection: "column",
              }}
            >
              {selectedStation ? (
                <ChatContactList
                  contacts={contacts}
                  activeChat={activeChat}
                  onSelectGeneral={() => { setActiveChat({ type: "general" }); openTool("chat"); }}
                  onSelectContact={(c) => { setActiveChat({ type: "dm", userId: c.id, name: c.name }); openTool("chat"); }}
                  t={t}
                  companyId={company?.id}
                  lang={lang}
                />
              ) : (
                <p style={{ margin: "auto", padding: 20, textAlign: "center", fontSize: 12, color: MUTED }}>
                  {ar ? "اختر فرع أولاً" : "Pick a station first"}
                </p>
              )}
            </div>
          </div>

          {isOwner && (
            <details style={{ flexShrink: 0, borderTop: `1px solid ${BORDER}`, padding: "8px 12px 12px", background: SURFACE }}>
              <summary
                style={{
                  cursor: "pointer",
                  listStyle: "none",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  fontSize: 12,
                  fontWeight: 600,
                  color: NAVY,
                  padding: "6px 0",
                }}
              >
                <Settings2 style={{ width: 14, height: 14, color: ACCENT }} strokeWidth={1.75} />
                {ar ? "إعدادات القنوات" : "Channel settings"}
              </summary>
              <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 10 }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 10,
                    borderRadius: 11,
                    border: `1px solid ${BORDER}`,
                    background: CARD,
                    padding: "11px 13px",
                  }}
                >
                  <span style={{ fontSize: 12, fontWeight: 600, color: NAVY }}>{t("enableCrossStationChat")}</span>
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
                      background: data.crossStationChatEnabled ? ACCENT : "#CBD5E1",
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
            </details>
          )}
        </aside>

        {/* Thread column — decide + prove */}
        <section style={{ ...pane, height: "100%", minHeight: 0, minWidth: 0 }}>
          {!selectedStation || !activeChat ? (
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 32, flexDirection: "column", gap: 8 }}>
              <span style={{ ...iconTile, width: 48, height: 48, borderRadius: 14 }}>
                <MessageSquare style={{ width: 22, height: 22 }} strokeWidth={1.75} />
              </span>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: NAVY }}>
                {ar ? "اختر قناة أو زميلاً" : "Pick a channel or colleague"}
              </p>
              <p style={{ margin: 0, fontSize: 12, color: MUTED, textAlign: "center", maxWidth: 280 }}>
                {ar ? "المحادثة العامة أولاً، ثم الرسائل المباشرة حسب الحالة." : "General channel first, then DMs by presence."}
              </p>
            </div>
          ) : (
            <>
              <div style={{ ...paneHeader, justifyContent: "space-between", flexWrap: "wrap", padding: "12px 16px", gap: 10, flexShrink: 0 }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: NAVY, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {chatTitle || stationName}
                  </div>
                  <div style={{ fontSize: 11, color: MUTED, marginTop: 2 }}>
                    {stationName}{ar ? " · مرتبطة بالفرع" : " · bound to the station"}
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <span style={NEUTRAL}>
                    {ar ? "مؤرشفة في سجل التشغيل" : "Archived in the operations log"}
                  </span>
                  <button
                    type="button"
                    onClick={() => { setShowEmail((v) => !v); setActiveTab("chat"); }}
                    style={{
                      ...ui.btnGhost,
                      height: 32,
                      padding: "0 10px",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      color: showEmail ? ACCENT : MUTED,
                      borderColor: showEmail ? "var(--nv-accent-border)" : BORDER,
                      background: showEmail ? "var(--nv-accent-soft)" : CARD,
                    }}
                  >
                    <Mail style={{ width: 13, height: 13 }} strokeWidth={1.75} />
                    {t("email")}
                  </button>
                </div>
              </div>

              {!showEmail && (
                <div className="nv-tabrail" style={{ marginInline: 16, marginTop: 8 }}>
                  {[
                    { key: "chat", label: ar ? "الخيط" : "Thread", icon: MessageSquare },
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
                        placeholder={t("typeMessage")}
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
