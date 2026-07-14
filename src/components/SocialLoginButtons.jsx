import React from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import GoogleIcon from "@/components/GoogleIcon";

// Google sign-in goes through the app's configured SSO provider (Google Workspace).
// Direct social providers (google/microsoft/facebook) are disabled when a custom
// SSO is configured, so only the working SSO-backed button is shown.
export default function SocialLoginButtons() {
  return (
    <div className="space-y-3 mb-6">
      <Button
        variant="outline"
        className="w-full h-12 text-sm font-medium"
        onClick={() => base44.auth.loginWithProvider("sso", "/")}
      >
        <GoogleIcon className="w-5 h-5 mr-2" />
        Continue with Google
      </Button>
    </div>
  );
}