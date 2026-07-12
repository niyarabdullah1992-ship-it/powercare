import React, { useState, useRef, useEffect } from "react";
import { RefreshCw } from "lucide-react";

// Simple native-style pull-to-refresh: swipe down from the top of the page
// to trigger onRefresh (async). Desktop (mouse) is unaffected.
// Android WebView note: the touchmove listener is attached natively with
// { passive: false } so preventDefault() actually works, and default overscroll
// is blocked ONLY while dragging down from the very top (window.scrollY === 0)
// — normal scrolling is never interfered with.
export default function PullToRefresh({ onRefresh, children }) {
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef(null);
  const pulling = useRef(false);
  const refreshingRef = useRef(false);
  const wrapRef = useRef(null);

  const onTouchStart = (e) => {
    // Only arm the gesture when the page is exactly at the top.
    startY.current = window.scrollY === 0 ? e.touches[0].clientY : null;
    pulling.current = false;
  };

  // Native non-passive touchmove — React's synthetic touch listeners are
  // passive, so preventDefault() would be ignored in Android WebViews.
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const onTouchMove = (e) => {
      if (startY.current == null || refreshingRef.current) return;
      // Rigorous boundary check: the moment the page is no longer at the top,
      // disarm the gesture and hand control back to native scrolling.
      if (window.scrollY !== 0) {
        startY.current = null;
        pulling.current = false;
        setPull(0);
        return;
      }
      const dy = e.touches[0].clientY - startY.current;
      if (dy > 0) {
        // Dragging down from the top — suppress the browser's default
        // overscroll/refresh behavior only for this case.
        pulling.current = true;
        if (e.cancelable) e.preventDefault();
        setPull(Math.min(dy * 0.4, 90));
      } else if (!pulling.current) {
        // Upward drag that never became a pull — cancel so scrolling is untouched.
        startY.current = null;
      }
    };
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    return () => el.removeEventListener("touchmove", onTouchMove);
  }, []);

  const onTouchEnd = async () => {
    startY.current = null;
    pulling.current = false;
    if (refreshingRef.current) return;
    if (pull >= 45) {
      refreshingRef.current = true;
      setRefreshing(true);
      setPull(48);
      try { await onRefresh?.(); } finally {
        refreshingRef.current = false;
        setRefreshing(false);
        setPull(0);
      }
    } else {
      setPull(0);
    }
  };

  return (
    <div ref={wrapRef} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
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