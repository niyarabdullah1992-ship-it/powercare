import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { getCompanyToken } from "@/lib/store";
import { ERP_EVENTS } from "@/lib/erpWebhooks";
import { KeyRound, Copy, Check, Loader2, Webhook, Send } from "lucide-react";

export default function ApiWebhooksPanel({ company, ar }) {
  const [settings, setSettings] = useState(null);
  const [webhookUrl, setWebhookUrl] = useState("");
  const [events, setEvents] = useState([]);
  const [busy, setBusy] = useState("");
  const [copied, setCopied] = useState("");
  const [testResult, setTestResult] = useState(null);

  const invoke = (payload) =>
    base44.functions.invoke("erpApi", { ...payload, companyId: company.id, sessionToken: getCompanyToken(company.id) });

  useEffect(() => {
    invoke({ action: "getSettings" }).then((res) => {
      setSettings(res.data);
      setWebhookUrl(res.data?.webhookUrl || "");
      setEvents(res.data?.webhookEvents || []);
    }).catch(() => setSettings({ error: true }));
  }, [company.id]);

  const copy = (text, tag) => {
    navigator.clipboard.writeText(text);
    setCopied(tag);
    setTimeout(() => setCopied(""), 1500);
  };

  const generateKey = async () => {
    setBusy("key");
    const res = await invoke({ action: "generateApiKey" }).catch(() => null);
    if (res?.data?.apiKey) setSettings((s) => ({ ...s, apiKey: res.data.apiKey }));
    setBusy("");
  };

  const saveWebhook = async () => {
    setBusy("hook");
    await invoke({ action: "setWebhook", webhookUrl: webhookUrl.trim(), webhookEvents: events }).catch(() => {});
    setSettings((s) => ({ ...s, webhookUrl: webhookUrl.trim(), webhookEvents: events }));
    setBusy("");
  };

  const testWebhook = async () => {
    setBusy("test");
    setTestResult(null);
    const res = await invoke({ action: "testWebhook" }).catch(() => null);
    setTestResult(res?.data?.ok ? "ok" : "fail");
    setBusy("");
  };

  if (!settings) return <div className="py-10 flex justify-center"><Loader2 className="w-5 h-5 animate-spin text-accent" /></div>;

  const curl = `curl -X POST ${settings.endpointUrl} \\\n  -H "Content-Type: application/json" \\\n  -d '{"action":"api","apiKey":"${settings.apiKey || "YOUR_API_KEY"}","resource":"employees"}'`;

  return (
    <div className="space-y-4">
      {/* API key */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-3">
        <div className="flex items-center gap-2.5">
          <span className="w-9 h-9 rounded-lg bg-accent/10 text-accent flex items-center justify-center"><KeyRound className="w-4 h-4" strokeWidth={1.75} /></span>
          <h3 className="font-heading font-semibold">{ar ? "مفتاح API" : "API key"}</h3>
        </div>
        <p className="text-xs text-muted-foreground font-body">
          {ar ? "يتيح لأي نظام ERP خارجي قراءة بيانات شركتك (موظفون، محطات، مهام، رواتب...) عبر REST." : "Lets any external ERP read your company data (employees, stations, tasks, payroll...) over REST."}
        </p>
        {settings.apiKey ? (
          <div className="flex items-center gap-2">
            <code className="flex-1 min-w-0 truncate px-3 py-2 rounded-md bg-muted text-xs font-mono" dir="ltr">{settings.apiKey}</code>
            <button onClick={() => copy(settings.apiKey, "key")} className="p-2 rounded-md border border-border hover:bg-muted">
              {copied === "key" ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        ) : null}
        <button onClick={generateKey} disabled={busy === "key"} className="flex items-center gap-1.5 px-3.5 py-2 rounded-md bg-foreground text-background text-sm font-body disabled:opacity-50">
          {busy === "key" ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" strokeWidth={1.75} />}
          {settings.apiKey ? (ar ? "إعادة توليد المفتاح" : "Regenerate key") : (ar ? "توليد مفتاح" : "Generate key")}
        </button>
        <div className="space-y-1.5">
          <p className="text-[11px] text-muted-foreground font-body">{ar ? "مثال استدعاء:" : "Example call:"}</p>
          <div className="relative">
            <pre className="px-3 py-2.5 rounded-md bg-muted text-[10.5px] font-mono overflow-x-auto whitespace-pre" dir="ltr">{curl}</pre>
            <button onClick={() => copy(curl, "curl")} className="absolute top-2 end-2 p-1.5 rounded-md bg-card border border-border hover:bg-muted">
              {copied === "curl" ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
          <p className="text-[11px] text-muted-foreground font-body" dir="ltr">
            resource: employees · stations · tasks · reports · safety · payrollRuns · schedules · plans
          </p>
        </div>
      </div>

      {/* Webhooks */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-3">
        <div className="flex items-center gap-2.5">
          <span className="w-9 h-9 rounded-lg bg-accent/10 text-accent flex items-center justify-center"><Webhook className="w-4 h-4" strokeWidth={1.75} /></span>
          <h3 className="font-heading font-semibold">Webhooks</h3>
        </div>
        <p className="text-xs text-muted-foreground font-body">
          {ar ? "أرسل الأحداث فور وقوعها إلى نظامك — كل طلب موقّع بـ HMAC-SHA256 (ترويسة X-PowerCare-Signature) باستخدام مفتاح API." : "Push events to your system the moment they happen — every request is HMAC-SHA256 signed (X-PowerCare-Signature header) with your API key."}
        </p>
        <input
          value={webhookUrl}
          onChange={(e) => setWebhookUrl(e.target.value)}
          placeholder="https://your-erp.example.com/webhooks/powercare"
          dir="ltr"
          className="w-full px-3 py-2.5 rounded-md border border-input bg-background text-sm font-mono"
        />
        <div className="flex flex-wrap gap-2">
          {ERP_EVENTS.map((ev) => (
            <button
              key={ev}
              onClick={() => setEvents((cur) => (cur.includes(ev) ? cur.filter((x) => x !== ev) : [...cur, ev]))}
              className={`px-3 py-1.5 rounded-full text-xs font-mono border transition-colors ${
                events.includes(ev) ? "bg-accent text-accent-foreground border-accent" : "border-border text-muted-foreground hover:bg-muted"
              }`}
              dir="ltr"
            >
              {ev}
            </button>
          ))}
        </div>
        <p className="text-[11px] text-muted-foreground font-body">{ar ? "بدون تحديد = كل الأحداث." : "No selection = all events."}</p>
        <div className="flex items-center gap-2">
          <button onClick={saveWebhook} disabled={busy === "hook"} className="flex items-center gap-1.5 px-3.5 py-2 rounded-md bg-foreground text-background text-sm font-body disabled:opacity-50">
            {busy === "hook" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" strokeWidth={1.75} />} {ar ? "حفظ" : "Save"}
          </button>
          <button onClick={testWebhook} disabled={busy === "test" || !settings.webhookUrl} className="flex items-center gap-1.5 px-3.5 py-2 rounded-md border border-border text-sm font-body hover:bg-muted disabled:opacity-50">
            {busy === "test" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" strokeWidth={1.75} />} {ar ? "إرسال تجريبي" : "Send test"}
          </button>
          {testResult && (
            <span className={`text-xs font-body font-medium ${testResult === "ok" ? "text-emerald-600" : "text-destructive"}`}>
              {testResult === "ok" ? (ar ? "وصل بنجاح ✓" : "Delivered ✓") : (ar ? "فشل التسليم" : "Delivery failed")}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}