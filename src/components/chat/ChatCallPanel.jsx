import React, { useEffect, useMemo, useRef, useState } from "react";
import { Download, Mic, PhoneOff, Square } from "lucide-react";
import useCallRecorder from "@/hooks/useCallRecorder";

function StreamVideo({ stream, muted }) { const ref = useRef(null); useEffect(() => { if (ref.current) { ref.current.srcObject = stream; ref.current.play().catch(() => {}); } }, [stream]); return <video ref={ref} autoPlay playsInline muted={muted} className="h-full w-full rounded-xl bg-black object-cover" />; }
function AudioTile({ stream, muted }) { const ref = useRef(null); useEffect(() => { if (ref.current) ref.current.srcObject = stream; }, [stream]); return <div className="flex items-center justify-center rounded-xl bg-muted"><audio ref={ref} autoPlay muted={muted} /><Mic className="h-12 w-12 text-accent" /></div>; }

export default function ChatCallPanel({ call, localStream, remoteStreams, onEnd, onRecording, ar }) {
  const allStreams = [localStream, ...remoteStreams].filter(Boolean);
  const { recording, result, error, start, stop } = useCallRecorder(allStreams);
  const [saveStatus, setSaveStatus] = useState("");
  const audioOnly = call?.mode === "audio";
  const extension = result?.type?.includes("mp4") ? "mp4" : result?.type?.startsWith("audio/") ? "webm" : "webm";
  const downloadUrl = useMemo(() => result ? URL.createObjectURL(result) : "", [result]);
  useEffect(() => () => { if (downloadUrl) URL.revokeObjectURL(downloadUrl); }, [downloadUrl]);
  useEffect(() => {
    if (!result) return;
    setSaveStatus("saving");
    Promise.resolve(onRecording(result)).then(() => setSaveStatus("saved")).catch(() => setSaveStatus("failed"));
  }, [result]);
  if (!call) return null;
  return (
    <div className="absolute inset-0 z-30 flex flex-col bg-background p-4">
      <div className={`grid flex-1 gap-3 ${allStreams.length > 1 ? "grid-cols-2" : "grid-cols-1"}`}>{allStreams.map((stream, index) => audioOnly ? <AudioTile key={index} stream={stream} muted={index === 0} /> : <StreamVideo key={index} stream={stream} muted={index === 0} />)}</div>
      <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
        <button onClick={recording ? stop : start} className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm ${recording ? "bg-red-600 text-white" : "bg-muted"}`}>{recording ? <Square className="h-4 w-4" /> : <span className="h-3 w-3 rounded-full bg-red-600" />}{recording ? (ar ? "إيقاف التسجيل" : "Stop recording") : (ar ? "تسجيل" : "Record")}</button>
        {result && <a href={downloadUrl} download={`call-recording.${extension}`} className="flex items-center gap-2 rounded-full bg-muted px-4 py-2 text-sm"><Download className="h-4 w-4" />{ar ? "تنزيل" : "Download"}</a>}
        <button onClick={onEnd} disabled={recording} className="flex items-center gap-2 rounded-full bg-destructive px-5 py-2 text-sm text-white disabled:opacity-40"><PhoneOff className="h-4 w-4" />{ar ? "إنهاء" : "End"}</button>
      </div>
      {error && <p className="mt-2 text-center text-xs text-destructive">{ar ? "تعذر بدء التسجيل في هذا المتصفح. افتح التطبيق المنشور واسمح بالميكروفون والكاميرا." : error}</p>}
      {call.mode === "video" && window.self !== window.top && <p className="mt-2 text-center text-xs text-amber-600">{ar ? "قد تُحجب الكاميرا داخل المعاينة؛ افتح التطبيق المنشور للسماح بالفيديو." : "Camera may be blocked in preview; open the published app for video."}</p>}
      <p className="mt-2 text-center text-xs text-muted-foreground">{recording ? (ar ? "التسجيل فعّال لدى جهازك" : "Recording on your device") : saveStatus === "saving" ? (ar ? "جارٍ حفظ التسجيل في المحادثة..." : "Saving recording...") : saveStatus === "saved" ? (ar ? "تم حفظ التسجيل في المحادثة" : "Recording saved in chat") : saveStatus === "failed" ? (ar ? "تعذر الحفظ في المحادثة؛ استخدم زر التنزيل" : "Chat save failed; use Download") : (ar ? "يمكن لأي مشارك تسجيل المكالمة عند رغبته" : "Any participant may record when needed")}</p>
    </div>
  );
}