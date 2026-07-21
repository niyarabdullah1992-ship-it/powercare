import React from "react";

export default function StabilityWave({ pulseDuration }) {
  return (
    <div
      className="stability-wave absolute inset-x-0 bottom-0 h-14 overflow-hidden text-landing-gold"
      style={{ "--stability-pulse-duration": pulseDuration }}
      aria-hidden="true"
    >
      <svg className="h-full w-[200%]" viewBox="0 0 240 48" preserveAspectRatio="none">
        <path
          className="stability-wave-track"
          d="M0 27 C10 27 13 8 22 8 S34 42 44 42 S56 14 66 14 S78 27 80 27 C90 27 93 8 102 8 S114 42 124 42 S136 14 146 14 S158 27 160 27 C170 27 173 8 182 8 S194 42 204 42 S216 14 226 14 S238 27 240 27"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    </div>
  );
}