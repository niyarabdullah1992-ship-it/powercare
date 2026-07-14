import { useEffect } from "react";
import { useI18n } from "@/lib/i18n";
import { toast } from "@/components/ui/use-toast";

const localDate = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

// Smart reminders: in-app toast ~15 minutes before a timed planner item (once per item).
export default function PlannerReminders({ data }) {
  const { t } = useI18n();

  useEffect(() => {
    const check = () => {
      const today = localDate();
      const now = new Date();
      const nowMin = now.getHours() * 60 + now.getMinutes();
      for (const item of data?.plannerItems || []) {
        if (item.date !== today || !item.time || item.done) continue;
        const [h, m] = item.time.split(":").map(Number);
        if (Number.isNaN(h) || Number.isNaN(m)) continue;
        const diff = h * 60 + m - nowMin;
        if (diff < 0 || diff > 15) continue;
        const key = `pwc_rem_${item.id}`;
        if (localStorage.getItem(key)) continue;
        localStorage.setItem(key, "1");
        toast({
          title: t("reminderTitle"),
          description: `"${item.title}" ${diff === 0 ? t("reminderStartsNow") : `${t("reminderInMin")} ${diff} ${t("minutesUnit")}`} (${item.time})`,
        });
      }
    };
    check();
    const iv = setInterval(check, 60000);
    return () => clearInterval(iv);
  }, [data?.plannerItems, t]);

  return null;
}