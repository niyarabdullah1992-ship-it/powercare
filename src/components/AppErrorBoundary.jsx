import React from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default class AppErrorBoundary extends React.Component {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error, info) {
    console.error("PowerCare interface error:", error, info);
  }

  render() {
    if (!this.state.failed) return this.props.children;
    const ar = document.documentElement.lang === "ar" || document.documentElement.dir === "rtl";
    return (
      <main className="flex min-h-screen items-center justify-center bg-background p-6">
        <section className="w-full max-w-lg rounded-3xl border border-border bg-card p-8 text-center shadow-elevated">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/10 text-destructive"><AlertTriangle className="h-7 w-7" /></span>
          <h1 className="mt-5 font-heading text-3xl font-semibold">{ar ? "تعذر عرض هذه الصفحة" : "This page could not be displayed"}</h1>
          <p className="mt-3 text-sm text-muted-foreground">{ar ? "تمت حماية بياناتك. أعد تحميل الصفحة للمتابعة." : "Your data is protected. Reload the page to continue."}</p>
          <button onClick={() => window.location.reload()} className="mx-auto mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground"><RefreshCw className="h-4 w-4" />{ar ? "إعادة التحميل" : "Reload"}</button>
        </section>
      </main>
    );
  }
}