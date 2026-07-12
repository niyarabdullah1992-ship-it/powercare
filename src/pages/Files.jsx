import React, { useState, useRef } from "react";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/PowerCareAuth";
import { addFileFolder, addCompanyFile, deleteFileNode } from "@/lib/store";
import { visibleStations } from "@/lib/permissions";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { FolderPlus, Upload, Loader2, ChevronRight, ChevronLeft, Home, Radio } from "lucide-react";
import FolderCard from "@/components/files/FolderCard";
import FileRow from "@/components/files/FileRow";
import NewFolderDialog from "@/components/files/NewFolderDialog";

export default function Files() {
  const { t, dir, lang } = useI18n();
  const { company, data, currentUser } = useAuth();
  const [path, setPath] = useState([]); // folder nodes from root down to the open folder
  const [folderDialogOpen, setFolderDialogOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  // Station scoping: managers/employees tied to stations default to their own station's documents.
  const myStations = visibleStations(currentUser, data || { stations: [] });
  const isStationScoped = currentUser?.role === "station_manager" || currentUser?.role === "pgm" || (currentUser?.role === "employee" && currentUser?.stationId);
  const defaultStation = isStationScoped ? (currentUser.stationId || myStations[0]?.id || "all") : "all";
  const [stationFilter, setStationFilter] = useState(defaultStation);

  const nodes = data?.files || [];
  const currentId = path.length ? path[path.length - 1].id : null;
  const childrenOf = (id) => nodes.filter((n) => (n.parentId || null) === id);
  const folders = childrenOf(currentId).filter((n) => n.type === "folder");
  const matchesStation = (f) =>
    stationFilter === "all" || (f.stationId || null) === (stationFilter === "hq" ? null : stationFilter);
  const files = childrenOf(currentId).filter((n) => n.type === "file" && matchesStation(n));
  const stationName = (id) => data?.stations?.find((s) => s.id === id)?.name || null;
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
      <div>
        <h1 className="font-heading text-2xl md:text-3xl font-semibold">{t("companyFiles")}</h1>
        <p className="text-sm text-muted-foreground font-body mt-1">{t("filesNote")}</p>
      </div>

      {/* Breadcrumb */}
      <div className="flex items-center gap-1 flex-wrap text-sm font-body">
        <button
          onClick={() => setPath([])}
          className={`flex items-center gap-1.5 px-2 py-1 rounded-md hover:bg-muted ${path.length === 0 ? "text-foreground font-medium" : "text-muted-foreground"}`}
        >
          <Home className="w-3.5 h-3.5" />
          {t("companyFiles")}
        </button>
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
        <Button variant="outline" onClick={() => setFolderDialogOpen(true)} className="font-body">
          <FolderPlus className="w-4 h-4 me-2" />
          {t("newFolder")}
        </Button>
        <Button onClick={() => fileInputRef.current?.click()} disabled={uploading} className="font-body">
          {uploading ? <Loader2 className="w-4 h-4 me-2 animate-spin" /> : <Upload className="w-4 h-4 me-2" />}
          {uploading ? t("uploading") : t("uploadFileBtn")}
        </Button>
        <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleUpload} />
        {/* Station filter — station managers land directly on their station's documents */}
        <div className="flex items-center gap-1.5 ms-auto">
          <Radio className="w-4 h-4 text-accent shrink-0" strokeWidth={1.5} />
          <select
            value={stationFilter}
            onChange={(e) => setStationFilter(e.target.value)}
            className="px-3 py-2 rounded-md border border-input bg-card text-sm font-body focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="all">{t("filesAllStations")}</option>
            <option value="hq">{t("hq")}</option>
            {myStations.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Folders */}
      {folders.length > 0 && (
        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground font-body mb-2">{t("foldersLabel")}</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {folders.map((folder) => (
              <FolderCard
                key={folder.id}
                folder={folder}
                count={childrenOf(folder.id).length}
                onOpen={() => setPath([...path, folder])}
                onDelete={() => deleteFileNode(company.id, folder.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Files */}
      {files.length > 0 && (
        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground font-body mb-2">{t("attachments")}</p>
          <div className="space-y-2">
            {files.map((file) => (
              <FileRow key={file.id} file={file} stationName={stationName(file.stationId)} onDelete={() => deleteFileNode(company.id, file.id)} />
            ))}
          </div>
        </div>
      )}

      {folders.length === 0 && files.length === 0 && (
        <div className="border border-dashed border-border rounded-lg py-16 text-center">
          <p className="text-sm text-muted-foreground font-body">{t("emptyFolderNote")}</p>
        </div>
      )}

      <NewFolderDialog
        open={folderDialogOpen}
        onOpenChange={setFolderDialogOpen}
        onCreate={(name) => addFileFolder(company.id, { name, parentId: currentId })}
      />
    </div>
  );
}