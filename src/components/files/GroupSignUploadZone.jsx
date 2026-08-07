import React from "react";
import PowerCareUploadZone from "@/components/files/PowerCareUploadZone";

export default function GroupSignUploadZone({ ar, uploading, inputRef, onUpload }) {
  return <>
    <PowerCareUploadZone
      onClick={() => inputRef.current?.click()}
      loading={uploading}
      title={ar ? "ارفع المستند لبدء التوقيع الجماعي" : "Upload a document to start group signing"}
      description={ar ? "سيظهر المستند مباشرة لتوزيع حقول كل موقّع بالسحب والإفلات." : "The document will open directly so you can drag and place fields for every signer."}
      formats="PDF"
      className="self-sign-upload-zone m-5 w-[calc(100%-2.5rem)]"
    />
    <input ref={inputRef} type="file" accept="application/pdf,.pdf" className="hidden" onChange={onUpload} />
  </>;
}