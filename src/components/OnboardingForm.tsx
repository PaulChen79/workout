'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { EXERCISES } from '@/lib/workout-data';
import { estimate1RM } from '@/lib/formula';

const TRACKABLE = ['bench_press', 'back_squat', 'deadlift', 'ohp', 'barbell_row'] as const;

export default function OnboardingForm() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [heightCm, setHeightCm] = useState(170);
  const [age, setAge] = useState(28);
  const [goal, setGoal] = useState<'hypertrophy'|'strength'|'powerbuilding'|'recomp'>('powerbuilding');
  const [weightKg, setWeightKg] = useState(70);
  const [maxes, setMaxes] = useState<Record<string, number>>({
    bench_press: 60, back_squat: 80, deadlift: 100, ohp: 40, barbell_row: 55,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setLoading(true); setError(null);
    const res = await fetch('/api/onboarding', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        name: name || undefined, heightCm, age, goal, weightKg,
        maxes: TRACKABLE.map((id) => ({ exerciseId: id, valueKg: maxes[id] })),
      }),
    });
    setLoading(false);
    if (!res.ok) { const d = await res.json().catch(() => ({})); setError(d.error ?? '儲存失敗'); return; }
    router.push('/today'); router.refresh();
  }

  return (
    <div className="px-5 py-8 space-y-8">
      <header>
        <p className="text-[10px] uppercase tracking-wider text-text-dim">ONBOARDING</p>
        <h1 className="text-[28px] font-bold tracking-tight mt-1">設定你的資料</h1>
        <p className="text-[13px] text-text-muted mt-1">讓 Forge 算出建議重量。都能之後改。</p>
      </header>

      <section className="space-y-3">
        <Stepper label="身高" unit="cm" value={heightCm} onChange={setHeightCm} step={1} min={100} max={250} />
        <Stepper label="體重" unit="kg" value={weightKg} onChange={setWeightKg} step={0.5} min={30} max={300} />
        <Stepper label="年齡" unit="歲" value={age}      onChange={setAge}      step={1} min={10} max={120} />
        <div>
          <p className="text-[10px] uppercase tracking-wider text-text-dim mb-2 font-semibold">目標</p>
          <div className="grid grid-cols-2 gap-2">
            {(['hypertrophy','strength','powerbuilding','recomp'] as const).map((g) => (
              <button key={g} type="button" onClick={() => setGoal(g)}
                className={`h-11 rounded-xl text-[13px] font-semibold border
                  ${goal === g ? 'bg-accent text-black border-accent' : 'bg-surface-2 text-text border-border-2'}`}>
                {({hypertrophy:'增肌', strength:'力量', powerbuilding:'力量+增肌', recomp:'減脂增肌'})[g]}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-[22px] font-bold mb-3">主項 1RM</h2>
        <p className="text-[12px] text-text-muted mb-4">不知道？試 5RM 用 Epley 推算。</p>
        <div className="space-y-3">
          {TRACKABLE.map((id) => (
            <MaxRow key={id} id={id} value={maxes[id]} onChange={(v) => setMaxes({ ...maxes, [id]: v })} />
          ))}
        </div>
      </section>

      {error && <div className="rounded-xl bg-red-500/10 border border-red-500/30 text-[13px] text-danger-light p-3">{error}</div>}

      <button onClick={submit} disabled={loading}
        className="w-full h-14 rounded-2xl bg-accent text-black font-bold disabled:opacity-50">
        {loading ? '儲存中…' : '開始訓練'}
      </button>
    </div>
  );
}

function Stepper({ label, unit, value, onChange, step, min, max }: { label: string; unit?: string; value: number; onChange: (v: number) => void; step: number; min: number; max: number }) {
  return (
    <div className="flex items-center justify-between h-14 px-4 rounded-xl bg-surface-2 border border-border-2">
      <span className="text-[13px] font-semibold text-text-muted">{label}</span>
      <div className="flex items-center gap-2">
        <button type="button" onClick={() => onChange(Math.max(min, +(value - step).toFixed(2)))} className="w-9 h-9 rounded-lg bg-surface border border-border-2 text-xl">−</button>
        <input
          type="number" inputMode="decimal" step={step} min={min} max={max} value={value}
          onChange={(e) => { const v = parseFloat(e.target.value); if (!Number.isNaN(v)) onChange(Math.min(max, Math.max(min, v))); }}
          className="font-mono text-[18px] font-bold tabular-nums w-20 text-center bg-transparent outline-none rounded focus:bg-surface"
        />
        {unit && <span className="text-[13px] text-text-dim w-6">{unit}</span>}
        <button type="button" onClick={() => onChange(Math.min(max, +(value + step).toFixed(2)))} className="w-9 h-9 rounded-lg bg-surface border border-border-2 text-xl">+</button>
      </div>
    </div>
  );
}

function MaxRow({ id, value, onChange }: { id: string; value: number; onChange: (v: number) => void }) {
  const ex = EXERCISES[id];
  const [reps, setReps] = useState(0);
  const [testWeight, setTestWeight] = useState(0);
  const [open, setOpen] = useState(false);
  const estimate = estimate1RM(testWeight, reps);

  return (
    <div className="rounded-xl bg-surface-2 border border-border-2 p-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[15px] font-semibold">{ex.name}</div>
          <div className="text-[11px] text-text-dim">{ex.muscles.join(' · ')}</div>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => onChange(Math.max(0, value - 2.5))} className="w-8 h-8 rounded-md bg-surface border border-border-2">−</button>
          <input
            type="number" inputMode="decimal" step={2.5} min={0} value={value}
            onChange={(e) => { const v = parseFloat(e.target.value); if (!Number.isNaN(v)) onChange(Math.max(0, v)); }}
            className="font-mono text-[17px] tabular-nums font-bold w-16 text-center bg-transparent outline-none rounded focus:bg-surface"
          />
          <span className="text-[12px] text-text-dim">kg</span>
          <button type="button" onClick={() => onChange(value + 2.5)} className="w-8 h-8 rounded-md bg-surface border border-border-2">+</button>
        </div>
      </div>
      <button type="button" onClick={() => setOpen(!open)} className="mt-2 text-[11px] text-text-dim underline">用 reps 推估</button>
      {open && (
        <div className="mt-2 flex items-center gap-2 text-[12px]">
          <input type="number" value={testWeight || ''} onChange={(e) => setTestWeight(+e.target.value)} placeholder="重量" className="w-20 h-9 rounded bg-surface border border-border-2 px-2 font-mono" />
          <span>×</span>
          <input type="number" value={reps || ''} onChange={(e) => setReps(+e.target.value)} placeholder="reps" className="w-20 h-9 rounded bg-surface border border-border-2 px-2 font-mono" />
          {estimate && <button type="button" onClick={() => onChange(Math.round(estimate / 2.5) * 2.5)} className="ml-auto text-accent">套用 {Math.round(estimate)}kg</button>}
        </div>
      )}
    </div>
  );
}
