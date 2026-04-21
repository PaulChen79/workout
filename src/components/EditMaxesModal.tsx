'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { EXERCISES } from '@/lib/workout-data';

const TRACKABLE = ['bench_press','back_squat','deadlift','ohp','barbell_row'];

export default function EditMaxesModal({ current, onClose }: { current: Record<string, number>; onClose: () => void }) {
  const router = useRouter();
  const [values, setValues] = useState<Record<string, number>>({ ...current });
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    await fetch('/api/maxes', {
      method: 'PATCH', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ maxes: TRACKABLE.map((id) => ({ exerciseId: id, valueKg: values[id] ?? 0 })) }),
    });
    // Clear any cached workout drafts so the next session uses fresh pre-filled weights from the new maxes
    try {
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const k = localStorage.key(i);
        if (k && k.startsWith('forge_draft_')) localStorage.removeItem(k);
      }
    } catch {}
    setSaving(false); onClose(); router.refresh();
  }

  return (
    <div className="fixed inset-0 bg-black/70 z-40 flex items-end" onClick={onClose}>
      <div className="w-full max-w-shell mx-auto bg-surface rounded-t-[20px] p-5" onClick={(e) => e.stopPropagation()}>
        <div className="w-9 h-1 bg-border-4 rounded-full mx-auto mb-4" />
        <h2 className="text-[18px] font-bold mb-3">調整 1RM</h2>
        <div className="space-y-2">
          {TRACKABLE.map((id) => (
            <div key={id} className="flex items-center justify-between h-12 px-3 rounded-xl bg-surface-2 border border-border-2">
              <span className="text-[13px]">{EXERCISES[id].name}</span>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => setValues({ ...values, [id]: Math.max(0, (values[id] ?? 0) - 2.5) })} className="w-8 h-8 rounded bg-surface border border-border-2">−</button>
                <input
                  type="number" inputMode="decimal" step={2.5} min={0} value={values[id] ?? 0}
                  onChange={(e) => { const v = parseFloat(e.target.value); if (!Number.isNaN(v)) setValues({ ...values, [id]: Math.max(0, v) }); }}
                  className="w-16 text-center font-mono tabular-nums font-bold bg-transparent outline-none rounded focus:bg-surface"
                />
                <span className="text-[12px] text-text-dim">kg</span>
                <button type="button" onClick={() => setValues({ ...values, [id]: (values[id] ?? 0) + 2.5 })} className="w-8 h-8 rounded bg-surface border border-border-2">+</button>
              </div>
            </div>
          ))}
        </div>
        <button onClick={save} disabled={saving} className="mt-4 w-full h-12 rounded-xl bg-accent text-black font-bold disabled:opacity-50">
          {saving ? '儲存中…' : '儲存'}
        </button>
      </div>
    </div>
  );
}
