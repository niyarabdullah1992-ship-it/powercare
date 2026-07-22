import React from "react";
import { Link } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import usePowerCareLogin from "@/hooks/usePowerCareLogin";
import GoogleIcon from "@/components/GoogleIcon";
import OtpStep from "@/components/landing/OtpStep";
import LoginTypeSelector from "@/components/landing/LoginTypeSelector";
import GoogleAccountPicker from "@/components/landing/GoogleAccountPicker";

export default function PowerCareLoginPanel({ showTypeSelector = false, returnPath = "/login" }) {
  const { t, lang } = useI18n();
  const flow = usePowerCareLogin(returnPath);
  if (flow.googleAccounts.length) return <GoogleAccountPicker accounts={flow.googleAccounts} onSelect={flow.chooseGoogleAccount} onBack={() => flow.setGoogleAccounts([])} loading={flow.loading} lang={lang} />;
  if (flow.pendingId) return <OtpStep email={flow.email} accounts={flow.accounts} onVerify={flow.verify} onResend={flow.resend} onBack={flow.backFromOtp} />;
  return <div className="space-y-2">
    {showTypeSelector && <LoginTypeSelector value={flow.kind} onChange={flow.setKind} lang={lang} />}
    <button type="button" onClick={flow.google} disabled={flow.loading} className="flex w-full items-center justify-center gap-2 rounded-md border border-border py-2 text-xs font-semibold hover:bg-muted disabled:opacity-50"><GoogleIcon className="h-5 w-5" />{t("continueWithGoogle")}</button>
    <div className="flex items-center gap-3 text-xs text-muted-foreground"><span className="h-px flex-1 bg-border" />{t("orDivider")}<span className="h-px flex-1 bg-border" /></div>
    <form onSubmit={flow.submit} className="space-y-2">
      <label className="block text-xs text-muted-foreground">{t("email")}<input type="email" required autoComplete="email" value={flow.email} onChange={(e) => flow.setEmail(e.target.value)} className="mt-1 w-full rounded-md border border-input bg-background px-3.5 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring" /></label>
      <label className="block text-xs text-muted-foreground">{t("password")}<input type="password" required autoComplete="current-password" value={flow.password} onChange={(e) => flow.setPassword(e.target.value)} className="mt-1 w-full rounded-md border border-input bg-background px-3.5 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring" /></label>
      {flow.error && <p className="text-sm text-destructive">{flow.error}</p>}
      <button disabled={flow.loading} className="flex w-full items-center justify-center gap-2 rounded-md bg-primary py-2 text-xs font-semibold text-primary-foreground disabled:opacity-60">{flow.loading && <Loader2 className="h-4 w-4 animate-spin" />}{flow.loading ? t("pleaseWaitBtn") : t("login")}</button>
    </form>
    <Link to={`/forgot-password?type=${flow.kind}`} className="block text-center text-sm font-semibold text-accent hover:underline">{t("forgotPasswordLink")}</Link>
  </div>;
}