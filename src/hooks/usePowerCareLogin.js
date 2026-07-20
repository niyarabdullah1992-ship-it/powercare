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
    if (!new URLSearchParams(window.location.search).has("google_login")) return;
    setLoading(true);
    const loginKind = new URLSearchParams(window.location.search).get("type") === "individual" ? "individual" : "company";
    setKind(loginKind);
    loginWithGoogle(loginKind).then((result) => {
      if (result?.selectionRequired) setGoogleAccounts(result.accounts || []);
      else if (result?.otpRequired) {
        setEmail(result.email || "");
        setPendingId(result.pendingId);
        setAccounts([]);
        setGoogleOtpAccountKey(result.accountKey || null);
      } else if (!result) setError("No workspace is linked to this Google account");
    }).catch((error) => setError(error.message || "Google login failed"))
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
  const verify = async (code, companyId) => !!(await verifyOtp(pendingId, code, password, companyId));
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
  const google = () => base44.auth.loginWithProvider("sso", `${returnPath}?google_login=1&type=${kind}`);
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
  return { kind, setKind, email, setEmail, password, setPassword, error, loading, pendingId, accounts, googleAccounts, setGoogleAccounts, submit, verify, resend, google, chooseGoogleAccount, backFromOtp };
}