import React from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import GoogleIcon from "@/components/GoogleIcon";

function MicrosoftIcon({ className = "w-5 h-5" }) {
  return (
    <svg className={className} viewBox="0 0 21 21">
      <rect x="1" y="1" width="9" height="9" fill="#F25022" />
      <rect x="11" y="1" width="9" height="9" fill="#7FBA00" />
      <rect x="1" y="11" width="9" height="9" fill="#00A4EF" />
      <rect x="11" y="11" width="9" height="9" fill="#FFB900" />
    </svg>
  );
}

function FacebookIcon({ className = "w-5 h-5" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="#1877F2">
      <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047v-2.66c0-3.026 1.792-4.697 4.533-4.697 1.313 0 2.686.236 2.686.236v2.971H15.83c-1.491 0-1.956.931-1.956 1.886v2.264h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z" />
    </svg>
  );
}

// Social sign-in buttons — each provider must also be enabled in
// Dashboard → Settings → Authentication for the login to succeed.
export default function SocialLoginButtons() {
  const login = (provider) => base44.auth.loginWithProvider(provider, "/");

  return (
    <div className="space-y-3 mb-6">
      {/* Google sign-in goes through the app's configured SSO provider (Google Workspace) */}
      <Button variant="outline" className="w-full h-12 text-sm font-medium" onClick={() => login("sso")}>
        <GoogleIcon className="w-5 h-5 mr-2" />
        Continue with Google
      </Button>
      <Button variant="outline" className="w-full h-12 text-sm font-medium" onClick={() => login("microsoft")}>
        <MicrosoftIcon className="w-5 h-5 mr-2" />
        Continue with Microsoft
      </Button>
      <Button variant="outline" className="w-full h-12 text-sm font-medium" onClick={() => login("facebook")}>
        <FacebookIcon className="w-5 h-5 mr-2" />
        Continue with Facebook
      </Button>
    </div>
  );
}