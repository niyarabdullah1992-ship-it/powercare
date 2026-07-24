import React from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import GoogleIcon from "@/components/GoogleIcon";
import { AppleIcon, MicrosoftIcon } from "@/components/ProviderIcons";
export default function SocialLoginButtons() {
  return (
    <div className="space-y-3 mb-6">
      <Button
        variant="outline"
        className="w-full h-12 text-sm font-medium"
        onClick={() => base44.auth.loginWithProvider("google", "/")}
      >
        <GoogleIcon className="w-5 h-5 mr-2" />
        Continue with Google
      </Button>
      <Button
        variant="outline"
        className="w-full h-12 text-sm font-medium"
        onClick={() => base44.auth.loginWithProvider("microsoft", "/")}
      >
        <MicrosoftIcon className="w-5 h-5 mr-2" />
        Continue with Microsoft
      </Button>
      <Button
        variant="outline"
        className="w-full h-12 text-sm font-medium"
        onClick={() => base44.auth.loginWithProvider("apple", "/")}
      >
        <AppleIcon className="w-5 h-5 mr-2" />
        Continue with Apple
      </Button>
    </div>
  );
}