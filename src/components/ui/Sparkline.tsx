import { useId } from "react";

/** Lightweight inline trend sparkline (pure SVG — no chart lib overhead). */
export function Sparkline({
  data, width = 84, height = 28, color = "#386AF6", strokeWidth = 2,
}: { data: number[]; width?: number; height?: number; color?: string; strokeWidth?: number }) {
  const id = useId();
  if (!data.length) return <svg width={width} height={height} aria-hidden />;
  const viewBox = `0 0 ${width} ${height}`;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const pad = strokeWidth + 1;
  const pts = data.map((v, i) => {
    const x = data.length === 1 ? width / 2 : pad + (i / (data.length - 1)) * (width - pad * 2);
    const y = height - pad - ((v - min) / range) * (height - pad * 2);
    return [x, y] as const;
  });
  const line = pts.map((p) => p.join(",")).join(" ");
  const area = `${pad},${height} ${line} ${width - pad},${height}`;
  return (
    <svg width={width} height={height} viewBox={viewBox} className="max-w-full overflow-visible" aria-hidden>
      <defs>
        <linearGradient id={`sp-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.22" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={area} fill={`url(#sp-${id})`} />
      <polyline points={line} fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r={strokeWidth + 0.5} fill={color} />
    </svg>
  );
}
