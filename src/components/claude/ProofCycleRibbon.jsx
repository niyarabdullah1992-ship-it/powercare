import React from "react";
import { Link } from "react-router-dom";
import { BadgeCheck, ClipboardCheck, Fingerprint, PenLine } from "lucide-react";

const STEPS = [
  {
    icon: Fingerprint,
    arTitle: "حضور موثّق",
    enTitle: "Verified attendance",
    arText: "الشخص والموقع والوقت في سجل واحد",
    enText: "Person, place and time in one record",
    to: "/app/attendance",
  },
  {
    icon: ClipboardCheck,
    arTitle: "مهمة وإثبات",
    enTitle: "Task + proof",
    arText: "وزن جهد وإقرار وإرفاق ميداني",
    enText: "Effort weight, attestation and field proof",
    to: "/app/tasks",
  },
  {
    icon: PenLine,
    arTitle: "اعتماد وتوقيع",
    enTitle: "Approve & sign",
    arText: "مسار متسلسل مع سبب مكتوب عند الرفض",
    enText: "Sequential path with written rejection reasons",
    to: "/app/signing",
  },
  {
    icon: BadgeCheck,
    arTitle: "ختم للعميل",
    enTitle: "Client seal",
    arText: "إثبات عمل قابل للتحقق العام",
    enText: "Client-ready proof anyone can verify",
    to: "/app/client-proof",
  },
];

/**
 * NiroVera Proof Cycle — Claude calm strip: one idea, four linked steps.
 */
export default function ProofCycleRibbon({ lang = "ar" }) {
  const ar = lang === "ar";

  return (
    <section
      aria-label={ar ? "دورة الإثبات" : "Proof cycle"}
      className="overflow-hidden rounded-[10px] border border-[#E4E7EC] bg-white shadow-sm"
    >
      <div className="border-b border-border bg-secondary/40 px-5 py-4 md:px-6">
        <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-accent">
          THE NIROVERA CYCLE
        </p>
        <h2 className="mt-1 font-heading text-2xl font-semibold tracking-[-0.02em]">
          {ar ? "دورة الإثبات — من الحضور إلى ختم العميل" : "Proof cycle — from attendance to client seal"}
        </h2>
        <p className="mt-1.5 max-w-2xl text-sm leading-7 text-muted-foreground">
          {ar
            ? "كل قسم داخلي يغذي الحلقة التالية. لا تسجيل بلا إثبات، ولا إثبات بلا اعتماد، ولا ختم بلا سلسلة كاملة."
            : "Every internal section feeds the next link. No logging without proof, no proof without approval, no seal without the full chain."}
        </p>
      </div>
      <div className="grid gap-0 sm:grid-cols-2 xl:grid-cols-4">
        {STEPS.map((step, index) => {
          const Icon = step.icon;
          return (
            <Link
              key={step.to}
              to={step.to}
              className="group relative border-border p-5 transition-colors hover:bg-secondary/50 sm:odd:border-e xl:border-e xl:last:border-e-0"
            >
              <div className="mb-4 flex items-center justify-between gap-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-background text-accent transition-colors group-hover:border-accent group-hover:bg-accent group-hover:text-accent-foreground">
                  <Icon className="h-4 w-4" strokeWidth={1.6} />
                </span>
                <span className="font-mono text-[10px] tracking-[0.16em] text-muted-foreground">
                  {String(index + 1).padStart(2, "0")}
                </span>
              </div>
              <h3 className="font-heading text-lg font-semibold text-foreground">
                {ar ? step.arTitle : step.enTitle}
              </h3>
              <p className="mt-1.5 text-sm leading-6 text-muted-foreground">
                {ar ? step.arText : step.enText}
              </p>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
