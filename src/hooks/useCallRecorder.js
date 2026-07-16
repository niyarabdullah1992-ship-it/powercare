import { useRef, useState } from "react";

const supportedMime = (video) => {
  const choices = video
    ? ["video/webm;codecs=vp9,opus", "video/webm;codecs=vp8,opus", "video/webm", "video/mp4"]
    : ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"];
  return choices.find((type) => MediaRecorder.isTypeSupported(type)) || "";
};

export default function useCallRecorder(streams) {
  const recorderRef = useRef(null);
  const cleanupRef = useRef(null);
  const [recording, setRecording] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const start = async () => {
    try {
      setError("");
      if (!window.MediaRecorder) throw new Error("Recording is not supported by this browser");
      const active = streams.filter((stream) => stream?.active);
      if (!active.length) throw new Error("No active media stream");
      const hasVideo = active.some((stream) => stream.getVideoTracks().some((track) => track.readyState === "live"));
      let output = new MediaStream();
      let frame = null;
      let videos = [];

      if (hasVideo && HTMLCanvasElement.prototype.captureStream) {
        const canvas = document.createElement("canvas");
        canvas.width = 1280; canvas.height = 720;
        const ctx = canvas.getContext("2d");
        videos = active.map((stream) => Object.assign(document.createElement("video"), { srcObject: stream, muted: true, autoplay: true, playsInline: true }));
        await Promise.all(videos.map((video) => video.play().catch(() => {})));
        const draw = () => {
          ctx.fillStyle = "#111827"; ctx.fillRect(0, 0, canvas.width, canvas.height);
          const cols = Math.ceil(Math.sqrt(videos.length));
          const rows = Math.ceil(videos.length / cols);
          videos.forEach((video, index) => {
            if (video.readyState < 2) return;
            try { ctx.drawImage(video, (index % cols) * canvas.width / cols, Math.floor(index / cols) * canvas.height / rows, canvas.width / cols, canvas.height / rows); } catch { /* wait for the next frame */ }
          });
          frame = requestAnimationFrame(draw);
        };
        draw();
        output = canvas.captureStream(20);
      } else {
        active[0].getVideoTracks().forEach((track) => output.addTrack(track));
      }

      const AudioApi = window.AudioContext || window.webkitAudioContext;
      const audio = AudioApi ? new AudioApi() : null;
      if (audio) {
        await audio.resume();
        const destination = audio.createMediaStreamDestination();
        active.forEach((stream) => {
          if (!stream.getAudioTracks().length) return;
          try { audio.createMediaStreamSource(stream).connect(destination); } catch { /* ignore ended audio tracks */ }
        });
        destination.stream.getAudioTracks().forEach((track) => output.addTrack(track));
      } else {
        active[0].getAudioTracks().forEach((track) => output.addTrack(track));
      }

      const mimeType = supportedMime(output.getVideoTracks().length > 0);
      const chunks = [];
      const recorder = new MediaRecorder(output, mimeType ? { mimeType } : undefined);
      recorder.ondataavailable = (event) => { if (event.data.size) chunks.push(event.data); };
      recorder.onerror = () => setError("Recording failed");
      recorder.onstop = () => {
        const type = recorder.mimeType || mimeType || (hasVideo ? "video/webm" : "audio/webm");
        setResult(new Blob(chunks, { type }));
        cleanupRef.current?.();
      };
      recorder.start(1000);
      recorderRef.current = recorder;
      cleanupRef.current = () => {
        if (frame) cancelAnimationFrame(frame);
        audio?.close();
        videos.forEach((video) => { video.pause(); video.srcObject = null; });
      };
      setRecording(true); setResult(null);
    } catch (recordingError) {
      cleanupRef.current?.();
      setRecording(false);
      setError(recordingError?.message || "Recording failed");
    }
  };

  const stop = () => {
    if (recorderRef.current?.state === "recording") recorderRef.current.stop();
    setRecording(false);
  };
  return { recording, result, error, start, stop };
}