import React from "react";
import PowerCareUploadZone from "@/components/files/PowerCareUploadZone";

export default function GroupSignUploadZone({ ar, uploading, onPick }) {
  return (
    <PowerCareUploadZone
      onClick={onPick}
      loading={uploading}
      title={ar ? "ارفع المستند لبدء التوقيع الجماعي" : "Upload a document to start group signing"}
      description={ar ? "سيظهر المستند مباشرة لتوزيع حقول كل موقّع." : "The document will open so you can place fields for every signer."}
      formats="PDF"
    />
  );
}
