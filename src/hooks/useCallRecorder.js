import { useRef, useState } from "react";

export default function useCallRecorder(streams) {
  const recorderRef = useRef(null);
  const cleanupRef = useRef(null);
  const [recording, setRecording] = useState(false);
  const [result, setResult] = useState(null);

  const start = async () => {
    const active = streams.filter(Boolean);
    if (!active.length) return;
    const canvas = document.createElement("canvas");
    canvas.width = 1280; canvas.height = 720;
    const ctx = canvas.getContext("2d");
    const videos = active.map((stream) => Object.assign(document.createElement("video"), { srcObject: stream, muted: true, autoplay: true }));
    await Promise.all(videos.map((video) => video.play().catch(() => {})));
    let frame;
    const draw = () => {
      ctx.fillStyle = "#111827"; ctx.fillRect(0, 0, canvas.width, canvas.height);
      const cols = Math.ceil(Math.sqrt(videos.length));
      const rows = Math.ceil(videos.length / cols);
      videos.forEach((video, index) => ctx.drawImage(video, (index % cols) * canvas.width / cols, Math.floor(index / cols) * canvas.height / rows, canvas.width / cols, canvas.height / rows));
      frame = requestAnimationFrame(draw);
    };
    draw();
    const output = canvas.captureStream(20);
    const audio = new AudioContext();
    const destination = audio.createMediaStreamDestination();
    active.forEach((stream) => { if (stream.getAudioTracks().length) audio.createMediaStreamSource(stream).connect(destination); });
    destination.stream.getAudioTracks().forEach((track) => output.addTrack(track));
    const chunks = [];
    const recorder = new MediaRecorder(output, { mimeType: MediaRecorder.isTypeSupported("video/webm;codecs=vp9,opus") ? "video/webm;codecs=vp9,opus" : "video/webm" });
    recorder.ondataavailable = (event) => { if (event.data.size) chunks.push(event.data); };
    recorder.onstop = () => setResult(new Blob(chunks, { type: "video/webm" }));
    recorder.start(1000);
    recorderRef.current = recorder;
    cleanupRef.current = () => { cancelAnimationFrame(frame); audio.close(); videos.forEach((video) => { video.srcObject = null; }); };
    setRecording(true); setResult(null);
  };

  const stop = () => { recorderRef.current?.stop(); cleanupRef.current?.(); setRecording(false); };
  return { recording, result, start, stop };
}