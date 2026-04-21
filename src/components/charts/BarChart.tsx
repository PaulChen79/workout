export default function BarChart({ points, height = 90 }: { points: { x: string; y: number }[]; height?: number }) {
  if (!points.length) return <div className="text-[11px] text-text-dim">無資料</div>;
  const max = Math.max(...points.map((p) => p.y), 1);
  return (
    <div className="flex items-end gap-1 h-[90px]" style={{ height }}>
      {points.map((p, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1">
          <div className="w-full rounded-t bg-accent/70" style={{ height: `${(p.y / max) * 100}%` }} />
          <span className="text-[9px] text-text-dim font-mono">{p.x}</span>
        </div>
      ))}
    </div>
  );
}
