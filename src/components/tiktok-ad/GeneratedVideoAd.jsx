import React, { useRef, useState } from "react";
import { RotateCcw } from "lucide-react";
import VideoTechHud from "@/components/tiktok-ad/VideoTechHud";
import { Image } from "@/components/ui/image";

export default function GeneratedVideoAd({ urls, audioUrl, logoUrl, posterUrl }) {
  const videos = useRef([]);
  const audio = useRef(null);
  const advancing = useRef(false);
  const [index, setIndex] = useState(0);
  const [started, setStarted] = useState(false);
  const [ended, setEnded] = useState(false);

  const advance = (current) => {
    if (advancing.current || current !== index) return;
    if (current === urls.length - 1) { audio.current?.pause(); setEnded(true); return; }
    advancing.current = true;
    videos.current[current + 1].currentTime = 0;
    videos.current[current + 1].play();
    setIndex(current + 1);
    window.setTimeout(() => { videos.current[current]?.pause(); advancing.current = false; }, 500);
  };
  const start = () => { setStarted(true); setEnded(false); videos.current[0]?.play(); audio.current?.play(); };
  const replay = () => {
    videos.current.forEach((video) => { video.pause(); video.currentTime = 0; });
    audio.current.currentTime = 0; setIndex(0); setEnded(false); setStarted(true);
    videos.current[0].play(); audio.current.play();
  };

  return <>
    {urls.map((url, item) => <video key={url} ref={(node) => { videos.current[item] = node; }} src={url} muted playsInline preload="auto" onTimeUpdate={(event) => { if (event.currentTarget.duration - event.currentTarget.currentTime < .55) advance(item); }} onEnded={() => advance(item)} className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ${item === index ? "opacity-100" : "opacity-0"}`} />)}
    <audio ref={audio} src={audioUrl} preload="auto" />
    {started && !ended && <VideoTechHud index={index} logoUrl={logoUrl} />}
    {started && !ended && <div className="ad-progress">{urls.map((_, item) => <i key={item} className={item <= index ? "is-active" : ""} />)}</div>}
    {!started && <div className="ad-story-poster"><Image src={posterUrl} alt="قصص موظفي PowerCare في مواقع الطاقة والتقنية" className="h-full w-full" fittingType="fill" /><button onClick={start} className="ad-story-start" aria-label="تشغيل الإعلان" /></div>}
    {ended && <div className="absolute inset-0 z-20 flex items-center justify-center bg-landing-cinema/55 backdrop-blur-sm"><button className="ad-replay" onClick={replay}><RotateCcw /> إعادة التشغيل</button></div>}
  </>;
}