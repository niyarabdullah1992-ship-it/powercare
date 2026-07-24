import { useEffect } from "react";
import { useMap } from "react-leaflet";

export default function MapResizeHandler() {
  const map = useMap();

  useEffect(() => {
    const container = map.getContainer();
    const refresh = () => requestAnimationFrame(() => map.invalidateSize({ pan: false }));
    const observer = new ResizeObserver(refresh);
    observer.observe(container);
    refresh();
    window.addEventListener("resize", refresh);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", refresh);
    };
  }, [map]);

  return null;
}