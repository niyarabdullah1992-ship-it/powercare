import React from "react";
import PublicSignShell from "@/components/files/PublicSignShell";
import PublicSignSteps from "@/components/files/PublicSignSteps";
import PublicSignStateCard from "@/components/files/PublicSignStateCard";
import PublicSignWorkspace from "@/components/files/PublicSignWorkspace";
import usePublicSigning from "@/hooks/usePublicSigning";

export default function PublicSign() {
  const signing = usePublicSigning();
  const { ar, info, failure, loading, done, reload } = signing;
  const expired = info?.expiresAt && new Date(info.expiresAt).getTime() <= Date.now();
  const waiting = info?.signer?.status === "pending" && !info?.canSign;
  const rejected = done?.rejected || info?.status === "rejected" || info?.signer?.status === "rejected";
  const success = !rejected && (done || info?.signer?.status === "signed");
  const invalidMessage = ar ? "رابط التوقيع غير صالح أو منتهي. اطلب من المرسل إنشاء طلب جديد." : "This signing link is invalid or expired. Ask the sender to create a new request.";
  const errorMessage = ar ? "تعذّر تحميل المستند بسبب خطأ مؤقت." : "The document couldn't be loaded because of a temporary error.";

  return (
    <PublicSignShell ar={ar}>
      {!loading && <PublicSignSteps ar={ar} current={success ? 3 : waiting || failure || expired ? 1 : 2} />}
      {loading ? <PublicSignStateCard ar={ar} type="loading" />
        : failure ? <PublicSignStateCard ar={ar} type="error" message={failure.type === "invalid" ? invalidMessage : `${errorMessage}${failure.message ? ` ${failure.message}` : ""}`} onRetry={reload} />
        : expired ? <PublicSignStateCard ar={ar} type="error" message={invalidMessage} onRetry={reload} />
        : waiting ? <PublicSignStateCard ar={ar} type="waiting" info={info} onRetry={reload} />
        : rejected ? <PublicSignStateCard ar={ar} type="rejected" info={info} done={done} />
        : success ? <PublicSignStateCard ar={ar} type="success" info={info} done={done} />
        : <PublicSignWorkspace signing={signing} />}
    </PublicSignShell>
  );
}