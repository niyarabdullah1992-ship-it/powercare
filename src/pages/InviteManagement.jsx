import React, { useEffect, useState } from "react";
import { Loader2, MailPlus, ShieldAlert } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/PowerCareAuth";
import { canManageJobCatalog, invitesApi, catalogApi } from "@/lib/jobCatalogApi";
import { createEmployeeFromInvite, applySeatToEmployee } from "@/lib/jobSeats";
import { logAudit } from "@/lib/auditLog";
import InviteForm from "@/components/hr/invites/InviteForm";
import InviteExcelImport from "@/components/hr/invites/InviteExcelImport";
import InviteList from "@/components/hr/invites/InviteList";
import InviteApproveDialog from "@/components/hr/invites/InviteApproveDialog";
import VacantSeatRequests from "@/components/hr/catalog/VacantSeatRequests";

export default function InviteManagement() {
  const { lang } = useI18n();
  const ar = lang === "ar";
  const { data, currentUser, company } = useAuth();
  const [invites, setInvites] = useState([]);
  const [links, setLinks] = useState({});
  const [catalog, setCatalog] = useState({ titles: [], seats: [] });
  const [approving, setApproving] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const [inv, cat] = await Promise.all([
      invitesApi.list(company.id).catch(() => ({ invites: [] })),
      catalogApi.get(company.id).catch(() => ({ titles: [], seats: [] })),
    ]);
    setInvites(inv?.invites || []);
    setCatalog({ titles: cat?.titles || [], seats: cat?.seats || [] });
    setLoading(false);
  };
  useEffect(() => { if (company) load(); }, [company?.id]);

  if (!data || !currentUser) return null;
  if (!canManageJobCatalog(currentUser, data)) {
    return (
      <div className="rounded-xl border border-border bg-card p-8 text-center">
        <ShieldAlert className="mx-auto mb-3 h-8 w-8 text-destructive" />
        <p className="text-sm text-muted-foreground">{ar ? "هذه الصفحة متاحة للموارد البشرية ومالك الحساب فقط." : "This page is available to HR and the account owner only."}</p>
      </div>
    );
  }

  const createOne = async (fields) => {
    const res = await invitesApi.create(company.id, fields);
    if (res?.invite) {
      setInvites((list) => [res.invite, ...list]);
      setLinks((map) => ({ ...map, [res.invite.inviteId]: res.inviteUrl }));
    }
  };

  const importRows = async (rows) => {
    for (const row of rows) await createOne(row);
  };

  const revoke = async (invite) => {
    await invitesApi.revoke(company.id, invite.inviteId);
    load();
  };

  // الاعتماد: التحقق من المقعد الشاغر خادميًا، ثم إنشاء الموظف محليًا ووراثة المقعد،
  // ثم تفعيل بيانات الدخول من الدعوة.
  const approve = async (seat, title) => {
    const invite = approving;
    const employeeId = `emp_${Math.random().toString(36).slice(2, 9)}`;
    await catalogApi.assignSeat(company.id, seat.id, employeeId);
    createEmployeeFromInvite(company.id, invite, employeeId);
    applySeatToEmployee(company.id, employeeId, seat, title);
    await invitesApi.approve(company.id, invite.inviteId, employeeId, seat.id);
    await logAudit(company.id, "invite_seat_assigned", currentUser.name, `اعتماد ${invite.name} (${invite.jobNumber}) على مقعد "${title?.name || seat.id}".`);
    setApproving(null);
    load();
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-heading text-3xl font-semibold flex items-center gap-2"><MailPlus className="w-7 h-7 text-accent" />{ar ? "دعوات التوظيف" : "Hiring invites"}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{ar ? "أنشئ دعوات صالحة 7 أيام، ولا يُفعَّل أي حساب إلا بعد الاعتماد وربطه بمقعد وظيفي شاغر." : "Create 7-day invites. Accounts activate only after HR approval and linkage to a vacant job seat."}</p>
      </div>

      <VacantSeatRequests seats={catalog.seats} titles={catalog.titles} stations={data.stations || []} lang={lang} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <InviteForm onCreate={createOne} lang={lang} />
        <InviteExcelImport onRows={importRows} lang={lang} />
      </div>

      {loading ? (
        <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-accent" /></div>
      ) : (
        <InviteList invites={invites} links={links} onRevoke={revoke} onApprove={setApproving} lang={lang} />
      )}

      {approving && (
        <InviteApproveDialog
          invite={approving}
          seats={catalog.seats}
          titles={catalog.titles}
          stations={data.stations || []}
          onConfirm={approve}
          onClose={() => setApproving(null)}
          lang={lang}
        />
      )}
    </div>
  );
}