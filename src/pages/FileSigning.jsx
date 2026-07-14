import React, { useState } from "react";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/PowerCareAuth";
import { PenLine } from "lucide-react";
import MySignatureCard from "@/components/files/MySignatureCard";
import SignAndSendCard from "@/components/files/SignAndSendCard";
import VerifyDocumentCard from "@/components/files/VerifyDocumentCard";
import HowSigningWorks from "@/components/files/HowSigningWorks";
import SigningSteps from "@/components/files/SigningSteps";
import MultiSignCard from "@/components/files/MultiSignCard";
import MultiSignInbox from "@/components/files/MultiSignInbox";

// Standalone File Signing section: every employee keeps a personal signature and
// can sign & email documents to anyone directly from the platform.
export default function FileSigning() {
  const { lang } = useI18n();
  const { company, data, currentUser } = useAuth();
  const ar = lang === "ar";
  const [savedSignature, setSavedSignature] = useState(null);
  const [multiRefresh, setMultiRefresh] = useState(0);

  if (!currentUser || !company) return null;
  const signingUser = savedSignature
    ? { ...currentUser, profile: { ...(currentUser.profile || {}), ...savedSignature } }
    : currentUser;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="font-heading text-2xl md:text-3xl font-semibold flex items-center gap-2">
          <PenLine className="w-6 h-6 text-accent" /> {ar ? "توقيع الملفات" : "File Signing"}
        </h1>
        <p className="text-sm text-muted-foreground font-body mt-1">
          {ar
            ? "احفظ توقيعك الشخصي، ثم وقّع أي مستند وأرسله بالبريد الإلكتروني إلى أي شخص."
            : "Save your personal signature, then sign any document and email it to anyone."}
        </p>
      </div>
      <SigningSteps ar={ar} />
      <HowSigningWorks ar={ar} />
      <div className="grid md:grid-cols-2 gap-4">
        <MySignatureCard companyId={company.id} currentUser={currentUser} ar={ar} onSaved={setSavedSignature} />
        <SignAndSendCard currentUser={signingUser} companyId={company.id} companyName={data?.name || company?.name || ""} ar={ar} />
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <MultiSignCard
          currentUser={currentUser}
          companyId={company.id}
          employees={data?.employees || []}
          ar={ar}
          onCreated={() => setMultiRefresh((n) => n + 1)}
        />
        <MultiSignInbox currentUser={currentUser} companyId={company.id} ar={ar} refreshKey={multiRefresh} />
      </div>
      <VerifyDocumentCard ar={ar} />
    </div>
  );
}