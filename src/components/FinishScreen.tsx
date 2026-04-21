'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { EXERCISES } from '@/lib/workout-data';

interface Proposal { exerciseId: string; oldMax: number | null; estimate: number; }
interface FinishData {
  workoutId: number;
  proposals: Proposal[];
  dayKey: string;
  sets: { exerciseId: string; weightKg: number | null; reps: number | null; done: boolean }[];
}

export default function FinishScreen() {
  const router = useRouter();
  const [data, setData] = useState<FinishData | null>(null);
  const [accepted, setAccepted] = useState<Record<string, { on: boolean; value: number }>>({});
  const [rir, setRir] = useState<Record<string, number | null>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const raw = sessionStorage.getItem('forge_finish');
    if (!raw) { router.replace('/today'); return; }
    const d: FinishData = JSON.parse(raw);
    setData(d);
    const a: Record<string, { on: boolean; value: number }> = {};
    for (const p of d.proposals) {
      const better = p.oldMax === null || p.estimate > p.oldMax;
      a[p.exerciseId] = { on: better, value: p.estimate };
    }
    setAccepted(a);
  }, [router]);

  if (!data) return null;

  const doneSets = data.sets.filter((s) => s.done).length;
  const totalVolume = data.sets.reduce((a, s) => a + (s.done && s.weightKg && s.reps ? s.weightKg * s.reps : 0), 0);
  const prCount = Object.values(accepted).filter((a) => a.on).length;

  async function save() {
    if (!data) return;
    setSaving(true);
    const maxAccepts = data.proposals
      .filter((p) => accepted[p.exerciseId]?.on)
      .map((p) => ({ exerciseId: p.exerciseId, newMaxKg: accepted[p.exerciseId].value }));
    const feedback = Object.entries(rir).map(([exerciseId, v]) => ({ exerciseId, rir: v }));
    await fetch(`/api/workouts/${data.workoutId}`, {
      method: 'PATCH', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ feedback, maxAccepts }),
    });
    sessionStorage.removeItem('forge_finish');
    router.push('/progress');
  }

  return (
    <div className="px-5 py-6 pb-28">
      <div className="text-center">
        <h1 className="text-[28px] font-bold">完成！</h1>
        <p className="text-[13px] text-text-muted mt-1">
          <span className="font-mono">{doneSets}</span> 組 ·{' '}
          <span className="font-mono">{Math.round(totalVolume)}</span> kg 總量
          {prCount > 0 && <> · <span className="text-accent">{prCount} PR</span></>}
        </p>
      </div>

      {data.proposals.length > 0 && (
        <section className="mt-6">
          <h2 className="text-[11px] uppercase tracking-wider text-text-dim font-semibold mb-3">1RM 更新</h2>
          <div className="space-y-3">
            {data.proposals.map((p) => {
              const st = accepted[p.exerciseId] ?? { on: false, value: p.estimate };
              const delta = p.oldMax !== null ? st.value - p.oldMax : null;
              return (
                <div key={p.exerciseId} className="rounded-2xl bg-surface border border-border p-4">
                  <div className="flex items-baseline justify-between">
                    <span className="font-semibold">{EXERCISES[p.exerciseId].name}</span>
                    <span className="font-mono text-[13px] text-text-muted">
                      {p.oldMax ?? '—'} → <span className={delta !== null && delta > 0 ? 'text-accent font-bold' : ''}>{st.value}</span> kg
                    </span>
                  </div>
                  <div className="mt-3 flex items-center gap-3">
                    <label className="flex items-center gap-2 text-[12px]">
                      <input type="checkbox" checked={st.on} onChange={(e) => setAccepted({ ...accepted, [p.exerciseId]: { ...st, on: e.target.checked } })} />
                      更新 max
                    </label>
                    <button type="button" onClick={() => setAccepted({ ...accepted, [p.exerciseId]: { ...st, value: Math.max(0, st.value - 2.5) } })}
                      className="ml-auto w-8 h-8 rounded-md bg-surface-2 border border-border-2">−</button>
                    <button type="button" onClick={() => setAccepted({ ...accepted, [p.exerciseId]: { ...st, value: st.value + 2.5 } })}
                      className="w-8 h-8 rounded-md bg-surface-2 border border-border-2">+</button>
                  </div>
                  <div className="mt-3">
                    <p className="text-[10px] uppercase tracking-wider text-text-dim mb-1.5">RIR（剩幾下沒做完，可跳過）</p>
                    <div className="flex gap-2">
                      {[0,1,2,3].map((n) => (
                        <button key={n} type="button" onClick={() => setRir({ ...rir, [p.exerciseId]: rir[p.exerciseId] === n ? null : n })}
                          className={`w-10 h-9 rounded-lg text-[13px] font-semibold border
                            ${rir[p.exerciseId] === n ? 'bg-accent text-black border-accent' : 'bg-surface-2 border-border-2 text-text-dim'}`}>{n === 3 ? '3+' : n}</button>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      <div className="fixed bottom-0 left-0 right-0 mx-auto max-w-shell p-4 bg-bg/95 backdrop-blur border-t border-border">
        <button onClick={save} disabled={saving}
          className="w-full h-14 rounded-2xl bg-accent text-black font-bold text-[15px] disabled:opacity-50">
          {saving ? '儲存中…' : '儲存'}
        </button>
      </div>
    </div>
  );
}
