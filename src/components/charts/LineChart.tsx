export default function LineChart({ points, height = 80, stroke = '#e6a817' }: { points: number[]; height?: number; stroke?: string }) {
  if (points.length < 2) return <div className="text-[11px] text-text-dim">資料不足</div>;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;
  const w = 320;
  const h = height;
  const pad = 4;
  const xs = points.map((_, i) => (i / (points.length - 1)) * (w - pad * 2) + pad);
  const ys = points.map((v) => h - pad - ((v - min) / range) * (h - pad * 2));
  const d = xs.map((x, i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${ys[i].toFixed(1)}`).join(' ');
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full" preserveAspectRatio="none">
      <path d={d} fill="none" stroke={stroke} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
