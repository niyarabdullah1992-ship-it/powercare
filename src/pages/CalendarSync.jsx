import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { useI18n } from "@/lib/i18n";
import { CalendarDays, Loader2, Link2, LogIn, Unlink } from "lucide-react";
import CalendarEventList from "@/components/calendar/CalendarEventList";
import AddCalendarEvent from "@/components/calendar/AddCalendarEvent";

const CONNECTOR_ID = "6a537ecedf0deaf86823d8ce";

export default function CalendarSync() {
  const { lang } = useI18n();
  const ar = lang === "ar";
  const [authed, setAuthed] = useState(false);
  const [connected, setConnected] = useState(false);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  // Reusable fetch — doubles as the connection check and the data loader.
  const fetchEvents = useCallback(async () => {
    try {
      const res = await base44.functions.invoke("googleCalendar", { action: "listEvents" });
      setEvents(res.data?.events || []);
      setConnected(true);
    } catch {
      setConnected(false);
    }
  }, []);

  useEffect(() => {
    base44.auth.isAuthenticated().then(async (ok) => {
      setAuthed(ok);
      if (ok) await fetchEvents();
      setLoading(false);
    });
  }, [fetchEvents]);

  const handleConnect = async () => {
    setBusy(true);
    try {
      const url = await base44.connectors.connectAppUser(CONNECTOR_ID);
      const popup = window.open(url, "_blank");
      const timer = setInterval(() => {
        if (!popup || popup.closed) {
          clearInterval(timer);
          fetchEvents().finally(() => setBusy(false));
        }
      }, 500);
    } catch {
      setBusy(false);
    }
  };

  const handleDisconnect = async () => {
    setBusy(true);
    try {
      await base44.connectors.disconnectAppUser(CONNECTOR_ID);
      setConnected(false);
      setEvents([]);
    } finally {
      setBusy(false);
    }
  };

  const handleCreate = async (event) => {
    await base44.functions.invoke("googleCalendar", { action: "createEvent", ...event });
    await fetchEvents();
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-semibold flex items-center gap-2">
          <CalendarDays className="w-6 h-6 text-accent" strokeWidth={1.75} />
          {ar ? "تقويم Google" : "Google Calendar"}
        </h1>
        {connected && (
          <button onClick={handleDisconnect} disabled={busy}
            className="flex items-center gap-1.5 text-xs font-body text-muted-foreground hover:text-destructive disabled:opacity-50">
            <Unlink className="w-3.5 h-3.5" /> {ar ? "فصل الحساب" : "Disconnect"}
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
      ) : !authed ? (
        <div className="bg-card border border-border rounded-2xl p-8 text-center space-y-3">
          <LogIn className="w-8 h-8 text-accent mx-auto" strokeWidth={1.5} />
          <p className="text-sm text-muted-foreground font-body">
            {ar ? "لربط تقويمك الشخصي، سجّل الدخول بحساب المنصة أولًا." : "To connect your personal calendar, sign in to your platform account first."}
          </p>
          <button onClick={() => base44.auth.redirectToLogin()}
            className="px-5 py-2.5 rounded-lg bg-foreground text-background text-sm font-body font-semibold">
            {ar ? "تسجيل الدخول" : "Sign in"}
          </button>
        </div>
      ) : !connected ? (
        <div className="bg-card border border-border rounded-2xl p-8 text-center space-y-3">
          <Link2 className="w-8 h-8 text-accent mx-auto" strokeWidth={1.5} />
          <p className="text-sm text-muted-foreground font-body">
            {ar ? "اربط تقويم Google الخاص بك لعرض أحداثك وإضافة مواعيد العمل إليه." : "Connect your Google Calendar to view your events and add work appointments to it."}
          </p>
          <button onClick={handleConnect} disabled={busy}
            className="px-5 py-2.5 rounded-lg bg-foreground text-background text-sm font-body font-semibold disabled:opacity-50 inline-flex items-center gap-2">
            {busy && <Loader2 className="w-4 h-4 animate-spin" />}
            {ar ? "ربط تقويم Google" : "Connect Google Calendar"}
          </button>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
          <AddCalendarEvent onCreate={handleCreate} ar={ar} />
          <CalendarEventList events={events} ar={ar} />
        </div>
      )}
    </div>
  );
}