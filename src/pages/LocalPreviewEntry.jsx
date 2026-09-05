import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { enterLocalPreview } from "@/lib/localPreview";

/**
 * Hard entry point for local internal-pages preview.
 * Always seeds session then does a full navigation to /app.
 */
export default function LocalPreviewEntry() {
  const [error, setError] = useState("");

  useEffect(() => {
    try {
      enterLocalPreview();
      // Full reload guarantees PowerCareAuth reads the new session.
      window.location.replace("/app");
    } catch (err) {
      console.error(err);
      setError(err?.message || "preview_failed");
    }
  }, []);

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-background p-6 text-center">
        <p className="font-heading text-xl">تعذّر فتح المعاينة</p>
        <p className="text-sm text-muted-foreground">{error}</p>
        <a href="/" className="rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground">
          العودة للرئيسية
        </a>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-background">
      <Loader2 className="h-7 w-7 animate-spin text-accent" />
      <p className="text-sm text-muted-foreground">جارٍ فتح الأقسام الداخلية…</p>
    </div>
  );
}
