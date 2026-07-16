import React, { useEffect, useRef, useState } from "react";
import { Camera, Circle, Loader2, RefreshCw, Square, X } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { getMediaStream, isEmbedded, mediaErrorText, openStandalone } from "@/lib/mediaAccess";

// Live in-app camera: real preview + photo capture + video recording.
export default function CameraCaptureModal({ onCaptured, onClose, ar }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const recorderRef = useRef(null);
  const chunksRef = useRef([]);
  const [error, setError] = useState("");
  const [embedded, setEmbedded] = useState(false);
  const [facing, setFacing] = useState("environment");
  const [recording, setRecording] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setError("");
      streamRef.current?.getTracks().forEach((t) => t.stop());
      if (isEmbedded()) { setEmbedded(true); setError(mediaErrorText("embedded", ar)); return; }
      try {
        const stream = await getMediaStream({ video: { facingMode: facing }, audio: true });
        if (cancelled) { stream.getTracks().forEach((t) => t.stop()); return; }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
      } catch (err) {
        if (!cancelled) setError(mediaErrorText(err.code, ar));
      }
    })();
    return () => { cancelled = true; };
  }, [facing, ar]);

  useEffect(() => () => streamRef.current?.getTracks().forEach((t) => t.stop()), []);

  const upload = async (blob, name, type) => {
    setUploading(true);
    try {
      const file = new File([blob], name, { type });
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      onCaptured({ url: file_url, name, type });
      onClose();
    } catch {
      setError(ar ? "فشل رفع الملف. أعد المحاولة." : "Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const takePhoto = async () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d").drawImage(video, 0, 0);
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.9));
    if (blob) await upload(blob, `photo-${Date.now()}.jpg`, "image/jpeg");
  };

  const startRecording = () => {
    const stream = streamRef.current;
    if (!stream || !window.MediaRecorder) return;
    const mime = ["video/webm;codecs=vp8,opus", "video/webm", "video/mp4"].find((t) => MediaRecorder.isTypeSupported(t));
    const recorder = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
    chunksRef.current = [];
    recorder.ondataavailable = (e) => { if (e.data.size) chunksRef.current.push(e.data); };
    recorder.onstop = () => {
      const type = recorder.mimeType || "video/webm";
      const blob = new Blob(chunksRef.current, { type });
      const ext = type.includes("mp4") ? "mp4" : "webm";
      if (blob.size) upload(blob, `video-${Date.now()}.${ext}`, type);
    };
    recorder.start(1000);
    recorderRef.current = recorder;
    setRecording(true);
  };

  const stopRecording = () => {
    if (recorderRef.current?.state === "recording") recorderRef.current.stop();
    setRecording(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-lg overflow-hidden rounded-xl bg-card">
        <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
          <p className="text-sm font-medium font-body flex items-center gap-2"><Camera className="h-4 w-4 text-accent" />{ar ? "الكاميرا" : "Camera"}</p>
          <button onClick={onClose} className="rounded-md p-1 hover:bg-muted"><X className="h-4 w-4" /></button>
        </div>
        {error ? (
          <div className="space-y-3 p-6 text-center text-sm text-destructive font-body">
            <p>{error}</p>
            {embedded && (
              <button type="button" onClick={openStandalone} className="rounded-md border border-destructive/40 px-3 py-1.5 text-xs font-medium hover:bg-destructive/10">
                {ar ? "فتح التطبيق في نافذة مستقلة" : "Open the app in a standalone tab"}
              </button>
            )}
          </div>
        ) : (
          <video ref={videoRef} autoPlay playsInline muted className="aspect-video w-full bg-black object-cover" />
        )}
        <div className="flex items-center justify-center gap-3 p-3">
          <button onClick={() => setFacing((f) => (f === "environment" ? "user" : "environment"))} disabled={recording || uploading} className="rounded-full border border-border p-2.5 hover:bg-muted disabled:opacity-50" title={ar ? "تبديل الكاميرا" : "Switch camera"}>
            <RefreshCw className="h-4 w-4" />
          </button>
          <button onClick={takePhoto} disabled={!!error || recording || uploading} className="flex items-center gap-2 rounded-full bg-foreground px-4 py-2.5 text-sm text-background disabled:opacity-50">
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}{ar ? "التقاط صورة" : "Take photo"}
          </button>
          {!recording ? (
            <button onClick={startRecording} disabled={!!error || uploading} className="flex items-center gap-2 rounded-full border border-border px-4 py-2.5 text-sm hover:bg-muted disabled:opacity-50">
              <Circle className="h-4 w-4 text-destructive" />{ar ? "فيديو" : "Video"}
            </button>
          ) : (
            <button onClick={stopRecording} className="flex items-center gap-2 rounded-full bg-destructive px-4 py-2.5 text-sm text-destructive-foreground">
              <Square className="h-4 w-4" />{ar ? "إيقاف" : "Stop"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}