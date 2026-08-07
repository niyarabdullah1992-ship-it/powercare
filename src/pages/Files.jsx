import React, { useState, useRef, useEffect } from "react";
import MobileSelect from "@/components/mobile/MobileSelect";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/PowerCareAuth";
import { addFileFolder, addCompanyFile, deleteFileNode, renameFileNode } from "@/lib/store";
import { visibleStations } from "@/lib/permissions";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { FolderPlus, Upload, Loader2, ChevronRight, ChevronLeft, Home, Radio, FolderOpen } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import FolderCard from "@/components/files/FolderCard";
import FileRow from "@/components/files/FileRow";
import NewFolderDialog from "@/components/files/NewFolderDialog";
import StationFilesCard from "@/components/files/StationFilesCard";

export default function Files() {
  const { t, dir, lang } = useI18n();
  const { company, data, currentUser } = useAuth();
  // Individual (personal) workspaces: no company or station concepts.
  const isIndividual = String(data?.plan || company?.plan || "").toLowerCase() === "individual";
  const pageTitle = isIndividual ? (lang === "ar" ? "ملفاتي" : "My Files") : t("companyFiles");
  const canManageFiles = isIndividual || data?.ownerId === currentUser?.id || ["director", "ops_manager"].includes(currentUser?.role);
  const [path, setPath] = useState([]); // folder nodes from root down to the open folder
  const [folderDialogOpen, setFolderDialogOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  // Station scoping: managers/employees tied to stations default to their own station's documents.
  const myStations = visibleStations(currentUser, data || { stations: [] });
  const isStationScoped = ["station_manager", "pgm", "employee"].includes(currentUser?.role);
  const defaultStation = isStationScoped ? (currentUser.stationId || myStations[0]?.id || "hq") : "all";
  const [stationFilter, setStationFilter] = useState(defaultStation);

  // Re-tapping the Files bottom tab resets the folder navigation to root.
  useEffect(() => {
    const onReset = (e) => { if (e.detail === "/app/files") setPath([]); };
    window.addEventListener("powercare:tab-reset", onReset);
    return () => window.removeEventListener("powercare:tab-reset", onReset);
  }, []);

  const nodes = data?.files || [];
  const currentId = path.length ? path[path.length - 1].id : null;
  const childrenOf = (id) => nodes.filter((n) => (n.parentId || null) === id);
  const matchesStation = (node) =>
    isIndividual || stationFilter === "all" || (node.stationId || null) === (stationFilter === "hq" ? null : stationFilter);
  const folders = childrenOf(currentId).filter((node) => node.type === "folder" && matchesStation(node));
  const files = childrenOf(currentId).filter((node) => node.type === "file" && matchesStation(node));
  const stationName = (id) => data?.stations?.find((s) => s.id === id)?.name || null;
  const showStationFolders = !isIndividual && stationFilter === "all" && path.length === 0;
  const activeStationName = stationFilter !== "all" && stationFilter !== "hq" ? stationName(stationFilter) : null;
  const stationItemCount = (stationId) => nodes.filter((node) => node.stationId === stationId).length;
  const Chevron = dir === "rtl" ? ChevronLeft : ChevronRight;

  const handleUpload = async (e) => {
    const selected = Array.from(e.target.files || []);
    if (!selected.length) return;
    setUploading(true);
    try {
      for (const file of selected) {
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        // Auto-link: the selected station filter wins; otherwise the uploader's own station.
        const linkedStation =
          stationFilter !== "all" && stationFilter !== "hq"
            ? stationFilter
            : currentUser?.stationId || null;
        addCompanyFile(company.id, {
          name: file.name, parentId: currentId, url: file_url,
          size: file.size, mimeType: file.type, uploadedBy: currentUser?.name || "",
          stationId: linkedStation,
        });
      }
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <PageHeader
        title={pageTitle}
        description={isIndividual ? (lang === "ar" ? "احفظ ونظّم مستنداتك الخاصة في مجلدات." : "Store and organize your personal documents in folders.") : t("filesNote")}
        icon={FolderOpen}
      />

      {/* Breadcrumb */}
      <div className="flex items-center gap-1 flex-wrap text-sm font-body">
        <button
          onClick={() => { setPath([]); if (!isIndividual && !isStationScoped) setStationFilter("all"); }}
          className={`flex items-center gap-1.5 px-2 py-1 rounded-md hover:bg-muted ${path.length === 0 && !activeStationName ? "text-foreground font-medium" : "text-muted-foreground"}`}
        >
          <Home className="w-3.5 h-3.5" />
          {pageTitle}
        </button>
        {activeStationName && <><Chevron className="w-3.5 h-3.5 text-muted-foreground" /><button onClick={() => setPath([])} className={`px-2 py-1 rounded-md hover:bg-muted ${path.length === 0 ? "text-foreground font-medium" : "text-muted-foreground"}`} dir="auto">{activeStationName}</button></>}
        {path.map((folder, i) => (
          <React.Fragment key={folder.id}>
            <Chevron className="w-3.5 h-3.5 text-muted-foreground" />
            <button
              onClick={() => setPath(path.slice(0, i + 1))}
              className={`px-2 py-1 rounded-md hover:bg-muted ${i === path.length - 1 ? "text-foreground font-medium" : "text-muted-foreground"}`}
              dir="auto"
            >
              {folder.name}
            </button>
          </React.Fragment>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-2">
        {canManageFiles && !showStationFolders && <Button variant="outline" onClick={() => setFolderDialogOpen(true)} className="font-body">
          <FolderPlus className="w-4 h-4 me-2" />
          {t("newFolder")}
        </Button>}
        {canManageFiles && !showStationFolders && <Button onClick={() => fileInputRef.current?.click()} disabled={uploading} className="font-body">
          {uploading ? <Loader2 className="w-4 h-4 me-2 animate-spin" /> : <Upload className="w-4 h-4 me-2" />}
          {uploading ? t("uploading") : t("uploadFileBtn")}
        </Button>}
        {canManageFiles && <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleUpload} />}
        {/* Station filter — hidden for individuals (no station concept) */}
        {!isIndividual && (
        <div className="flex items-center gap-1.5 ms-auto">
          <Radio className="w-4 h-4 text-accent shrink-0" strokeWidth={1.5} />
          <MobileSelect
            value={stationFilter}
            onChange={(value) => { setStationFilter(value); setPath([]); }}
            placeholder={t("filesAllStations")}
            searchable
            searchPlaceholder={t("search")}
            options={isStationScoped
              ? [
                  ...(!currentUser?.stationId && myStations.length === 0 ? [{ value: "hq", label: t("hq") }] : []),
                  ...myStations.map((station) => ({ value: station.id, label: station.name })),
                ]
              : [
                  { value: "all", label: t("filesAllStations") },
                  { value: "hq", label: t("hq") },
                  ...myStations.map((station) => ({ value: station.id, label: station.name })),
                ]}
          />
        </div>
        )}
      </div>

      {/* Stations are the top-level file containers. New stations appear here automatically. */}
      {showStationFolders && (
        <div>
          <p className="mb-2 text-xs uppercase tracking-wider text-muted-foreground font-body">{lang === "ar" ? "المحطات" : "Stations"}</p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {myStations.map((station) => <StationFilesCard key={station.id} station={station} count={stationItemCount(station.id)} onOpen={() => { setStationFilter(station.id); setPath([]); }} />)}
          </div>
        </div>
      )}

      {/* Folders */}
      {!showStationFolders && folders.length > 0 && (
        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground font-body mb-2">{t("foldersLabel")}</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {folders.map((folder) => (
              <FolderCard
                key={folder.id}
                folder={folder}
                count={childrenOf(folder.id).length}
                onOpen={() => setPath([...path, folder])}
                onDelete={canManageFiles ? () => deleteFileNode(company.id, folder.id) : undefined}
                onRename={canManageFiles ? (name) => renameFileNode(company.id, folder.id, name) : undefined}
              />
            ))}
          </div>
        </div>
      )}

      {/* Files */}
      {!showStationFolders && files.length > 0 && (
        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground font-body mb-2">{t("attachments")}</p>
          <div className="space-y-2">
            {files.map((file) => (
              <FileRow key={file.id} file={file} stationName={isIndividual ? null : stationName(file.stationId)} onDelete={canManageFiles ? () => deleteFileNode(company.id, file.id) : undefined} onRename={canManageFiles ? (name) => renameFileNode(company.id, file.id, name) : undefined} />
            ))}
          </div>
        </div>
      )}

      {!showStationFolders && folders.length === 0 && files.length === 0 && (
        <div className="border border-dashed border-border rounded-lg py-16 text-center">
          <p className="text-sm text-muted-foreground font-body">{t("emptyFolderNote")}</p>
        </div>
      )}

      {canManageFiles && !showStationFolders && <NewFolderDialog
        open={folderDialogOpen}
        onOpenChange={setFolderDialogOpen}
        onCreate={(name) => addFileFolder(company.id, {
          name,
          parentId: currentId,
          stationId: stationFilter !== "all" && stationFilter !== "hq" ? stationFilter : currentUser?.stationId || null,
        })}
      />}
    </div>
  );
}