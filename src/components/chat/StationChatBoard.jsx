import React, { useEffect, useState } from "react";
import { Loader2, MessageSquare } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/PowerCareAuth";
import { getCompanyToken } from "@/lib/store";
import { toast } from "@/components/ui/use-toast";

async function chatApi(payload) {
  const res = await base44.functions.invoke("chat", payload);
  return res?.data ?? res;
}

export default function StationChatBoard({ lang = "ar", onPickChannel }) {
  const ar = lang === "ar";
  const { company, currentUser, data } = useAuth();
  const [channels, setChannels] = useState([]);
  const [stats, setStats] = useState(null);
  const [busy, setBusy] = useState(false);
  const [gateHint, setGateHint] = useState(null);
  const [empty, setEmpty] = useState(false);
  const [activeId, setActiveId] = useState(null);

  const basePayload = () => ({
    companyId: company?.id,
    sessionToken: company?.id ? getCompanyToken(company.id) : undefined,
    stationIds: currentUser?.stationId
      ? [currentUser.stationId, ...(currentUser.managedStations || [])]
      : (currentUser?.managedStations || []),
  });

  const applyRemote = (remote) => {
    if (Array.isArray(remote?.channels)) setChannels(remote.channels);
    if (remote?.stats) setStats(remote.stats);
    setEmpty(!!remote?.empty);
  };

  const load = async () => {
    if (!company?.id) return;
    setBusy(true);
    try {
      let remote = await chatApi({ ...basePayload(), action: "board" });
      if (remote?.empty || !(remote?.channels || []).length) {
        remote = await chatApi({ ...basePayload(), action: "seedDemo" });
      }
      if (remote?.error) {
        setGateHint(ar ? remote.reason : (remote.reasonEn || remote.error));
        applyRemote({ channels: [], stats: null });
      } else {
        setGateHint(null);
        applyRemote(remote);
      }
    } catch {
      setChannels([]);
      setStats(null);
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => { load(); }, [company?.id, currentUser?.id]);

  const pickChannel = async (ch) => {
    if (!company?.id) return;
    setActiveId(ch.id);
    if (typeof onPickChannel === "function") {
      onPickChannel(ch);
    }
    try {
      const remote = await chatApi({
        ...basePayload(),
        action: "markSeen",
        channelId: ch.id,
      });
      if (remote?.error) {
        const msg = ar ? remote.reason : (remote.reasonEn || remote.error);
        setGateHint(msg);
        toast({ title: msg, variant: "destructive" });
        return;
      }
      setGateHint(null);
      applyRemote(remote);
    } catch (err) {
      toast({ description: String(err?.message || err), variant: "destructive" });
    }
  };

  if (!company?.id || !currentUser) return null;

  return (
    <section className="space-y-3 mb-4" dir={ar ? "rtl" : "ltr"}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[11px] tracking-widest uppercase text-muted-foreground font-body mb-1">
            {ar ? "المحادثات التشغيلية" : "Operations chat"}
          </p>
          <p className="text-sm text-muted-foreground font-body">
            {ar
              ? "قنوات لكل محطة · الرسائل جزء من سجل التشغيل"
              : "A channel per station · messages are part of the operations log"}
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground font-body">
          {busy && <Loader2 className="w-4 h-4 animate-spin" />}
          {stats && (
            <>
              <span dir="ltr">{stats.channelCount} {ar ? "قنوات" : "channels"}</span>
              <span className={stats.unreadTotal > 0 ? "text-accent font-medium" : ""} dir="ltr">
                {stats.unreadTotal} {ar ? "غير مقروء" : "unread"}
              </span>
            </>
          )}
        </div>
      </div>

      {gateHint && (
        <p className="text-xs text-destructive font-body border border-destructive/30 bg-destructive/5 rounded-lg px-3 py-2">
          {gateHint}
        </p>
      )}

      {empty && !channels.length && (
        <p className="text-sm text-muted-foreground font-body">
          {ar ? "لا قنوات في نطاق شركتك بعد." : "No channels in your company scope yet."}
        </p>
      )}

      <div className="rounded-2xl border border-border bg-card overflow-hidden divide-y divide-border">
        {channels.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => pickChannel(c)}
            className={`w-full text-start px-4 py-3 hover:bg-muted/50 transition ${
              activeId === c.id ? "bg-accent/5" : ""
            }`}
          >
            <div className="flex items-center gap-2">
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ background: c.accent || "var(--accent)" }}
              />
              <span className="flex-1 text-sm font-medium font-body truncate">
                {ar ? c.nameAr : c.nameEn}
              </span>
              {c.unread > 0 && (
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-accent text-accent-foreground" dir="ltr">
                  {c.unread}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-1 ms-4">
              <MessageSquare className="w-3 h-3 text-muted-foreground shrink-0" />
              <p className="text-[11px] text-muted-foreground font-body truncate">
                {c.preview || (ar ? "لا رسائل بعد" : "No messages yet")}
              </p>
            </div>
          </button>
        ))}
      </div>
      {!data?.crossStationChatEnabled && (
        <p className="text-[11px] text-muted-foreground font-body">
          {ar
            ? "الرسائل مقيّدة بـ companyId ونطاق المحطة — لا تسريب بين المستأجرين."
            : "Messages are scoped by companyId and station visibility — no cross-tenant leak."}
        </p>
      )}
    </section>
  );
}
