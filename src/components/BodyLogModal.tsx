'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function BodyLogModal({ onClose, initialWeight }: { onClose: () => void; initialWeight: number }) {
  const router = useRouter();
  const [weight, setWeight] = useState(initialWeight);
  const [bodyFat, setBodyFat] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    await fetch('/api/body-logs', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ weightKg: weight, bodyFat }) });
    setSaving(false);
    onClose(); router.refresh();
  }

  return (
    <div className="fixed inset-0 bg-black/70 z-40 flex items-end" onClick={onClose}>
      <div className="w-full max-w-shell mx-auto bg-surface rounded-t-[20px] p-5" onClick={(e) => e.stopPropagation()}>
        <div className="w-9 h-1 bg-border-4 rounded-full mx-auto mb-4" />
        <h2 className="text-[18px] font-bold mb-4">記錄體重 / 體脂</h2>
        <Row label="體重" unit="kg" value={weight} step={0.1} onChange={setWeight} />
        <Row label="體脂率" unit="%" value={bodyFat ?? 0} step={0.5} onChange={(v) => setBodyFat(v)} />
        <button onClick={save} disabled={saving} className="mt-4 w-full h-12 rounded-xl bg-accent text-black font-bold disabled:opacity-50">
          {saving ? '儲存中…' : '記錄'}
        </button>
      </div>
    </div>
  );
}
function Row({ label, unit, value, step, onChange }: { label: string; unit?: string; value: number; step: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center justify-between h-12 mb-2 px-3 rounded-xl bg-surface-2 border border-border-2">
      <span className="text-[13px] text-text-muted">{label}</span>
      <div className="flex items-center gap-2">
        <button type="button" onClick={() => onChange(Math.max(0, +(value - step).toFixed(1)))} className="w-8 h-8 rounded bg-surface border border-border-2">−</button>
        <input
          type="number" inputMode="decimal" step={step} min={0} value={value}
          onChange={(e) => { const v = parseFloat(e.target.value); if (!Number.isNaN(v)) onChange(Math.max(0, v)); }}
          className="w-16 text-center font-mono tabular-nums font-bold bg-transparent outline-none rounded focus:bg-surface"
        />
        {unit && <span className="text-[12px] text-text-dim w-6">{unit}</span>}
        <button type="button" onClick={() => onChange(+(value + step).toFixed(1))} className="w-8 h-8 rounded bg-surface border border-border-2">+</button>
      </div>
    </div>
  );
}
