import React from "react";

const LOGO_URL = "https://media.base44.com/images/public/6a4f617bd7360a0ae9581d2a/47186d53a_image.png";

export default function Logo({ size = 36, className = "" }) {
  return (
    <img
      src={LOGO_URL}
      alt="PowerCare"
      width={size}
      height={size}
      className={`object-contain ${className}`}
      style={{ width: size, height: size }}
    />
  );
}