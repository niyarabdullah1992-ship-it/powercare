import React, { useState } from "react";
import { Camera } from "lucide-react";
import CameraCaptureModal from "@/components/chat/CameraCaptureModal";

export default function CameraCaptureButton({ files, setFiles, disabled, ar }) {
  const [open, setOpen] = useState(false);
  return <>
    <button type="button" disabled={disabled} onClick={() => setOpen(true)} className="flex items-center gap-1.5 rounded-md border border-border px-3 py-2 text-xs hover:bg-muted disabled:opacity-50">
      <Camera className="h-4 w-4" />{ar ? "الكاميرا" : "Camera"}
    </button>
    {open && (
      <CameraCaptureModal
        ar={ar}
        onClose={() => setOpen(false)}
        onCaptured={(file) => setFiles([...(files || []), file])}
      />
    )}
  </>;
}