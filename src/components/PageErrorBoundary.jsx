import React from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import IdentityCard from "@/components/shared/IdentityCard";
import { MUTED, ui } from "@/lib/platformStyles";

export default class PageErrorBoundary extends React.Component {
  state = { failed: false, message: "" };

  static getDerivedStateFromError(error) {
    return { failed: true, message: String(error?.message || error || "") };
  }

  componentDidCatch(error, info) {
    console.error("NiroVera page error:", error, info);
  }

  componentDidUpdate(prevProps) {
    if (prevProps.resetKey !== this.props.resetKey && this.state.failed) {
      this.setState({ failed: false, message: "" });
    }
  }

  render() {
    if (!this.state.failed) return this.props.children;
    const ar = document.documentElement.lang === "ar" || document.documentElement.dir === "rtl";
    return (
      <div style={{ maxWidth: 520, margin: "24px auto", width: "100%" }} dir={ar ? "rtl" : "ltr"}>
        <IdentityCard
          icon={AlertTriangle}
          title={ar ? "تعذر عرض هذا القسم" : "This section could not be displayed"}
          subtitle={ar
            ? "القائمة ما زالت تعمل. أعد المحاولة أو انتقل لقسم آخر."
            : "The menu still works. Retry or open another section."}
        >
          <button
            type="button"
            onClick={() => this.setState({ failed: false, message: "" })}
            style={{
              ...ui.btnPrimary,
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              height: 40,
            }}
          >
            <RefreshCw style={{ width: 14, height: 14, color: "#fff" }} />
            {ar ? "إعادة المحاولة" : "Try again"}
          </button>
          {this.state.message ? (
            <p style={{ margin: "10px 0 0", fontSize: 11, color: MUTED, direction: "ltr", textAlign: "left", wordBreak: "break-word" }}>
              {this.state.message}
            </p>
          ) : (
            <p style={{ margin: "10px 0 0", fontSize: 11, color: MUTED }}>
              {ar ? "إن استمر العطل، افتح قسمًا آخر من القائمة ثم عد إلى هنا." : "If it continues, open another section from the menu, then return here."}
            </p>
          )}
        </IdentityCard>
      </div>
    );
  }
}
