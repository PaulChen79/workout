'use client';
import { ArrowLeft, Check } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { PlannedSlot } from '@/lib/db/queries';

interface SetState { weight: number | null; reps: number | null; done: boolean; }

export default function WorkoutScreen({ day, plan }: { day: string; plan: PlannedSlot[] }) {
  const router = useRouter();
  const [sets, setSets] = useState<Record<string, SetState[]>>(() => {
    const init: Record<string, SetState[]> = {};
    for (const s of plan) {
      init[s.exerciseId] = Array.from({ length: s.sets }, () => ({
        weight: s.suggestedWeight, reps: s.repHigh, done: false,
      }));
    }
    return init;
  });

  const [loading, setLoading] = useState(false);
  const draftKey = `forge_draft_${day}`;

  useEffect(() => {
    const raw = typeof window !== 'undefined' ? localStorage.getItem(draftKey) : null;
    if (raw) { try { setSets(JSON.parse(raw)); } catch {} }
  }, [draftKey]);

  useEffect(() => {
    const t = setTimeout(() => localStorage.setItem(draftKey, JSON.stringify(sets)), 400);
    return () => clearTimeout(t);
  }, [sets, draftKey]);

  const totalSets = plan.reduce((a, s) => a + s.sets, 0);
  const doneSets = useMemo(() => Object.values(sets).flat().filter((s) => s.done).length, [sets]);

  function updateSet(exId: string, idx: number, patch: Partial<SetState>) {
    setSets((p) => ({ ...p, [exId]: p[exId].map((s, i) => (i === idx ? { ...s, ...patch } : s)) }));
  }

  async function finish() {
    setLoading(true);
    try {
      const payloadSets: any[] = [];
      for (const p of plan) {
        sets[p.exerciseId].forEach((s, i) => payloadSets.push({
          exerciseId: p.exerciseId, setIndex: i, weightKg: s.weight, reps: s.reps, done: s.done, isCore: p.isCore,
        }));
      }
      const res = await fetch('/api/workouts', {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ dayKey: day, sets: payloadSets }),
      });
      const data = await res.json();
      if (!res.ok) { alert(data.error ?? 'save failed'); return; }
      localStorage.removeItem(draftKey);
      sessionStorage.setItem('forge_finish', JSON.stringify({ ...data, dayKey: day, sets: payloadSets }));
      router.push('/today/finish');
    } finally { setLoading(false); }
  }

  return (
    <div className="pb-28">
      <header className="sticky top-0 bg-bg/95 backdrop-blur border-b border-border z-10 px-4 h-14 flex items-center gap-3">
        <button onClick={() => router.back()}><ArrowLeft size={22} /></button>
        <span className="font-semibold capitalize">{day} Day</span>
        <span className="ml-auto text-[12px] text-text-muted font-mono">{doneSets}/{totalSets} 完成</span>
      </header>

      <div className="px-4 py-4 space-y-4">
        {plan.map((p) => (
          <div key={p.exerciseId} className="rounded-2xl bg-surface border border-border p-4">
            <div className="flex items-baseline justify-between">
              <div className="text-[17px] font-bold">{p.name}</div>
              <div className="text-[12px] text-text-muted font-mono">{p.sets}×{p.schemeDisplay}</div>
            </div>
            <div className="flex gap-1 mt-1">
              {p.muscles.slice(0, 3).map((m) => (
                <span key={m} className="text-[10px] px-1.5 py-0.5 rounded bg-surface-2 text-text-dim">{m}</span>
              ))}
            </div>
            <div className="mt-3 space-y-2">
              {sets[p.exerciseId].map((s, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="font-mono text-[13px] text-text-dim w-6">{i + 1}</span>
                  <input type="number" step="2.5" value={s.weight ?? ''} onChange={(e) => updateSet(p.exerciseId, i, { weight: e.target.value === '' ? null : +e.target.value })}
                    className="w-20 h-10 rounded-lg bg-surface-2 border border-border-2 px-2 font-mono tabular-nums text-center" />
                  <span className="text-text-dim">×</span>
                  <input type="number" value={s.reps ?? ''} onChange={(e) => updateSet(p.exerciseId, i, { reps: e.target.value === '' ? null : +e.target.value })}
                    className="w-16 h-10 rounded-lg bg-surface-2 border border-border-2 px-2 font-mono tabular-nums text-center" />
                  <button onClick={() => updateSet(p.exerciseId, i, { done: !s.done })}
                    className={`ml-auto w-12 h-12 rounded-xl flex items-center justify-center ${s.done ? 'bg-accent text-black' : 'bg-surface-2 border border-border-2 text-text-dim'}`}>
                    <Check size={20} strokeWidth={3} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="fixed bottom-0 left-0 right-0 mx-auto max-w-shell p-4 bg-bg/95 backdrop-blur border-t border-border">
        <button onClick={finish} disabled={loading}
          className="w-full h-14 rounded-2xl bg-accent text-black font-bold text-[15px] disabled:opacity-50">
          {loading ? '儲存中…' : '完成訓練'}
        </button>
      </div>
    </div>
  );
}
