import React, { useState, useRef } from "react";
import { useI18n } from "@/lib/i18n";
import { base44 } from "@/api/base44Client";
import { Mic, Square, Loader2 } from "lucide-react";

export default function VoiceRecorder({ files, setFiles, disabled, onRecorded }) {
  const { t } = useI18n();
  const [recording, setRecording] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const recorderRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);

  const start = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const supportedTypes = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg;codecs=opus"];
      const mimeType = supportedTypes.find((type) => MediaRecorder.isTypeSupported(type));
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      recorder.onerror = () => {
        stream.getTracks().forEach((track) => track.stop());
        clearInterval(timerRef.current);
        setRecording(false);
        setUploading(false);
        alert(t("attachmentFailed"));
      };
      recorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        const type = recorder.mimeType || chunksRef.current[0]?.type || "audio/webm";
        const blob = new Blob(chunksRef.current, { type });
        try {
          if (!blob.size) throw new Error("Empty recording");
          const extension = type.includes("mp4") ? "m4a" : type.includes("ogg") ? "ogg" : "webm";
          const file = new File([blob], `voice-${Date.now()}.${extension}`, { type });
          const up = await base44.integrations.Core.UploadFile({ file });
          const voice = { url: up.file_url, name: file.name, type };
          if (onRecorded) await onRecorded(voice);
          else setFiles((current) => [...(current || []), voice]);
        } catch {
          alert(t("attachmentFailed"));
        } finally {
          chunksRef.current = [];
          recorderRef.current = null;
          setUploading(false);
        }
      };
      recorder.start(1000);
      recorderRef.current = recorder;
      setElapsed(0);
      const startedAt = Date.now();
      timerRef.current = setInterval(() => setElapsed(Math.floor((Date.now() - startedAt) / 1000)), 1000);
      setRecording(true);
    } catch {
      alert(t("micError"));
    }
  };

  const stop = () => {
    const recorder = recorderRef.current;
    if (!recorder || recorder.state !== "recording") return;
    clearInterval(timerRef.current);
    setRecording(false);
    setUploading(true);
    recorder.stop();
  };

  const duration = `${String(Math.floor(elapsed / 60)).padStart(2, "0")}:${String(elapsed % 60).padStart(2, "0")}`;

  return (
    <button
      type="button"
      onClick={recording ? stop : start}
      disabled={disabled || uploading}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-body border transition-colors disabled:opacity-50 ${recording ? "border-red-400 bg-red-50 text-red-700" : "border-border hover:bg-muted"}`}
    >
      {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : recording ? <Square className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
      {uploading ? t("uploading") : recording ? `${t("stopRecording")} · ${duration}` : t("recordVoice")}
    </button>
  );
}