import React from "react";

const COLORS = [
  "bg-blue-100 text-blue-700", "bg-green-100 text-green-700", "bg-purple-100 text-purple-700",
  "bg-amber-100 text-amber-700", "bg-pink-100 text-pink-700", "bg-cyan-100 text-cyan-700",
];

function colorFor(name) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return COLORS[Math.abs(hash) % COLORS.length];
}

export default function EmployeeAvatar({ name, size = 20 }) {
  const initials = (name || "?").trim().split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
  return (
    <span
      className={`inline-flex items-center justify-center rounded-full font-semibold shrink-0 ${colorFor(name || "")}`}
      style={{ width: size, height: size, fontSize: size * 0.42 }}
    >
      {initials || "?"}
    </span>
  );
}