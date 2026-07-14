import { useEffect } from "react";
import { toast } from "@/components/ui/use-toast";

const localDate = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

// Smart reminders: in-app toast ~15 minutes before a timed planner item (once per item).
export default function PlannerReminders({ data, ar }) {
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
          title: ar ? "⏰ تذكير من جدولك" : "⏰ Planner reminder",
          description: ar
            ? (diff === 0 ? `حان وقت "${item.title}" الآن (${item.time})` : `"${item.title}" بعد ${diff} دقيقة (${item.time})`)
            : (diff === 0 ? `"${item.title}" starts now (${item.time})` : `"${item.title}" in ${diff} min (${item.time})`),
        });
      }
    };
    check();
    const iv = setInterval(check, 60000);
    return () => clearInterval(iv);
  }, [data?.plannerItems, ar]);

  return null;
}