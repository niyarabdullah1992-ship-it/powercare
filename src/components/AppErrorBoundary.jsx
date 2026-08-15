import React from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import IdentityCard from "@/components/shared/IdentityCard";
import { MUTED, SURFACE, ui } from "@/lib/platformStyles";

export default class AppErrorBoundary extends React.Component {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error, info) {
    console.error("NiroVera interface error:", error, info);
  }

  render() {
    if (!this.state.failed) return this.props.children;
    const ar = document.documentElement.lang === "ar" || document.documentElement.dir === "rtl";
    return (
      <main style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: SURFACE, padding: 24 }} dir={ar ? "rtl" : "ltr"}>
        <div style={{ width: "100%", maxWidth: 520 }}>
          <IdentityCard
            icon={AlertTriangle}
            title={ar ? "تعذر عرض هذه الصفحة" : "This page could not be displayed"}
            subtitle={ar ? "تمت حماية بياناتك. أعد تحميل الصفحة للمتابعة." : "Your data is protected. Reload the page to continue."}
          >
            <button
              type="button"
              onClick={() => window.location.reload()}
              style={{ ...ui.btnPrimary, display: "inline-flex", alignItems: "center", gap: 8, height: 40 }}
            >
              <RefreshCw style={{ width: 14, height: 14 }} />
              {ar ? "إعادة التحميل" : "Reload"}
            </button>
            <p style={{ margin: "10px 0 0", fontSize: 11, color: MUTED }}>
              {ar ? "إن استمر العطل، اخرج ثم ادخل من جديد." : "If it continues, sign out and sign in again."}
            </p>
          </IdentityCard>
        </div>
      </main>
    );
  }
}
