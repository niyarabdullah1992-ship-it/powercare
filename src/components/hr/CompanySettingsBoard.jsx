import React, { useEffect, useState } from "react";
import { Loader2, MapPin, Settings2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/PowerCareAuth";
import {
  checkCompanyRecordGate,
  checkGeofenceConfigGate,
  deriveVerificationMode,
} from "@/lib/settingsDerivations";
import { toast } from "@/components/ui/use-toast";

async function settingsApi(payload) {
  const res = await base44.functions.invoke("settings", payload);
  return res?.data ?? res;
}

export default function CompanySettingsBoard({ lang = "ar" }) {
  const ar = lang === "ar";
  const { company, data, currentUser } = useAuth();
  const [record, setRecord] = useState({
    name: "",
    commercialRegistration: "",
    vatNumber: "",
    qiwaEstablishment: "",
    allowedEmailDomain: "",
  });
  const [companyRows, setCompanyRows] = useState([]);
  const [geofences, setGeofences] = useState([]);
  const [verification, setVerification] = useState(deriveVerificationMode(true));
  const [rateLimits, setRateLimits] = useState([]);
  const [busy, setBusy] = useState(false);
  const [editGeo, setEditGeo] = useState(null);
  const [gateHint, setGateHint] = useState(null);

  const isOwner = currentUser && (
    data?.ownerId === currentUser.id
    || ["owner", "admin"].includes(currentUser.role)
  );
  const canManage = currentUser && (
    isOwner
    || ["director", "ops_manager", "pgm", "station_manager", "hr_manager"].includes(currentUser.role)
  );

  const applyRemote = (remote) => {
    if (!remote) return;
    if (remote.record) {
      setRecord({
        name: remote.record.name || "",
        commercialRegistration: remote.record.commercialRegistration || "",
        vatNumber: remote.record.vatNumber || "",
        qiwaEstablishment: remote.record.qiwaEstablishment || "",
        allowedEmailDomain: remote.record.allowedEmailDomain || "",
      });
    }
    if (Array.isArray(remote.companyRows)) setCompanyRows(remote.companyRows);
    if (Array.isArray(remote.geofences)) setGeofences(remote.geofences);
    if (remote.verification) setVerification(remote.verification);
    if (Array.isArray(remote.rateLimits)) setRateLimits(remote.rateLimits);
  };

  const load = async () => {
    if (!company?.id) return;
    setBusy(true);
    try {
      let remote = await settingsApi({ action: "list", companyId: company.id });
      const noRecord = !remote?.record?.commercialRegistration && !remote?.record?.vatNumber;
      const noGeo = Array.isArray(remote?.geofences)
        && remote.geofences.every((g) => !g.configured);
      if (canManage && (noRecord || noGeo)) {
        remote = await settingsApi({ action: "seedDemo", companyId: company.id });
      }
      applyRemote(remote);
      setGateHint(null);
    } catch {
      setCompanyRows([]);
      setGeofences([]);
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => { load(); }, [company?.id]);

  const saveRecord = async () => {
    if (!company?.id || !canManage) return;
    const gate = checkCompanyRecordGate(record);
    if (!gate.ok) {
      setGateHint(ar ? gate.reason : gate.reasonEn);
      toast({
        description: ar ? gate.reason : gate.reasonEn,
        variant: "destructive",
      });
      return;
    }
    setBusy(true);
    try {
      const remote = await settingsApi({
        action: "updateCompanyRecord",
        companyId: company.id,
        ...record,
      });
      if (remote?.error) {
        setGateHint(ar ? remote.reason : (remote.reasonEn || remote.reason));
        toast({
          description: ar ? (remote.reason || remote.error) : (remote.reasonEn || remote.error),
          variant: "destructive",
        });
        return;
      }
      applyRemote(remote);
      setGateHint(null);
      toast({ description: ar ? "حُفظت بيانات المنشأة" : "Company record saved" });
    } catch (err) {
      toast({ description: String(err?.message || err), variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  const toggleGeo = async () => {
    if (!company?.id || !isOwner) {
      setGateHint(ar
        ? "اشتراط التحقق بالموقع قرار لمالك الحساب وحده."
        : "Geofence verification is the account owner's decision alone.");
      return;
    }
    setBusy(true);
    try {
      const remote = await settingsApi({
        action: "setGeofenceVerification",
        companyId: company.id,
        enabled: !verification.geofenceVerificationRequired,
      });
      if (remote?.error) {
        setGateHint(ar ? remote.reason : (remote.reasonEn || remote.reason));
        toast({
          description: ar ? (remote.reason || remote.error) : (remote.reasonEn || remote.error),
          variant: "destructive",
        });
        return;
      }
      applyRemote(remote);
      setGateHint(null);
    } catch (err) {
      toast({ description: String(err?.message || err), variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  const saveGeofence = async () => {
    if (!company?.id || !canManage || !editGeo) return;
    const gate = checkGeofenceConfigGate(editGeo);
    if (!gate.ok) {
      setGateHint(ar ? gate.reason : gate.reasonEn);
      toast({
        description: ar ? gate.reason : gate.reasonEn,
        variant: "destructive",
      });
      return;
    }
    setBusy(true);
    try {
      const remote = await settingsApi({
        action: "updateGeofence",
        companyId: company.id,
        stationId: editGeo.stationId,
        lat: gate.lat,
        lng: gate.lng,
        radiusMeters: gate.radiusMeters,
      });
      if (remote?.error) {
        setGateHint(ar ? remote.reason : (remote.reasonEn || remote.reason));
        toast({
          description: ar ? (remote.reason || remote.error) : (remote.reasonEn || remote.error),
          variant: "destructive",
        });
        return;
      }
      applyRemote(remote);
      setEditGeo(null);
      setGateHint(null);
      toast({ description: ar ? "حُفظ النطاق الجغرافي" : "Geofence saved" });
    } catch (err) {
      toast({ description: String(err?.message || err), variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  if (!currentUser) return null;

  return (
    <section className="space-y-4" dir={ar ? "rtl" : "ltr"}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-heading text-xl font-semibold flex items-center gap-2">
            <Settings2 className="h-5 w-5" />
            {ar ? "إعدادات الشركة" : "Company settings"}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {ar
              ? "الحساب والنطاق الجغرافي — مصفوفة الصلاحيات والتفويض في الهيكل أعلاه"
              : "Account and geofences — permission matrix and delegation live in the structure board above"}
          </p>
        </div>
        {busy && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
      </div>

      {gateHint && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800">
          {gateHint}
        </p>
      )}

      {/* Company record */}
      <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
        <h3 className="font-heading text-base font-semibold">
          {ar ? "بيانات المنشأة" : "Company record"}
        </h3>
        {canManage ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              { key: "name", label: ar ? "اسم المنشأة" : "Company name", dir: "auto" },
              { key: "commercialRegistration", label: ar ? "السجل التجاري" : "Commercial registration", dir: "ltr" },
              { key: "vatNumber", label: ar ? "الرقم الضريبي" : "VAT number", dir: "ltr" },
              { key: "qiwaEstablishment", label: ar ? "رقم المنشأة في قوى" : "Qiwa establishment", dir: "ltr" },
              { key: "allowedEmailDomain", label: ar ? "النطاق البريدي المسموح" : "Allowed email domain", dir: "ltr" },
            ].map((f) => (
              <label key={f.key} className="block space-y-1">
                <span className="text-xs text-muted-foreground">{f.label}</span>
                <input
                  dir={f.dir}
                  value={record[f.key] || ""}
                  onChange={(e) => setRecord({ ...record, [f.key]: e.target.value })}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
              </label>
            ))}
            <div className="sm:col-span-2">
              <button
                type="button"
                disabled={busy}
                onClick={saveRecord}
                className="rounded-md bg-foreground px-4 py-2 text-sm text-background disabled:opacity-50"
              >
                {ar ? "احفظ بيانات المنشأة" : "Save company record"}
              </button>
            </div>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {companyRows.map((r) => (
              <div key={r.key}>
                <div className="text-xs text-muted-foreground">{ar ? r.labelAr : r.labelEn}</div>
                <div dir={r.dir} className="mt-1 text-sm font-medium">{r.value}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Geofences + owner switch */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="space-y-3 p-5">
          <div>
            <h3 className="font-heading text-base font-semibold flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              {ar ? "النطاق الجغرافي للمحطات" : "Station geofences"}
            </h3>
            <p className="mt-1 text-xs text-muted-foreground">
              {ar
                ? "تسجيل الحضور وإثبات العمل يُقبلان داخل هذا النطاق فقط."
                : "Check-in and work proof are accepted inside this radius only."}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-muted/40 px-4 py-3">
            <button
              type="button"
              onClick={toggleGeo}
              disabled={!isOwner || busy}
              aria-pressed={verification.geofenceVerificationRequired}
              className={`relative h-6 w-11 shrink-0 rounded-full border-0 transition-colors disabled:opacity-60 ${
                verification.geofenceVerificationRequired ? "bg-emerald-600" : "bg-slate-300"
              }`}
            >
              <span
                className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${
                  verification.geofenceVerificationRequired
                    ? "inset-inline-end-0.5"
                    : "inset-inline-start-0.5"
                }`}
              />
            </button>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold">
                {ar ? "اشتراط التحقق بالموقع الجغرافي" : "Require geofence verification"}
              </div>
              <div className={`mt-0.5 text-xs ${
                verification.geofenceVerificationRequired ? "text-emerald-700" : "text-amber-700"
              }`}>
                {ar ? verification.statusAr : verification.statusEn}
              </div>
            </div>
            <p className="basis-full text-xs text-muted-foreground leading-relaxed">
              {ar ? verification.noteAr : verification.noteEn}
            </p>
          </div>
        </div>

        <div className="overflow-x-auto border-t border-border">
          <div className="min-w-[620px]">
            <div className="grid grid-cols-[minmax(140px,1fr)_110px_minmax(180px,1fr)_100px] gap-3 bg-muted/50 px-5 py-2.5 text-[10px] font-semibold tracking-wide text-muted-foreground">
              <div>{ar ? "المحطة" : "STATION"}</div>
              <div>{ar ? "نصف القطر" : "RADIUS"}</div>
              <div>{ar ? "الإحداثيات" : "COORDINATES"}</div>
              <div />
            </div>
            {geofences.map((g) => (
              <div
                key={g.stationId}
                className="grid grid-cols-[minmax(140px,1fr)_110px_minmax(180px,1fr)_100px] gap-3 items-center border-t border-border/60 px-5 py-3"
              >
                <div>
                  <div className="text-sm font-medium">{g.name}</div>
                  <div className="mt-0.5 font-mono text-[10px] text-muted-foreground">{g.code}</div>
                </div>
                <div className="text-sm text-muted-foreground">
                  {ar ? g.radiusLabelAr : g.radiusLabelEn}
                </div>
                <div dir="ltr" className="font-mono text-sm text-muted-foreground text-end">
                  {g.configured
                    ? g.coordsLabel
                    : (ar ? "بانتظار تحديد الموقع" : "Awaiting site survey")}
                </div>
                <div>
                  {canManage && (
                    <button
                      type="button"
                      className="rounded-md border border-border px-2.5 py-1 text-xs hover:bg-muted"
                      onClick={() => setEditGeo({
                        stationId: g.stationId,
                        lat: g.lat ?? "",
                        lng: g.lng ?? "",
                        radiusMeters: g.radiusMeters || 200,
                      })}
                    >
                      {g.configured ? (ar ? "عدّل" : "Edit") : (ar ? "حدّد" : "Set")}
                    </button>
                  )}
                </div>
              </div>
            ))}
            {geofences.length === 0 && (
              <p className="px-5 py-6 text-sm text-muted-foreground">
                {ar ? "لا محطات بعد — أضف محطة من الهيكل." : "No stations yet — add one from the structure."}
              </p>
            )}
          </div>
        </div>

        {editGeo && (
          <div className="space-y-3 border-t border-border bg-muted/30 p-4">
            <div className="text-sm font-medium">
              {ar ? `تعديل نطاق: ${editGeo.stationId}` : `Edit geofence: ${editGeo.stationId}`}
            </div>
            <div className="grid gap-2 sm:grid-cols-3">
              <label className="block space-y-1">
                <span className="text-xs text-muted-foreground">Lat</span>
                <input
                  dir="ltr"
                  type="number"
                  step="any"
                  value={editGeo.lat}
                  onChange={(e) => setEditGeo({ ...editGeo, lat: e.target.value })}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
              </label>
              <label className="block space-y-1">
                <span className="text-xs text-muted-foreground">Lng</span>
                <input
                  dir="ltr"
                  type="number"
                  step="any"
                  value={editGeo.lng}
                  onChange={(e) => setEditGeo({ ...editGeo, lng: e.target.value })}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
              </label>
              <label className="block space-y-1">
                <span className="text-xs text-muted-foreground">{ar ? "نصف القطر (م)" : "Radius (m)"}</span>
                <input
                  dir="ltr"
                  type="number"
                  value={editGeo.radiusMeters}
                  onChange={(e) => setEditGeo({ ...editGeo, radiusMeters: e.target.value })}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
              </label>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={busy}
                onClick={saveGeofence}
                className="rounded-md bg-foreground px-3 py-1.5 text-sm text-background disabled:opacity-50"
              >
                {ar ? "احفظ" : "Save"}
              </button>
              <button
                type="button"
                onClick={() => setEditGeo(null)}
                className="rounded-md border border-border px-3 py-1.5 text-sm"
              >
                {ar ? "إلغاء" : "Cancel"}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Rate limits — read-only from complaints constants */}
      <div className="rounded-2xl border border-border bg-card p-5">
        <h3 className="font-heading text-base font-semibold">
          {ar ? "حدود البلاغات المجهولة" : "Anonymous report rate limits"}
        </h3>
        <p className="mt-1 text-xs text-muted-foreground">
          {ar
            ? "ثوابت مشتركة مع قسم الشكاوى (3 / 10 / 30) — للعرض فقط."
            : "Shared constants with Complaints (3 / 10 / 30) — read-only."}
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {rateLimits.map((r) => (
            <div key={r.key} className="rounded-xl border border-border px-4 py-3">
              <div className="text-xs text-muted-foreground">{ar ? r.labelAr : r.labelEn}</div>
              <div dir="ltr" className="mt-1 font-heading text-2xl font-semibold">{r.value}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
