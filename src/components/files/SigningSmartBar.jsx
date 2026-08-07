import React from "react";
import { CheckCircle2, AlertTriangle, PenLine, Users, ShieldCheck } from "lucide-react";

// Smart status + one-tap jump bar for the File Signing page: shows whether the
// user's signature is ready, and scrolls straight to each action card.
export default function SigningSmartBar({ hasSignature, ar }) {
  const jump = (id) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });

  const actions = [
    { id: "sign-send", icon: PenLine, label: ar ? "وقّع وأرسل" : "Sign & send" },
    { id: "multi-sign", icon: Users, label: ar ? "تواقيع متعددة" : "Multi-sign" },
    { id: "verify-doc", icon: ShieldCheck, label: ar ? "تحقق من مستند" : "Verify" },
  ];

  return (
    <div className="p-4 rounded-xl border border-border bg-card flex flex-wrap items-center gap-3">
      {hasSignature ? (
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-100 border border-emerald-300 text-xs font-body text-emerald-700">
          <CheckCircle2 className="w-3.5 h-3.5" /> {ar ? "توقيعك جاهز — يمكنك التوقيع فورًا" : "Signature ready — sign instantly"}
        </span>
      ) : (
        <button
          onClick={() => jump("my-signature")}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-100 border border-amber-300 text-xs font-body text-amber-800 hover:bg-amber-200 transition"
        >
          <AlertTriangle className="w-3.5 h-3.5" /> {ar ? "ابدأ هنا: احفظ توقيعك أولًا" : "Start here: save your signature first"}
        </button>
      )}
      <span className="flex-1" />
      <div className="flex items-center gap-1.5 flex-wrap">
        {actions.map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            onClick={() => jump(id)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border text-xs font-body hover:bg-muted transition"
          >
            <Icon className="w-3.5 h-3.5 text-accent" /> {label}
          </button>
        ))}
      </div>
    </div>
  );
}