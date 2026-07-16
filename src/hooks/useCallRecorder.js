import { useRef, useState } from "react";

export default function useCallRecorder(onRecording) {
  const recorderRef = useRef(null);
  const chunksRef = useRef([]);
  const [recording, setRecording] = useState(false);
  const start = (streams) => {
    const tracks = streams.flatMap((stream) => stream?.getTracks?.() || []);
    if (!tracks.length || !window.MediaRecorder) return;
    const combined = new MediaStream(tracks);
    const mime = ["video/webm;codecs=vp8,opus", "video/webm", "audio/webm"].find((type) => MediaRecorder.isTypeSupported(type));
    const recorder = new MediaRecorder(combined, mime ? { mimeType: mime } : undefined);
    chunksRef.current = [];
    recorder.ondataavailable = (event) => { if (event.data.size) chunksRef.current.push(event.data); };
    recorder.onstop = () => onRecording(new Blob(chunksRef.current, { type: recorder.mimeType || "video/webm" }));
    recorder.start(1000); recorderRef.current = recorder; setRecording(true);
  };
  const stop = () => { if (recorderRef.current?.state === "recording") recorderRef.current.stop(); setRecording(false); };
  return { recording, start, stop };
}