import React, { useState, useRef } from "react";
import { RefreshCw } from "lucide-react";

// Simple native-style pull-to-refresh: swipe down from the top of the page
// to trigger onRefresh (async). Desktop (mouse) is unaffected.
export default function PullToRefresh({ onRefresh, children }) {
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef(null);

  const onTouchStart = (e) => {
    startY.current = window.scrollY <= 0 ? e.touches[0].clientY : null;
  };

  const onTouchMove = (e) => {
    if (startY.current == null || refreshing) return;
    const dy = e.touches[0].clientY - startY.current;
    if (dy > 0 && window.scrollY <= 0) setPull(Math.min(dy * 0.4, 90));
  };

  const onTouchEnd = async () => {
    startY.current = null;
    if (refreshing) return;
    if (pull >= 45) {
      setRefreshing(true);
      setPull(48);
      try { await onRefresh?.(); } finally { setRefreshing(false); setPull(0); }
    } else {
      setPull(0);
    }
  };

  return (
    <div onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}>
      <div
        style={{ height: pull }}
        className={`flex items-end justify-center overflow-hidden ${pull === 0 ? "transition-[height] duration-200" : ""}`}
      >
        <RefreshCw
          className={`w-5 h-5 text-accent mb-3 ${refreshing ? "animate-spin" : ""}`}
          style={refreshing ? undefined : { transform: `rotate(${pull * 3}deg)`, opacity: Math.min(pull / 45, 1) }}
        />
      </div>
      {children}
    </div>
  );
}