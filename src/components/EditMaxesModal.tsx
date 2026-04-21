'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { EXERCISES } from '@/lib/workout-data';

const TRACKABLE = ['bench_press','back_squat','deadlift','ohp','barbell_row'];

export default function EditMaxesModal({ current, onClose }: { current: Record<string, number>; onClose: () => void }) {
  const router = useRouter();
  const [values, setValues] = useState<Record<string, number>>({ ...current });
  const [saving, setSaving] = useState(false);

  function setValue(id: string, v: number) { setValues((s) => ({ ...s, [id]: Math.max(0, v) })); }

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
            <MaxEditRow key={id} id={id} value={values[id] ?? 0} onChange={(v) => setValue(id, v)} />
          ))}
        </div>
        <button onClick={save} disabled={saving} className="mt-4 w-full h-12 rounded-xl bg-accent text-black font-bold disabled:opacity-50">
          {saving ? '儲存中…' : '儲存'}
        </button>
      </div>
    </div>
  );
}

function MaxEditRow({ id, value, onChange }: { id: string; value: number; onChange: (v: number) => void }) {
  const [text, setText] = useState(String(value));
  const [focused, setFocused] = useState(false);
  useEffect(() => { if (!focused) setText(String(value)); }, [value, focused]);
  function commit() {
    const v = parseFloat(text);
    if (Number.isNaN(v)) { setText(String(value)); return; }
    const clamped = Math.max(0, v);
    onChange(clamped);
    setText(String(clamped));
  }
  return (
    <div className="flex items-center justify-between h-12 px-3 rounded-xl bg-surface-2 border border-border-2">
      <span className="text-[13px]">{EXERCISES[id].name}</span>
      <div className="flex items-center gap-2">
        <button type="button" onClick={() => onChange(Math.max(0, value - 1))} className="w-8 h-8 rounded bg-surface border border-border-2">−</button>
        <input
          type="text" inputMode="decimal" value={text}
          onFocus={() => setFocused(true)}
          onBlur={() => { commit(); setFocused(false); }}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') (e.currentTarget as HTMLInputElement).blur(); }}
          className="w-16 text-center font-mono tabular-nums font-bold bg-transparent outline-none rounded focus:bg-surface"
        />
        <span className="text-[12px] text-text-dim">kg</span>
        <button type="button" onClick={() => onChange(value + 1)} className="w-8 h-8 rounded bg-surface border border-border-2">+</button>
      </div>
    </div>
  );
}
