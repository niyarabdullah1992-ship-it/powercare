import React, { useEffect, useRef, useState } from "react";
import { useMap } from "react-leaflet";
import { Expand, Shrink } from "lucide-react";

export default function FullscreenMapControl() {
  const map = useMap();
  const [active, setActive] = useState(false);
  const fallbackStyles = useRef(null);

  const leaveFallback = () => {
    const container = map.getContainer();
    if (!fallbackStyles.current) return;
    Object.assign(container.style, fallbackStyles.current);
    fallbackStyles.current = null;
    document.body.style.overflow = "";
    setActive(false);
    setTimeout(() => map.invalidateSize(), 100);
  };

  useEffect(() => {
    const onFullscreenChange = () => {
      setActive(document.fullscreenElement === map.getContainer());
      setTimeout(() => map.invalidateSize(), 100);
    };
    const onKeyDown = (event) => { if (event.key === "Escape") leaveFallback(); };
    document.addEventListener("fullscreenchange", onFullscreenChange);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("fullscreenchange", onFullscreenChange);
      document.removeEventListener("keydown", onKeyDown);
      leaveFallback();
    };
  }, [map]);

  const toggle = async (event) => {
    event.stopPropagation();
    const container = map.getContainer();
    if (document.fullscreenElement) {
      await document.exitFullscreen();
      return;
    }
    if (fallbackStyles.current) {
      leaveFallback();
      return;
    }
    if (container.requestFullscreen) {
      await container.requestFullscreen();
      return;
    }
    fallbackStyles.current = {
      position: container.style.position,
      inset: container.style.inset,
      zIndex: container.style.zIndex,
      height: container.style.height,
      width: container.style.width,
    };
    Object.assign(container.style, { position: "fixed", inset: "0", zIndex: "9999", height: "100vh", width: "100vw" });
    document.body.style.overflow = "hidden";
    setActive(true);
    setTimeout(() => map.invalidateSize(), 100);
  };

  const ar = document.documentElement.dir === "rtl";
  return (
    <button
      type="button"
      onClick={toggle}
      className="absolute top-3 end-3 z-[1000] grid h-9 w-9 place-items-center rounded-md border border-border bg-card/95 text-foreground shadow hover:bg-card"
      aria-label={active ? (ar ? "تصغير الخريطة" : "Exit full screen") : (ar ? "تكبير الخريطة" : "View full screen")}
      title={active ? (ar ? "تصغير الخريطة" : "Exit full screen") : (ar ? "تكبير الخريطة" : "View full screen")}
    >
      {active ? <Shrink className="h-4 w-4" /> : <Expand className="h-4 w-4" />}
    </button>
  );
}