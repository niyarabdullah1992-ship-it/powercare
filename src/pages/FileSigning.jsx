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

  const tabs = [
    { value: "signature", label: ar ? "توقيعي" : "My signature", icon: PenLine },
    { value: "send", label: ar ? "إرسال للتوقيع" : "Send for signing", icon: Send },
    { value: "inbox", label: ar ? "صندوق التوقيع" : "Signing inbox", icon: Inbox, count: pendingCount },
    { value: "verify", label: ar ? "التحقق من مستند" : "Verify document", icon: ShieldCheck },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="flex items-center gap-2 font-heading text-2xl font-semibold md:text-3xl"><PenLine className="h-6 w-6 text-accent" />{ar ? "التوقيع الرقمي" : "Digital signing"}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{ar ? "أنشئ توقيعك، أرسل المستندات، وتابع كل توقيع بختم زمني موثّق." : "Create your signature, send documents, and track every signer with a verified timestamp."}</p>
      </div>
      <Tabs defaultValue="signature" dir={ar ? "rtl" : "ltr"} className="w-full">
        <TabsList className="h-auto w-full justify-start gap-1 overflow-x-auto rounded-xl border border-border bg-card p-1.5 no-scrollbar">
          {tabs.map(({ value, label, icon: Icon, count }) => <TabsTrigger key={value} value={value} className="min-w-max gap-2 rounded-lg px-4 py-2.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"><Icon className="h-4 w-4" />{label}{count > 0 && <Badge className="h-5 min-w-5 justify-center rounded-full bg-accent px-1.5 text-accent-foreground">{count}</Badge>}</TabsTrigger>)}
        </TabsList>
        <TabsContent value="signature" className="mt-5"><MySignatureCard companyId={company.id} currentUser={currentUser} ar={ar} /></TabsContent>
        <TabsContent value="send" className="mt-5"><MultiSignCard currentUser={currentUser} companyId={company.id} employees={data?.employees || []} ar={ar} onCreated={() => setMultiRefresh((n) => n + 1)} /></TabsContent>
        <TabsContent value="inbox" className="mt-5"><MultiSignInbox currentUser={currentUser} companyId={company.id} ar={ar} refreshKey={multiRefresh} onPendingChange={setPendingCount} /></TabsContent>
        <TabsContent value="verify" className="mt-5"><VerifyDocumentCard ar={ar} /></TabsContent>
      </Tabs>
    </div>
  );
}