import React from "react";
import { Circle, PhoneOff, Square } from "lucide-react";
import CallMediaTile from "@/components/chat/CallMediaTile";
import useCallRecorder from "@/hooks/useCallRecorder";

export default function ChatCallPanel({ call, localStream, remoteStreams, onEnd, onRecording, ar }) {
  const recorder = useCallRecorder(onRecording);
  if (!call) return null;
  const video = call.mode === "video";
  return <div className="absolute inset-0 z-20 flex flex-col bg-card p-4">
    <div className={`grid flex-1 gap-3 overflow-auto ${remoteStreams.length ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1"}`}>
      <CallMediaTile stream={localStream} video={video} muted />
      {remoteStreams.map((stream) => <CallMediaTile key={stream.id} stream={stream} video={video} />)}
    </div>
    <div className="mt-4 flex items-center justify-center gap-3">
      {!recorder.recording ? <button onClick={() => recorder.start([localStream, ...remoteStreams])} className="flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm"><Circle className="h-4 w-4 text-destructive" />{ar ? "تسجيل" : "Record"}</button> : <button onClick={recorder.stop} className="flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm"><Square className="h-4 w-4" />{ar ? "إيقاف" : "Stop"}</button>}
      <button onClick={() => { recorder.stop(); onEnd(); }} className="rounded-full bg-destructive p-3 text-destructive-foreground"><PhoneOff className="h-5 w-5" /></button>
    </div>
  </div>;
}