import { useEffect } from "react";
import { useI18n } from "@/lib/i18n";
import { toast } from "@/components/ui/use-toast";

// لا فشل صامت: رفض الخادم للكتابة أو امتلاء التخزين المحلي يظهر للمستخدم صريحاً.
export default function SyncFailureAlerts() {
  const { lang } = useI18n();

  useEffect(() => {
    const ar = lang === "ar";
    const onRejected = () => toast({
      variant: "destructive",
      description: ar
        ? "لم يُحفظ التغيير: صلاحيتك لا تسمح بكتابة هذه البيانات. راجع مسؤولك."
        : "Not saved: your role isn't allowed to write this data. Contact your manager.",
    });
    const onFull = () => toast({
      variant: "destructive",
      description: ar
        ? "مساحة التخزين على هذا الجهاز ممتلئة — أُفرغت بيانات قديمة. أعد المحاولة، وإن تكرر الأمر فسجّل الخروج والدخول لتحديث الكاش."
        : "This device's storage is full — old cached data was cleared. Retry; if it repeats, sign out and back in to refresh the cache.",
    });
    window.addEventListener("powercare:sync-rejected", onRejected);
    window.addEventListener("powercare:storage-full", onFull);
    return () => {
      window.removeEventListener("powercare:sync-rejected", onRejected);
      window.removeEventListener("powercare:storage-full", onFull);
    };
  }, [lang]);

  return null;
}