import React, { useEffect, useMemo, useState } from "react";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/PowerCareAuth";
import { visibleStations } from "@/lib/permissions";
import { assetsCall } from "@/lib/assetsApi";
import { assetStatusLabel } from "@/lib/assetsApi";
import { Boxes, Plus, Loader2 } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import AssetStats from "@/components/assets/AssetStats";
import AssetFilters from "@/components/assets/AssetFilters";
import AssetTable from "@/components/assets/AssetTable";
import AssetDetail from "@/components/assets/AssetDetail";
import AssetForm from "@/components/assets/AssetForm";
import HandoverDialog from "@/components/assets/HandoverDialog";
import ComparisonExportButtons from "@/components/reports/ComparisonExportButtons";

export default function Assets() {
  const { lang } = useI18n();
  const { data, currentUser, session } = useAuth();
  const [assets, setAssets] = useState([]);
  const [custody, setCustody] = useState([]);
  const [maintenance, setMaintenance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ category: "all", stationId: "all", status: "all" });
  const [selected, setSelected] = useState(null);
  const [editing, setEditing] = useState(null);
  const [creating, setCreating] = useState(false);
  const [handing, setHanding] = useState(false);

  const reload = async () => {
    const res = await assetsCall(session, "list");
    setAssets(res?.assets || []);
    setCustody(res?.custody || []);
    setMaintenance(res?.maintenance || []);
  };

  useEffect(() => {
    if (!session?.companyId) return;
    (async () => {
      setLoading(true);
      try { await reload(); } finally { setLoading(false); }
    })();
  }, [session?.companyId]);

  // Scanning the printed QR label opens the asset card directly on mobile.
  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get("asset");
    if (!code || !assets.length) return;
    const match = assets.find((a) => a.qrCode === code || a.assetCode === code);
    if (match) setSelected(match.id);
  }, [assets]);

  const stations = data && currentUser ? visibleStations(currentUser, data) : [];
  const stationIds = new Set(stations.map((s) => s.id));
  const stationName = (id) => data?.stations?.find((s) => s.id === id)?.name || "—";
  const employees = (data?.employees || []).filter((e) => !e.stationId || stationIds.has(e.stationId));

  const scoped = useMemo(() => assets.filter((a) => stationIds.has(a.stationId)), [assets, data, currentUser]);
  const categories = [...new Set(scoped.map((a) => a.category).filter(Boolean))];

  const visible = scoped.filter((a) =>
    (filters.category === "all" || a.category === filters.category) &&
    (filters.stationId === "all" || a.stationId === filters.stationId) &&
    (filters.status === "all" || a.status === filters.status)
  );

  const selectedAsset = selected ? assets.find((a) => a.id === selected) : null;

  const saveAsset = async (asset) => {
    await assetsCall(session, "saveAsset", { asset, assetId: editing?.id || null });
    await reload();
  };
  const handover = async (payload) => {
    await assetsCall(session, "handover", payload);
    await reload();
  };
  const addMaintenance = async (record) => {
    await assetsCall(session, "logMaintenance", { assetId: selected, maintenance: record });
    await reload();
  };
  const markLost = async () => {
    const reason = window.prompt(lang === "ar" ? "سبب فتح بلاغ الفقدان" : "Reason for the loss report");
    if (reason === null) return;
    await assetsCall(session, "setStatus", { assetId: selected, status: "lost", reason });
    await reload();
  };

  const exportHeaders = lang === "ar"
    ? ["الأصل", "الرقم التسلسلي", "الفئة", "الحائز", "الوحدة", "الحالة", "الفحص القادم", "القيمة"]
    : ["Asset", "Serial", "Category", "Holder", "Unit", "Status", "Next inspection", "Value"];
  const exportRows = visible.map((a) => [a.name, a.assetCode, a.category || "—", a.holderName || "—", stationName(a.stationId), assetStatusLabel(a.status, lang), a.nextInspectionDate || "—", a.value || 0]);

  return (
    <div className="assets-hub space-y-5">
      <PageHeader
        title={lang === "ar" ? "الأصول والعهد" : "Assets & custody"}
        description={lang === "ar" ? "كل أصل له حائز واحد، وكل انتقال بين يدين موثّق بتوقيع الطرفين." : "Every asset has one holder, and every transfer is signed by both parties."}
        icon={Boxes}
        actions={
          <button onClick={() => { setEditing(null); setCreating(true); }} className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-sm font-body text-primary-foreground">
            <Plus className="w-4 h-4" /> {lang === "ar" ? "أصل جديد" : "New asset"}
          </button>
        }
      />

      <AssetStats assets={scoped} lang={lang} />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <AssetFilters lang={lang} stations={stations} categories={categories} filters={filters} setFilters={setFilters} />
        <ComparisonExportButtons
          title={lang === "ar" ? "سجل الأصول والعهد" : "Assets & custody register"}
          headers={exportHeaders}
          rows={exportRows}
          compact
        />
      </div>

      {loading ? (
        <Loader2 className="w-5 h-5 animate-spin text-accent mx-auto" />
      ) : (
        <AssetTable assets={visible} lang={lang} stationName={stationName} onOpen={(a) => setSelected(a.id)} />
      )}

      {selectedAsset && (
        <AssetDetail
          asset={selectedAsset}
          custody={custody.filter((c) => c.assetId === selectedAsset.id).sort((a, b) => new Date(b.handedAt) - new Date(a.handedAt))}
          maintenance={maintenance.filter((m) => m.assetId === selectedAsset.id).sort((a, b) => new Date(b.date) - new Date(a.date))}
          lang={lang}
          stationName={stationName}
          onClose={() => setSelected(null)}
          onHandover={() => setHanding(true)}
          onEdit={() => { setEditing(selectedAsset); setCreating(true); }}
          onAddMaintenance={addMaintenance}
          onMarkLost={markLost}
        />
      )}

      {handing && selectedAsset && (
        <HandoverDialog asset={selectedAsset} employees={employees} lang={lang} onClose={() => setHanding(false)} onSubmit={handover} />
      )}

      {creating && (
        <AssetForm asset={editing} stations={stations} employees={employees} lang={lang} onClose={() => { setCreating(false); setEditing(null); }} onSave={saveAsset} />
      )}
    </div>
  );
}