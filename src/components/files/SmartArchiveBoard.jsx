import React, { useEffect, useState } from "react";
import { FolderOpen, Loader2, Radio } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/PowerCareAuth";
import { ACCESS_LABELS, checkAccessGate } from "@/lib/fileArchiveDerivations";
import { toast } from "@/components/ui/use-toast";

async function filesApi(payload) {
  const res = await base44.functions.invoke("files", payload);
  return res?.data ?? res;
}

const ACCESS_CHIP = {
  restricted: "border-red-200 bg-red-50 text-red-700",
  all_staff: "border-emerald-200 bg-emerald-50 text-emerald-800",
  hr: "border-amber-200 bg-amber-50 text-amber-900",
  supervisors: "border-border bg-muted text-muted-foreground",
};

const KIND_CHIP = {
  PDF: "border-red-200 bg-red-50 text-red-700",
  XLSX: "border-emerald-200 bg-emerald-50 text-emerald-800",
  DWG: "border-border bg-muted text-muted-foreground",
  DOC: "border-blue-200 bg-blue-50 text-blue-800",
  IMG: "border-border bg-muted text-muted-foreground",
  FILE: "border-border bg-muted text-muted-foreground",
};

export default function SmartArchiveBoard({ lang = "ar" }) {
  const ar = lang === "ar";
  const { company, data, currentUser } = useAuth();
  const [folders, setFolders] = useState([]);
  const [recentFiles, setRecentFiles] = useState([]);
  const [stats, setStats] = useState(null);
  const [folderId, setFolderId] = useState(null);
  const [scope, setScope] = useState("all");
  const [busy, setBusy] = useState(false);
  const [gateHint, setGateHint] = useState(null);

  const stations = data?.stations || [];

  const applyRemote = (remote) => {
    if (Array.isArray(remote?.folders)) setFolders(remote.folders);
    if (Array.isArray(remote?.recentFiles)) setRecentFiles(remote.recentFiles);
    if (remote?.stats) setStats(remote.stats);
    if (remote?.folderId !== undefined) setFolderId(remote.folderId || null);
    if (remote?.scope) setScope(remote.scope);
  };

  const load = async (next = {}) => {
    if (!company?.id) return;
    setBusy(true);
    try {
      const payload = {
        action: "list",
        companyId: company.id,
        scope: next.scope ?? scope,
        folderId: next.folderId !== undefined ? next.folderId : folderId,
      };
      let remote = await filesApi(payload);
      if (Array.isArray(remote?.folders) && remote.folders.length === 0
        && Array.isArray(remote?.recentFiles) && remote.recentFiles.length === 0) {
        remote = await filesApi({ ...payload, action: "seedDemo" });
      }
      applyRemote(remote);
      setGateHint(null);
    } catch {
      setFolders([]);
      setRecentFiles([]);
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => { load({ scope: "all", folderId: null }); }, [company?.id]);

  const selectFolder = (id) => {
    const next = folderId === id ? null : id;
    setFolderId(next);
    load({ folderId: next });
  };

  const openNode = async (nodeId) => {
    if (!company?.id) return;
    try {
      const remote = await filesApi({ action: "get", companyId: company.id, nodeId });
      if (remote?.error) {
        setGateHint(ar ? remote.reason : (remote.reasonEn || remote.reason));
        toast({
          description: ar ? (remote.reason || remote.error) : (remote.reasonEn || remote.reason || remote.error),
          variant: "destructive",
        });
        return;
      }
      setGateHint(null);
    } catch (err) {
      toast({ description: String(err?.message || err), variant: "destructive" });
    }
  };

  if (!currentUser) return null;

  const actor = {
    role: currentUser.role,
    stationId: currentUser.stationId,
    owner: data?.ownerId === currentUser.id,
    stationIds: currentUser.managedStations || [],
  };

  const subtitle = folderId
    ? (ar
      ? `مصفّاة على: ${folders.find((f) => f.id === folderId)?.name || "…"}`
      : `Filtered by: ${folders.find((f) => f.id === folderId)?.name || "…"}`)
    : (ar
      ? "كل ملف مرتبط بمحطة وصلاحية وصول محددة"
      : "Each file is bound to a station and an access level");

  return (
    <section className="space-y-4" dir={ar ? "rtl" : "ltr"}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="rounded-lg bg-accent/15 p-2">
            <FolderOpen className="h-5 w-5 text-accent" />
          </span>
          <div>
            <h2 className="font-heading text-lg font-semibold">
              {ar ? "الأرشيف الذكي" : "Smart archive"}
            </h2>
            <p className="mt-1 max-w-2xl text-xs text-muted-foreground">
              {ar
                ? "مستندات مقيّدة بالصلاحية ومربوطة بالمحطة — العدّادات من الخادم"
                : "Permission-scoped documents linked to their station — counts from the server"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {busy && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
          <Radio className="h-3.5 w-3.5 text-muted-foreground" />
          <select
            value={scope}
            onChange={(e) => {
              const next = e.target.value;
              setScope(next);
              load({ scope: next });
            }}
            className="h-8 rounded-md border bg-background px-2 text-[11px]"
          >
            <option value="all">{ar ? "كل المحطات" : "All stations"}</option>
            {stations.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
      </div>

      {stats && (
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border bg-card px-4 py-3">
            <div className="text-[11px] text-muted-foreground">{ar ? "مجلدات ظاهرة" : "Visible folders"}</div>
            <div className="mt-1 font-heading text-2xl font-semibold tabular-nums" dir="ltr">{stats.folderCount}</div>
          </div>
          <div className="rounded-xl border bg-card px-4 py-3">
            <div className="text-[11px] text-muted-foreground">{ar ? "ملفات ضمن النطاق" : "Files in scope"}</div>
            <div className="mt-1 font-heading text-2xl font-semibold tabular-nums text-accent" dir="ltr">{stats.fileCount}</div>
          </div>
          <div className="rounded-xl border bg-card px-4 py-3">
            <div className="text-[11px] text-muted-foreground">{ar ? "محطات مربوطة" : "Bound stations"}</div>
            <div className="mt-1 font-heading text-2xl font-semibold tabular-nums" dir="ltr">{stats.stationCount}</div>
          </div>
        </div>
      )}

      {gateHint && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[11px] text-red-700">
          {gateHint}
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {folders.map((f) => {
          const selected = folderId === f.id;
          const access = f.access || "all_staff";
          return (
            <button
              key={f.id}
              type="button"
              onClick={() => selectFolder(f.id)}
              className={`rounded-[13px] border bg-card p-4 text-start transition ${
                selected ? "border-accent" : "border-border hover:border-accent/50"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <FolderOpen className="h-[18px] w-[18px] text-muted-foreground" />
                <span className={`rounded-md border px-2 py-0.5 text-[10px] font-semibold ${ACCESS_CHIP[access] || ACCESS_CHIP.all_staff}`}>
                  {ar ? (f.accessLabelAr || ACCESS_LABELS[access]?.ar) : (f.accessLabelEn || ACCESS_LABELS[access]?.en)}
                </span>
              </div>
              <div className="mt-3 text-sm font-semibold">{f.name}</div>
              <div className="mt-1 text-[11px] text-muted-foreground">
                {ar ? f.metaAr : f.metaEn}
              </div>
            </button>
          );
        })}
        {folders.length === 0 && (
          <div className="col-span-full rounded-xl border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
            {ar ? "لا مجلدات ظاهرة ضمن نطاقك." : "No folders visible in your scope."}
          </div>
        )}
      </div>

      <div className="overflow-hidden rounded-xl border bg-card">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3">
          <div className="text-sm font-semibold">{ar ? "أحدث الملفات" : "Recent files"}</div>
          <div className="text-[11px] text-muted-foreground">{subtitle}</div>
        </div>
        <div className="divide-y">
          {recentFiles.length === 0 && (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">
              {ar ? "لا ملفات في هذا النطاق." : "No files in this scope."}
            </div>
          )}
          {recentFiles.map((f) => {
            const localGate = checkAccessGate(actor, [...folders, ...recentFiles], f);
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => openNode(f.id)}
                className="grid w-full grid-cols-1 gap-2 px-4 py-3 text-start hover:bg-muted/40 sm:grid-cols-[minmax(220px,2fr)_130px_120px_90px_110px] sm:items-center sm:gap-3"
              >
                <div className="flex min-w-0 items-center gap-2.5">
                  <span className={`shrink-0 rounded-md border px-2 py-0.5 text-[10px] font-semibold ${KIND_CHIP[f.kind] || KIND_CHIP.FILE}`}>
                    {f.kind || "FILE"}
                  </span>
                  <span className="truncate text-sm font-medium">{f.name}</span>
                </div>
                <div className="truncate text-xs text-muted-foreground">{f.uploadedBy || "—"}</div>
                <div className="truncate text-xs text-muted-foreground">
                  {f.companyWide || f.stationId === "all"
                    ? (ar ? "كل المحطات" : "All stations")
                    : (f.stationName || f.stationId || "—")}
                </div>
                <div className="text-xs text-muted-foreground tabular-nums" dir="ltr">{f.sizeLabel || "—"}</div>
                <div className="text-xs text-muted-foreground">
                  {localGate.ok
                    ? (ar ? (f.updatedLabelAr || "—") : (f.updatedLabelEn || "—"))
                    : (ar ? localGate.reason : localGate.reasonEn)}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
