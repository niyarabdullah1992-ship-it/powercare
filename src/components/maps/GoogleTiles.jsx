import React, { useState } from "react";
import { TileLayer } from "react-leaflet";
import { Layers } from "lucide-react";

// Google Maps tile layer for Leaflet, with a map/satellite toggle button.
export default function GoogleTiles() {
  const [satellite, setSatellite] = useState(false);
  return (
    <>
      <TileLayer
        key={satellite ? "sat" : "map"}
        attribution="&copy; Google Maps"
        url={`https://{s}.google.com/vt/lyrs=${satellite ? "y" : "m"}&x={x}&y={y}&z={z}`}
        subdomains={["mt0", "mt1", "mt2", "mt3"]}
        maxZoom={20}
      />
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); setSatellite((s) => !s); }}
        className="absolute bottom-3 start-3 z-[1000] flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-white/90 border border-border shadow text-[11px] font-body text-foreground hover:bg-white"
      >
        <Layers className="w-3.5 h-3.5" /> {satellite ? "Map" : "Satellite"}
      </button>
    </>
  );
}