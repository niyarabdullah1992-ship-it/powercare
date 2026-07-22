import React from "react";
import { Image } from "@/components/ui/image";
import { POWERCARE_LOGO_URL } from "@/lib/brand";

export default function Logo({ size = 36, className = "" }) {
  return (
    <Image
      src={POWERCARE_LOGO_URL}
      alt="PowerCare"
      originWidth={1024}
      originHeight={1024}
      fittingType="fit"
      className={className}
      style={{ width: size, height: size }}
    />
  );
}