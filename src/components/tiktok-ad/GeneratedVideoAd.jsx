import React, { useEffect, useRef, useState } from "react";
import { Play, RotateCcw } from "lucide-react";

export default function GeneratedVideoAd({ urls }) {
  const videoRef = useRef(null);
  const [index, setIndex] = useState(0);
  const [started, setStarted] = useState(false);
  const [ended, setEnded] = useState(false);

  useEffect(() => {
    if (started) videoRef.current?.play();
  }, [index, started]);

  const start = () => { setStarted(true); setEnded(false); videoRef.current?.play(); };
  const replay = () => { setIndex(0); setEnded(false); setStarted(true); };
  const next = () => index < urls.length - 1 ? setIndex((value) => value + 1) : setEnded(true);

  return <>
    <video ref={videoRef} key={urls[index]} src={urls[index]} playsInline preload="auto" onEnded={next} className="absolute inset-0 h-full w-full object-cover" />
    <div className="ad-progress">{urls.map((_, item) => <i key={item} className={item <= index ? "is-active" : ""} />)}</div>
    {!started && <button onClick={start} className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 bg-landing-cinema/55 font-semibold text-landing-bg backdrop-blur-sm"><span className="flex h-16 w-16 items-center justify-center rounded-full border border-landing-gold bg-landing-cinema/70"><Play className="h-7 w-7 fill-current" /></span>تشغيل الإعلان</button>}
    {ended && <div className="absolute inset-0 z-20 flex items-center justify-center bg-landing-cinema/55 backdrop-blur-sm"><button className="ad-replay" onClick={replay}><RotateCcw /> إعادة التشغيل</button></div>}
  </>;
}