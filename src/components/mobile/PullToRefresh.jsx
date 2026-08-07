import React, { useState, useRef, useEffect } from "react";
import { RefreshCw } from "lucide-react";

// Simple native-style pull-to-refresh: swipe down from the top of the page
// to trigger onRefresh (async). Desktop (mouse) is unaffected.
// Android WebView note: all touch handlers are attached natively in one place —
// touchstart/touchend/touchcancel as passive (they never call preventDefault),
// and touchmove as { passive: false } so preventDefault() actually suppresses
// the native overscroll/refresh, but ONLY while dragging down from the very
// top (window.scrollY === 0). Standard container scrolling is never blocked.
export default function PullToRefresh({ onRefresh, children }) {
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef(null);
  const pulling = useRef(false);
  const pullRef = useRef(0);
  const refreshingRef = useRef(false);
  const wrapRef = useRef(null);
  const onRefreshRef = useRef(onRefresh);
  onRefreshRef.current = onRefresh;

  const setPullBoth = (v) => {
    pullRef.current = v;
    setPull(v);
  };

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;

    const reset = () => {
      startY.current = null;
      pulling.current = false;
      setPullBoth(0);
    };

    const onTouchStart = (e) => {
      // Only arm the gesture when the page is exactly at the top.
      startY.current = window.scrollY === 0 ? e.touches[0].clientY : null;
      pulling.current = false;
    };

    const onTouchMove = (e) => {
      if (startY.current == null || refreshingRef.current) return;
      // Rigorous boundary check: the moment the page is no longer at the top,
      // disarm the gesture and hand control back to native scrolling.
      if (window.scrollY !== 0) {
        reset();
        return;
      }
      const dy = e.touches[0].clientY - startY.current;
      if (dy > 0) {
        // Dragging down from the top — suppress the browser's default
        // overscroll/refresh behavior only for this case.
        pulling.current = true;
        if (e.cancelable) e.preventDefault();
        setPullBoth(Math.min(dy * 0.4, 90));
      } else if (!pulling.current) {
        // Upward drag that never became a pull — cancel so scrolling is untouched.
        startY.current = null;
      }
    };

    const onTouchEnd = async () => {
      const finalPull = pullRef.current;
      startY.current = null;
      pulling.current = false;
      if (refreshingRef.current) return;
      if (finalPull >= 45) {
        refreshingRef.current = true;
        setRefreshing(true);
        setPullBoth(48);
        try { await onRefreshRef.current?.(); } finally {
          refreshingRef.current = false;
          setRefreshing(false);
          setPullBoth(0);
        }
      } else {
        setPullBoth(0);
      }
    };

    // Android WebViews fire touchcancel mid-gesture (e.g. when the system takes
    // over the touch) — without this the indicator could stay stuck half-open.
    const onTouchCancel = () => {
      if (!refreshingRef.current) reset();
    };

    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    el.addEventListener("touchend", onTouchEnd, { passive: true });
    el.addEventListener("touchcancel", onTouchCancel, { passive: true });
    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);
      el.removeEventListener("touchcancel", onTouchCancel);
    };
  }, []);

  return (
    <div ref={wrapRef}>
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