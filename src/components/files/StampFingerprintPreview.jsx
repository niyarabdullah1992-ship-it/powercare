import React, { useEffect, useRef } from "react";
import drawStampFingerprint from "@/lib/drawStampFingerprint";

export default function StampFingerprintPreview({ theme }) {
  const ref = useRef(null);
  useEffect(() => {
    const canvas = ref.current;
    const context = canvas.getContext("2d");
    context.clearRect(0, 0, canvas.width, canvas.height);
    drawStampFingerprint(context, canvas.width / 2, canvas.height / 2, 36, theme);
  }, [theme]);
  return <canvas ref={ref} width={64} height={52} className="h-8 w-10 shrink-0" aria-hidden="true" />;
}