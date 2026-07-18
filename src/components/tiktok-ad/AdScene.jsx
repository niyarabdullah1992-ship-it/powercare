import React from "react";
import IntroScene from "@/components/tiktok-ad/IntroScene";
import OfficeScene from "@/components/tiktok-ad/OfficeScene";
import FieldScene from "@/components/tiktok-ad/FieldScene";
import PayrollScene from "@/components/tiktok-ad/PayrollScene";
import SignScene from "@/components/tiktok-ad/SignScene";
import StatsScene from "@/components/tiktok-ad/StatsScene";
import FinaleScene from "@/components/tiktok-ad/FinaleScene";

const SCENES = [IntroScene, OfficeScene, FieldScene, PayrollScene, SignScene, StatsScene, FinaleScene];

export default function AdScene({ scene }) {
  const Scene = SCENES[scene] || FinaleScene;
  return <div className="ad-scene"><Scene /></div>;
}