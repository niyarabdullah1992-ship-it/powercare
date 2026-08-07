import React, { useEffect, useState } from "react";
import { BookOpenCheck, Loader2, Plus, ShieldAlert } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/PowerCareAuth";
import { canManageJobCatalog, catalogApi } from "@/lib/jobCatalogApi";
import JobTitleForm from "@/components/hr/catalog/JobTitleForm";
import JobTitlesTable from "@/components/hr/catalog/JobTitlesTable";
import JobSeatForm from "@/components/hr/catalog/JobSeatForm";
import UnitSeatsTable from "@/components/hr/catalog/UnitSeatsTable";

export default function JobCatalog() {
  const { lang } = useI18n();
  const ar = lang === "ar";
  const { data, currentUser, company } = useAuth();
  const [tab, setTab] = useState("titles");
  const [catalog, setCatalog] = useState({ titles: [], seats: [] });
  const [loading, setLoading] = useState(true);
  const [editingTitle, setEditingTitle] = useState(null); // null | false(new) | title
  const [editingSeat, setEditingSeat] = useState(null);

  const load = async () => {
    const cat = await catalogApi.get(company.id).catch(() => ({ titles: [], seats: [] }));
    setCatalog({ titles: cat?.titles || [], seats: cat?.seats || [] });
    setLoading(false);
  };
  useEffect(() => { if (company) load(); }, [company?.id]);

  if (!data || !currentUser) return null;
  if (!canManageJobCatalog(currentUser, data)) {
    return (
      <div className="rounded-xl border border-border bg-card p-8 text-center">
        <ShieldAlert className="mx-auto mb-3 h-8 w-8 text-destructive" />
        <p className="text-sm text-muted-foreground">{ar ? "كتالوج المسميات متاح للموارد البشرية ومالك الحساب فقط." : "The job catalog is available to HR and the account owner only."}</p>
      </div>
    );
  }

  const saveTitle = async (title) => { await catalogApi.saveTitle(company.id, title); load(); };
  const deleteTitle = async (title) => {
    if (!window.confirm(ar ? `حذف المسمى "${title.name}"؟` : `Delete title "${title.name}"?`)) return;
    await catalogApi.deleteTitle(company.id, title.id);
    load();
  };
  const saveSeat = async (seat) => { await catalogApi.saveSeat(company.id, seat); load(); };
  const deleteSeat = async (seat) => {
    if (!window.confirm(ar ? "حذف هذا المقعد؟" : "Delete this seat?")) return;
    await catalogApi.deleteSeat(company.id, seat.id);
    load();
  };

  const tabs = [
    { id: "titles", label: ar ? "المسميات الوظيفية" : "Job titles" },
    { id: "seats", label: ar ? "المقاعد الوظيفية" : "Job seats" },
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-heading text-3xl font-semibold flex items-center gap-2"><BookOpenCheck className="w-7 h-7 text-accent" />{ar ? "كتالوج المسميات والمقاعد" : "Job titles & seats catalog"}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{ar ? "السلالم: العام (المراتب 1–15 والممتازة)، التشغيل الفني (ف1–ف10)، الصحي (ص1–ص9)، وبند الأجور." : "Ladders: general (1–15 + excellent), technical (F1–F10), health (S1–S9), and wage-item contracts."}</p>
        </div>
        <button
          onClick={() => (tab === "titles" ? setEditingTitle(false) : setEditingSeat(false))}
          className="flex items-center gap-1.5 rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground"
        >
          <Plus className="w-4 h-4" />{tab === "titles" ? (ar ? "مسمى جديد" : "New title") : ar ? "مقعد جديد" : "New seat"}
        </button>
      </div>

      <div className="flex gap-1 rounded-lg border border-border bg-card p-1 w-fit">
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} className={`rounded-md px-4 py-2 text-sm font-medium ${tab === t.id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}>
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-accent" /></div>
      ) : tab === "titles" ? (
        <JobTitlesTable titles={catalog.titles} seats={catalog.seats} onEdit={setEditingTitle} onDelete={deleteTitle} lang={lang} />
      ) : (
        <UnitSeatsTable seats={catalog.seats} titles={catalog.titles} stations={data.stations || []} employees={data.employees || []} onEdit={setEditingSeat} onDelete={deleteSeat} lang={lang} />
      )}

      {editingTitle !== null && (
        <JobTitleForm initial={editingTitle || null} onSave={saveTitle} onClose={() => setEditingTitle(null)} lang={lang} />
      )}
      {editingSeat !== null && (
        <JobSeatForm initial={editingSeat || null} titles={catalog.titles} stations={data.stations || []} employees={data.employees || []} onSave={saveSeat} onClose={() => setEditingSeat(null)} lang={lang} />
      )}
    </div>
  );
}