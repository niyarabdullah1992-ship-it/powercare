import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/PowerCareAuth";

export default function usePowerCareLogin(returnPath = "/login") {
  const { login, loginWithGoogle, verifyOtp, session } = useAuth();
  const navigate = useNavigate();
  const [kind, setKind] = useState(() => new URLSearchParams(window.location.search).get("type") === "individual" ? "individual" : "company");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [pendingId, setPendingId] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [googleAccounts, setGoogleAccounts] = useState([]);
  const [googleOtpAccountKey, setGoogleOtpAccountKey] = useState(null);

  useEffect(() => { if (session) navigate("/app", { replace: true }); }, [session, navigate]);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const provider = params.has("microsoft_login") ? "Microsoft" : params.has("google_login") ? "Google" : null;
    if (!provider) return;
    params.delete("google_login");
    params.delete("microsoft_login");
    const cleanSearch = params.toString();
    window.history.replaceState({}, "", `${window.location.pathname}${cleanSearch ? `?${cleanSearch}` : ""}${window.location.hash}`);
    setLoading(true);
    const loginKind = params.get("type") === "individual" ? "individual" : "company";
    setKind(loginKind);
    loginWithGoogle(loginKind).then((result) => {
      if (result?.selectionRequired) setGoogleAccounts(result.accounts || []);
      else if (result?.otpRequired) {
        setEmail(result.email || "");
        setPendingId(result.pendingId);
        setAccounts([]);
        setGoogleOtpAccountKey(result.accountKey || null);
      } else if (!result) setError(`No workspace is linked to this ${provider} account`);
    }).catch((error) => setError(error.message || `${provider} login failed`))
      .finally(() => setLoading(false));
  }, []);

  const submit = async (event) => {
    event.preventDefault();
    setError(""); setLoading(true);
    try {
      const result = await login(email, password, kind);
      if (!result) setError("Invalid email or password");
      else if (result.wrongKind) setError("This account does not belong to the selected login section");
      else if (result.otpRequired) { setPendingId(result.pendingId); setAccounts(result.accounts || []); }
    } catch (error) {
      setError(error.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };
  const verify = async (code, companyId) => !!(await verifyOtp(pendingId, code, companyId));
  const resend = async () => {
    try {
      const result = googleOtpAccountKey
        ? await loginWithGoogle(kind, googleOtpAccountKey)
        : await login(email, password, kind);
      if (!result?.otpRequired) return false;
      setPendingId(result.pendingId); setAccounts(result.accounts || []); return true;
    } catch (error) {
      setError(error.message || "Could not resend the code"); return false;
    }
  };
  const google = () => base44.auth.loginWithProvider("google", `${returnPath}?google_login=1&type=${kind}`);
  const microsoft = () => base44.auth.loginWithProvider("microsoft", `${returnPath}?microsoft_login=1&type=${kind}`);
  const chooseGoogleAccount = async (accountKey) => {
    setError(""); setLoading(true);
    const result = await loginWithGoogle(kind, accountKey);
    if (result?.otpRequired) {
      setEmail(result.email || "");
      setPendingId(result.pendingId);
      setAccounts([]);
      setGoogleAccounts([]);
      setGoogleOtpAccountKey(result.accountKey || accountKey);
    } else if (!result) setError("Could not open this workspace");
    setLoading(false);
  };
  const backFromOtp = () => { setPendingId(null); setGoogleOtpAccountKey(null); };
  return { kind, setKind, email, setEmail, password, setPassword, error, loading, pendingId, accounts, googleAccounts, setGoogleAccounts, submit, verify, resend, google, microsoft, chooseGoogleAccount, backFromOtp };
}