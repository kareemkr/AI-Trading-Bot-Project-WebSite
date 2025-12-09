"use client";

export function Sparkline({ data, color }) {
  if (!data || data.length === 0) return null;

  const max = Math.max(...data);
  const min = Math.min(...data);

  const points = data
    .map((value, index) => {
      const x = (index / (data.length - 1)) * 100;
      const y = ((value - min) / (max - min)) * 30;
      return `${x},${30 - y}`;
    })
    .join(" ");

  return (
    <svg
      width="120"
      height="32"
      viewBox="0 0 100 30"
      preserveAspectRatio="none"
      className="opacity-75"
    >
      <polyline fill="none" stroke={color} strokeWidth="2" points={points} />
    </svg>
  );
}
