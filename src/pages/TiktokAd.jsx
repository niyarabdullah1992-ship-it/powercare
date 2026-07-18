import React, { useEffect, useState } from "react";
import { RotateCcw } from "lucide-react";
import AdScene from "@/components/tiktok-ad/AdScene";
import { useAmbientScore } from "@/components/tiktok-ad/useAmbientScore";
import "@/components/tiktok-ad/tiktok-ad.css";

const DURATIONS = [8000, 9000, 8000, 8000, 9000, 9000, 9000];

export default function TiktokAd() {
  const [scene, setScene] = useState(0);
  const [run, setRun] = useState(0);
  const { restartScore } = useAmbientScore(run);

  useEffect(() => {
    if (scene >= DURATIONS.length - 1) return;
    const timer = setTimeout(() => setScene((value) => value + 1), DURATIONS[scene]);
    return () => clearTimeout(timer);
  }, [scene, run]);

  const replay = () => {
    setScene(0);
    setRun((value) => value + 1);
    restartScore();
  };

  return (
    <main className="ad-page" dir="rtl">
      <section className="ad-phone" aria-label="إعلان PowerCare السينمائي">
        <div className="ad-grain" />
        <AdScene key={`${run}-${scene}`} scene={scene} />
        <div className="ad-progress">
          {DURATIONS.map((_, index) => <i key={index} className={index <= scene ? "is-active" : ""} />)}
        </div>
        <button className="ad-replay" onClick={replay}><RotateCcw /> إعادة التشغيل</button>
      </section>
    </main>
  );
}