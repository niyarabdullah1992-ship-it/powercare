import { useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";

// Ties a modal/overlay's open state to the browser history stack so the
// physical back button (Android webview hardware key or browser back) closes
// the overlay instead of leaving the page — anywhere in the app, including
// pages outside /app. Normal web browsing is untouched: only one lightweight
// "#overlay" hash entry is pushed while the overlay is open, and it is popped
// again whether the overlay is dismissed by back or by its own close button.
//
// Usage inside any modal component:
//   useModalHistory(isOpen, () => setIsOpen(false));
export default function useModalHistory(open, onClose) {
  const location = useLocation();
  const navigate = useNavigate();
  const pushed = useRef(false);

  // Open/close transitions: push the marker on open, pop it on programmatic close.
  useEffect(() => {
    if (open && !pushed.current) {
      pushed.current = true;
      navigate(location.pathname + location.search + "#overlay");
    } else if (!open && pushed.current) {
      pushed.current = false;
      // Closed via the overlay's own UI while the marker is still on the
      // stack — pop it so the history stays consistent for the next back press.
      if (window.location.hash === "#overlay") navigate(-1);
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  // Physical/browser back popped the marker while the overlay was open → close it.
  useEffect(() => {
    if (open && pushed.current && location.hash !== "#overlay") {
      pushed.current = false;
      onClose?.();
    }
  }, [location.hash]); // eslint-disable-line react-hooks/exhaustive-deps
}