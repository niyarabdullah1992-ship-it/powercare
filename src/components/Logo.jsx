import React from "react";
import { Image } from "@/components/ui/image";
import { POWERCARE_LOGO_URL } from "@/lib/brand";

// The NiroVera lockup is wide (mark + wordmark), so the box follows its ratio
// instead of a square — otherwise the artwork shrinks to fit and looks tiny.
const RATIO = 3.4;

export default function Logo({ size = 48, className = "" }) {
  return (
    <Image
      src={POWERCARE_LOGO_URL}
      alt="NiroVera"
      originWidth={1360}
      originHeight={400}
      fittingType="fit"
      className={className}
      style={{ width: size * RATIO, height: size }}
    />
  );
}