import React, { useMemo, useState } from "react";
import { Link2, MessageSquare, Radio, Search, Settings2 } from "lucide-react";
import EmployeeNameLink from "@/components/employees/EmployeeNameLink";
import { BORDER, CARD, MUTED, NAVY, NAVY_FILL, SURFACE, channelBtn, filterChip, iconTile, ui } from "@/lib/chatUiStyles";

function matchesQuery(value, query) {
  if (!query) return true;
  return String(value || "").toLowerCase().includes(query);
}

export default function ChatInboxList({
  ar,
  query,
  onQueryChange,
  filter,
  onFilterChange,
  rooms = [],
  people = [],
  stationName,
  selectedStation,
  activeChat,
  showSettings,
  isOwner,
  onPickRoom,
  onPickPerson,
  onOpenSettings,
  unreadByKey = {},
}) {
  const [focused, setFocused] = useState(false);
  const q = String(query || "").trim().toLowerCase();

  const channels = rooms.filter((r) => !r.isGroup);
  const groups = rooms.filter((r) => r.isGroup);
  const visibleChannels = channels.filter((r) => matchesQuery(r.name, q));
  const visibleGroups = groups.filter((r) => matchesQuery(r.name, q));
  const visiblePeople = people.filter((p) => matchesQuery(p.name, q) || matchesQuery(p.role, q) || matchesQuery(stationName(p.stationId), q));

  const showUnreadOnly = filter === "unread";
  const showChannels = filter === "all" || filter === "channels" || showUnreadOnly;
  const showGroups = filter === "all" || filter === "groups" || showUnreadOnly;
  const showPeople = filter === "all" || filter === "people" || showUnreadOnly;

  const peopleByStation = useMemo(() => {
    const map = new Map();
    visiblePeople.forEach((person) => {
      const key = person.stationId || "";
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(person);
    });
    return [...map.entries()];
  }, [visiblePeople]);

  const metaOf = (key) => unreadByKey[key] || null;
  const listedChannels = visibleChannels.filter((room) => !showUnreadOnly || metaOf(room.key)?.unread);
  const listedGroups = visibleGroups.filter((room) => !showUnreadOnly || metaOf(room.key)?.unread);
  const listedPeopleByStation = peopleByStation
    .map(([stationId, members]) => [
      stationId,
      members.filter((person) => !showUnreadOnly || metaOf(`dm:${person.id}`)?.unread),
    ])
    .filter(([, members]) => members.length > 0);

  const unreadMark = (key) => {
    const meta = metaOf(key);
    if (!meta?.unread) return null;
    return (
      <span
        style={{
          minWidth: 18,
          height: 18,
          padding: "0 5px",
          borderRadius: 9,
          background: "var(--nv-accent, #1E9E63)",
          color: "#fff",
          fontSize: 10,
          fontWeight: 700,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          fontFamily: "'IBM Plex Sans',sans-serif",
        }}
      >
        {meta.count > 1 ? meta.count : ""}
      </span>
    );
  };

  const unreadCount = Object.values(unreadByKey).filter(Boolean).length;
  const chips = [
    { id: "all", label: ar ? "الكل" : "All" },
    { id: "unread", label: ar ? "غير مقروء" : "Unread", count: unreadCount || undefined },
    { id: "channels", label: ar ? "القنوات" : "Channels" },
    { id: "groups", label: ar ? "المجموعات" : "Groups" },
    { id: "people", label: ar ? "الأشخاص" : "People" },
  ];

  const roomIcon = (room, active) => {
    const props = { width: 16, height: 16, strokeWidth: 1.75, color: active ? NAVY : MUTED };
    if (room.key === "all") return <MessageSquare {...props} />;
    if (room.isGroup) return <Link2 {...props} />;
    return <Radio {...props} />;
  };

  const sectionLabel = (text) => (
    <div style={{ padding: "10px 14px 6px", fontSize: 11, fontWeight: 600, color: MUTED }}>
      {text}
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", minHeight: 0, background: CARD }}>
      <div style={{ flexShrink: 0, padding: "12px 12px 10px", borderBottom: `1px solid ${BORDER}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: NAVY }}>{ar ? "المحادثات" : "Conversations"}</div>
            <div style={{ fontSize: 11, color: MUTED, marginTop: 2 }}>
              {ar ? "قناة فرعك أولاً — ابحث عن أي زميل" : "Your branch channel first — search any colleague"}
            </div>
          </div>
          {isOwner ? (
            <button
              type="button"
              onClick={onOpenSettings}
              aria-pressed={showSettings}
              style={{
                ...(showSettings ? ui.btnCreateQuiet : { ...ui.btnCreateQuiet, background: SURFACE }),
                gap: 6,
                flexShrink: 0,
              }}
            >
              <Settings2 style={{ width: 14, height: 14 }} strokeWidth={1.75} />
              {ar ? "الإعدادات" : "Settings"}
            </button>
          ) : null}
        </div>

        <div style={{ position: "relative" }}>
          <Search
            style={{
              position: "absolute",
              insetInlineStart: 12,
              top: "50%",
              transform: "translateY(-50%)",
              width: 14,
              height: 14,
              color: MUTED,
              pointerEvents: "none",
            }}
          />
          <input
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder={ar ? "ابحث عن زميل في أي فرع..." : "Search a colleague in any branch…"}
            style={{
              width: "100%",
              height: 38,
              borderRadius: 999,
              border: `1px solid ${focused ? NAVY_FILL : BORDER}`,
              background: SURFACE,
              color: NAVY,
              paddingInlineStart: 34,
              paddingInlineEnd: 12,
              fontSize: 12,
              fontFamily: "inherit",
              boxSizing: "border-box",
              outline: "none",
            }}
          />
        </div>

        <div className="no-scrollbar" style={{ display: "flex", gap: 4, marginTop: 10, flexWrap: "nowrap", overflowX: "auto" }}>
          {chips.map((chip) => (
            <button
              key={chip.id}
              type="button"
              onClick={() => onFilterChange(chip.id)}
              style={{
                ...filterChip(filter === chip.id),
                flex: "1 0 auto",
                minWidth: 0,
                padding: "0 8px",
                fontSize: 11,
              }}
            >
              {chip.label}
              {chip.count ? (
                <span style={{ marginInlineStart: 4, fontFamily: "'IBM Plex Sans',sans-serif" }}>{chip.count}</span>
              ) : null}
            </button>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, minHeight: 0, overflowY: "auto" }}>
        {showChannels && listedChannels.length > 0 ? (
          <>
            {sectionLabel(ar ? "قنوات الفروع" : "Branch channels")}
            {listedChannels.map((room) => {
              const active = !showSettings && selectedStation === room.key && activeChat?.type === "general";
              const meta = metaOf(room.key);
              return (
                <button key={room.key} type="button" onClick={() => onPickRoom(room.key)} style={{ ...channelBtn(active), borderRadius: 0, padding: "10px 14px" }}>
                  <span style={{ ...iconTile, background: active ? CARD : SURFACE, borderRadius: 12 }}>{roomIcon(room, active)}</span>
                  <span style={{ minWidth: 0, flex: 1 }}>
                    <span style={{ display: "block", fontSize: 13, fontWeight: meta?.unread ? 700 : 600, color: NAVY, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {room.name}
                    </span>
                    <span style={{ display: "block", marginTop: 2, fontSize: 11, color: meta?.unread ? NAVY : MUTED }}>
                      {meta?.preview || (room.key === "all" ? (ar ? "كل الفروع" : "All branches") : (ar ? "قناة التشغيل" : "Ops channel"))}
                    </span>
                  </span>
                  {unreadMark(room.key)}
                </button>
              );
            })}
          </>
        ) : null}

        {showGroups && listedGroups.length > 0 ? (
          <>
            {sectionLabel(ar ? "المجموعات المرتبطة" : "Linked groups")}
            {listedGroups.map((room) => {
              const active = !showSettings && selectedStation === room.key && activeChat?.type === "general";
              const meta = metaOf(room.key);
              return (
                <button key={room.key} type="button" onClick={() => onPickRoom(room.key)} style={{ ...channelBtn(active), borderRadius: 0, padding: "10px 14px" }}>
                  <span style={{ ...iconTile, borderRadius: 12 }}>{roomIcon(room, active)}</span>
                  <span style={{ minWidth: 0, flex: 1 }}>
                    <span style={{ display: "block", fontSize: 13, fontWeight: meta?.unread ? 700 : 600, color: NAVY }}>{room.name}</span>
                    <span style={{ display: "block", marginTop: 2, fontSize: 11, color: meta?.unread ? NAVY : MUTED }}>
                      {meta?.preview || (ar ? "مجموعة فروع" : "Linked stations")}
                    </span>
                  </span>
                  {unreadMark(room.key)}
                </button>
              );
            })}
          </>
        ) : null}

        {showPeople ? listedPeopleByStation.map(([stationId, members]) => (
          <div key={stationId}>
            {sectionLabel(ar ? `زملاء ${stationName(stationId)}` : `${stationName(stationId)} colleagues`)}
            {members.map((person) => {
              const active = !showSettings && activeChat?.type === "dm" && String(activeChat.userId) === String(person.id);
              const threadKey = `dm:${person.id}`;
              const meta = metaOf(threadKey);
              return (
                <button
                  key={person.id}
                  type="button"
                  onClick={() => onPickPerson(person)}
                  style={{ ...channelBtn(active), borderRadius: 0, padding: "10px 14px" }}
                >
                  <span style={{ ...iconTile, overflow: "hidden", background: active ? CARD : SURFACE }}>
                    {person.profile?.avatarUrl
                      ? <img src={person.profile.avatarUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      : (person.name || "?").charAt(0)}
                  </span>
                  <span style={{ minWidth: 0, flex: 1, textAlign: "start" }}>
                    <span style={{ display: "block", fontSize: 13, fontWeight: meta?.unread ? 700 : 600, color: NAVY, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      <EmployeeNameLink employeeId={person.id} employeeName={person.name} onClick={(event) => event.stopPropagation()} />
                    </span>
                    <span style={{ display: "block", marginTop: 2, fontSize: 11, color: meta?.unread ? NAVY : MUTED }}>
                      {meta?.preview || person.role || (ar ? "موظف" : "Employee")}
                    </span>
                  </span>
                  {unreadMark(threadKey)}
                </button>
              );
            })}
          </div>
        )) : null}

        {((showUnreadOnly && unreadCount === 0)
          || (showChannels && listedChannels.length === 0 && showGroups && listedGroups.length === 0 && showPeople && listedPeopleByStation.length === 0)
          || (filter === "channels" && listedChannels.length === 0)
          || (filter === "groups" && listedGroups.length === 0)
          || (filter === "people" && listedPeopleByStation.length === 0)) ? (
          <p style={{ margin: 0, padding: "28px 16px", textAlign: "center", fontSize: 12, color: MUTED }}>
            {showUnreadOnly
              ? (ar ? "لا محادثات غير مقروءة." : "No unread conversations.")
              : (ar ? "لا نتائج في هذا البحث." : "No matches in this search.")}
          </p>
        ) : null}
      </div>

      <div style={{ flexShrink: 0, padding: "10px 14px", borderTop: `1px solid ${BORDER}`, fontSize: 11, color: MUTED, lineHeight: 1.55 }}>
        {ar ? "ابحث بالاسم لفتح محادثة مع موظف في فرع آخر." : "Search by name to open a chat with someone in another branch."}
      </div>
    </div>
  );
}
