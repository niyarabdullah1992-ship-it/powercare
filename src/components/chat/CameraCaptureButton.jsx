import React, { useRef, useState } from "react";
import { Camera, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function CameraCaptureButton({ files, setFiles, disabled, ar }) {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const capture = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setFiles([...files, { url: file_url, name: file.name || `camera-${Date.now()}`, type: file.type }]);
    } finally { setUploading(false); event.target.value = ""; }
  };
  return <>
    <input ref={inputRef} type="file" accept="image/*,video/*" capture="environment" onChange={capture} className="hidden" />
    <button type="button" disabled={disabled || uploading} onClick={() => inputRef.current?.click()} className="flex items-center gap-1.5 rounded-md border border-border px-3 py-2 text-xs hover:bg-muted disabled:opacity-50">
      {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}{ar ? "الكاميرا" : "Camera"}
    </button>
  </>;
}