import React from "react";
import { Loader2, Mail } from "lucide-react";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

export default function SignupOtpStep({ email, code, setCode, loading, error, onVerify, onResend, ar }) {
  return <form onSubmit={onVerify} className="space-y-5">
    <div className="text-center">
      <Mail className="mx-auto mb-3 h-7 w-7 text-[#1E9E63]" />
      <h4 className="text-xl font-semibold text-[#14284B]">{ar ? "تحقق من بريدك" : "Verify your email"}</h4>
      <p className="mt-1 text-xs text-[#5A6B85]">{ar ? `أرسلنا رمزًا من 6 أرقام إلى ${email}` : `We sent a 6-digit code to ${email}`}</p>
    </div>
    {error && <p className="text-center text-xs text-red-500">{error}</p>}
    <div className="flex justify-center" dir="ltr"><InputOTP maxLength={6} value={code} onChange={setCode} autoFocus autoComplete="one-time-code"><InputOTPGroup>{[0, 1, 2, 3, 4, 5].map((index) => <InputOTPSlot key={index} index={index} />)}</InputOTPGroup></InputOTP></div>
    <button type="submit" disabled={loading || code.length !== 6} className="flex w-full items-center justify-center gap-2 rounded-[9px] bg-[#1E9E63] py-2.5 text-sm font-semibold text-white disabled:opacity-50">{loading && <Loader2 className="h-4 w-4 animate-spin" />}{ar ? "تحقق وأنشئ الشركة" : "Verify and create company"}</button>
    <button type="button" onClick={onResend} disabled={loading} className="w-full text-center text-xs font-semibold text-[#14284B] disabled:opacity-50">{ar ? "إعادة إرسال الرمز" : "Resend code"}</button>
  </form>;
}