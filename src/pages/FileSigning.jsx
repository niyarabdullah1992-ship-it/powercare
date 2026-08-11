import React, { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/PowerCareAuth";
import { base44 } from "@/api/base44Client";
import { getCompanyToken } from "@/lib/store";
import { PenLine, Send, Inbox, ShieldCheck } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import MySignatureCard from "@/components/files/MySignatureCard";
import MultiSignCard from "@/components/files/MultiSignCard";
import MultiSignInbox from "@/components/files/MultiSignInbox";
import VerifyDocumentCard from "@/components/files/VerifyDocumentCard";
import SigningChainBoard from "@/components/files/SigningChainBoard";
import { canCreateSignatureRequests, visibleEmployees } from "@/lib/permissions";

export default function FileSigning() {
  const { lang } = useI18n();
  const { company, data, currentUser } = useAuth();
  const ar = lang === "ar";
  const [multiRefresh, setMultiRefresh] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    if (!currentUser || !company) return;
    base44.functions.invoke("multiSign", {
      action: "list",
      companyId: company.id,
      sessionToken: getCompanyToken(company.id),
      userId: currentUser.id,
      email: (currentUser.email || "").toLowerCase(),
    }).then((response) => setPendingCount((response.data?.requests || []).filter((request) => request.myStatus === "pending").length)).catch(() => setPendingCount(0));
  }, [company, currentUser, multiRefresh]);

  if (!currentUser || !company) return null;

  const canCreate = canCreateSignatureRequests(currentUser, data);
  const scopedEmployees = visibleEmployees(currentUser, data || { stations: [], employees: [] });
  const tabs = [
    { value: "signature", label: ar ? "توقيعي" : "My signature", icon: PenLine },
    ...(canCreate ? [{ value: "send", label: ar ? "إرسال للتوقيع" : "Send for signing", icon: Send }] : []),
    { value: "inbox", label: ar ? "صندوق التوقيع" : "Signing inbox", icon: Inbox, count: pendingCount },
    { value: "verify", label: ar ? "التحقق من مستند" : "Verify document", icon: ShieldCheck },
  ];

  return (
    <div className="powercare-interior-page mx-auto w-full min-w-0 max-w-7xl overflow-x-hidden space-y-5">
      <header className="signing-page-header overflow-hidden rounded-2xl border border-accent/35 bg-gradient-to-l from-primary to-sidebar px-5 py-6 text-primary-foreground shadow-elevated sm:px-7">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
          <div className="flex items-center gap-4"><span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-accent/40 bg-primary-foreground/5"><PenLine className="h-6 w-6 text-accent" /></span><div><p className="text-[10px] font-bold uppercase tracking-[0.22em] text-accent">NiroVera Secure Sign</p><h1 className="mt-1 font-heading text-3xl font-semibold !text-primary-foreground md:text-4xl">{ar ? "منصة التوقيع الرقمي" : "Digital signing workspace"}</h1></div></div>
          <div className="flex items-center gap-2 rounded-full border border-accent/30 bg-primary-foreground/5 px-4 py-2 text-xs"><ShieldCheck className="h-4 w-4 text-accent" />{ar ? "تشفير وحماية موثّقة" : "Verified encryption & protection"}</div>
        </div>
      </header>
      <SigningChainBoard lang={lang} />
      <Tabs defaultValue="signature" dir={ar ? "rtl" : "ltr"} className="w-full min-w-0 max-w-full overflow-hidden">
        <TabsList className="signing-page-tabs h-auto w-full min-w-0 max-w-full justify-start gap-1 overflow-x-auto rounded-xl border border-accent/20 bg-card p-1.5 shadow-sm no-scrollbar">
          {tabs.map(({ value, label, icon: Icon, count }) => <TabsTrigger key={value} value={value} className="min-h-11 min-w-max gap-2 rounded-lg px-5 py-2.5 font-semibold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md"><Icon className="h-4 w-4" />{label}{count > 0 && <Badge className="h-5 min-w-5 justify-center rounded-full bg-accent px-1.5 text-accent-foreground">{count}</Badge>}</TabsTrigger>)}
        </TabsList>
        <TabsContent value="signature" className="mt-5"><MySignatureCard companyId={company.id} currentUser={currentUser} ar={ar} /></TabsContent>
        {canCreate && <TabsContent value="send" className="mt-5"><MultiSignCard currentUser={currentUser} companyId={company.id} employees={scopedEmployees} ar={ar} onCreated={() => setMultiRefresh((n) => n + 1)} /></TabsContent>}
        <TabsContent value="inbox" className="mt-5"><MultiSignInbox currentUser={currentUser} companyId={company.id} ar={ar} refreshKey={multiRefresh} onPendingChange={setPendingCount} /></TabsContent>
        <TabsContent value="verify" className="mt-5"><VerifyDocumentCard ar={ar} /></TabsContent>
      </Tabs>
    </div>
  );
}