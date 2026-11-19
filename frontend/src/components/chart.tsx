"use client";
// Lightweight SVG chart; never invent a price history when a provider does not supply one.
import { useId, useState } from "react";
import { money } from "@/lib/model";
export function Chart({ values, small = false, negative = false, label = "Price history" }: { values: number[]; small?: boolean; negative?: boolean; label?: string }) {
  const id = useId().replaceAll(":", "");
  const [hover, setHover] = useState<number | null>(null);
  const data = values.filter(Number.isFinite);
  if (data.length < 2) return <div className={small ? "no-spark" : "empty-chart"}>{small ? "—" : "Historical chart not supplied by this source."}</div>;
  const width = 800, height = small ? 180 : 240, pad = small ? 8 : 18;
  const min = Math.min(...data), max = Math.max(...data), span = max - min || Math.abs(max) * .01 || 1;
  const x = (i: number) => pad + i / (data.length - 1) * (width - 2 * pad);
  const y = (v: number) => height - pad - (v - min) / span * (height - 2 * pad);
  const path = data.map((v, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(2)},${y(v).toFixed(2)}`).join(" ");
  const color = negative ? "#e99ba5" : "#d591fe";
  return <div className={small ? "sparkline" : "chart-wrap"}>
    {!small && <div className="chart-readout" aria-live="polite">{hover !== null ? money(data[hover]) : ""}</div>}
    <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" role="img" aria-label={`${label}. First ${money(data[0])}, last ${money(data[data.length - 1])}.`} onPointerMove={small ? undefined : e => { const rect = e.currentTarget.getBoundingClientRect(); setHover(Math.max(0, Math.min(data.length - 1, Math.round(((e.clientX - rect.left) / rect.width * width - pad) / (width - 2 * pad) * (data.length - 1))))); }} onPointerLeave={() => setHover(null)}>
      <defs><linearGradient id={id} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={color} stopOpacity=".16" /><stop offset="100%" stopColor={color} stopOpacity="0" /></linearGradient></defs>
      {!small && [0, 1, 2, 3].map(i => <line key={i} x1="0" x2={width} y1={i * 70 + 15} y2={i * 70 + 15} stroke="#ffffff0d" strokeDasharray="3 6" />)}
      {!small && <path d={`${path} L${x(data.length - 1)},${height} L${pad},${height}Z`} fill={`url(#${id})`} />}
      <path d={path} fill="none" stroke={color} strokeWidth={small ? 2 : 2.5} vectorEffect="non-scaling-stroke" />
      {!small && hover !== null && <><line x1={x(hover)} x2={x(hover)} y1="0" y2={height} stroke="#ffffff50" strokeDasharray="4 4" /><circle cx={x(hover)} cy={y(data[hover])} r="5" fill={color} /></>}
    </svg>
  </div>;
}
