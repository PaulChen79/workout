'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { EXERCISES } from '@/lib/workout-data';

const TRACKABLE = ['bench_press', 'back_squat', 'deadlift', 'ohp', 'barbell_row'] as const;
type Goal = 'hypertrophy' | 'strength' | 'powerbuilding' | 'recomp';
const GOAL_LABELS: Record<Goal, string> = { hypertrophy: '增肌', strength: '力量', powerbuilding: '力量+增肌', recomp: '減脂增肌' };

export interface ProfileEditInitial {
  name: string;
  heightCm: number;
  age: number;
  goal: Goal;
  maxes: Record<string, number>;
}

export default function ProfileEditForm({ initial }: { initial: ProfileEditInitial }) {
  const router = useRouter();
  const [name, setName] = useState(initial.name);
  const [heightCm, setHeightCm] = useState(initial.heightCm);
  const [age, setAge] = useState(initial.age);
  const [goal, setGoal] = useState<Goal>(initial.goal);
  const [maxes, setMaxes] = useState<Record<string, number>>({ ...initial.maxes });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const profileRes = await fetch('/api/profile', {
        method: 'PATCH', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name: name || null, heightCm, age, goal }),
      });
      if (!profileRes.ok) {
        const d = await profileRes.json().catch(() => ({}));
        setError(d.error ?? '儲存失敗');
        return;
      }
      const maxesRes = await fetch('/api/maxes', {
        method: 'PATCH', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ maxes: TRACKABLE.map((id) => ({ exerciseId: id, valueKg: maxes[id] ?? 0 })) }),
      });
      if (!maxesRes.ok) {
        const d = await maxesRes.json().catch(() => ({}));
        setError(d.error ?? '儲存 max 失敗');
        return;
      }
      try {
        for (let i = localStorage.length - 1; i >= 0; i--) {
          const k = localStorage.key(i);
          if (k && k.startsWith('forge_draft_')) localStorage.removeItem(k);
        }
      } catch {}
      router.push('/progress');
      router.refresh();
    } finally { setSaving(false); }
  }

  return (
    <div className="px-5 py-6 pb-28 space-y-6">
      <header className="flex items-center gap-3">
        <button type="button" onClick={() => router.back()} className="p-1"><ArrowLeft size={22} /></button>
        <h1 className="text-[22px] font-bold">編輯資料</h1>
      </header>

      <section className="space-y-3">
        <h2 className="text-[11px] uppercase tracking-wider text-text-dim font-semibold">個人資料</h2>
        <label className="block">
          <span className="block text-[10px] uppercase tracking-wider text-text-dim mb-1.5 font-semibold">姓名</span>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)}
            className="w-full h-[50px] rounded-xl bg-surface-2 border border-border-3 px-3.5 text-[15px] outline-none focus:border-accent" />
        </label>
        <Stepper label="身高" unit="cm" value={heightCm} onChange={setHeightCm} step={1} min={100} max={250} />
        <Stepper label="年齡" unit="歲" value={age}      onChange={setAge}      step={1} min={10} max={120} />
        <div>
          <p className="text-[10px] uppercase tracking-wider text-text-dim mb-2 font-semibold">目標</p>
          <div className="grid grid-cols-2 gap-2">
            {(Object.keys(GOAL_LABELS) as Goal[]).map((g) => (
              <button key={g} type="button" onClick={() => setGoal(g)}
                className={`h-11 rounded-xl text-[13px] font-semibold border
                  ${goal === g ? 'bg-accent text-black border-accent' : 'bg-surface-2 text-text border-border-2'}`}>
                {GOAL_LABELS[g]}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-[11px] uppercase tracking-wider text-text-dim font-semibold mb-3">主項 1RM</h2>
        <div className="space-y-3">
          {TRACKABLE.map((id) => (
            <MaxRow key={id} id={id} value={maxes[id] ?? 0} onChange={(v) => setMaxes({ ...maxes, [id]: v })} />
          ))}
        </div>
      </section>

      {error && <div className="rounded-xl bg-red-500/10 border border-red-500/30 text-[13px] text-danger-light p-3">{error}</div>}

      <div className="fixed bottom-0 left-0 right-0 mx-auto max-w-shell p-4 bg-bg/95 backdrop-blur border-t border-border">
        <button onClick={save} disabled={saving}
          className="w-full h-14 rounded-2xl bg-accent text-black font-bold text-[15px] disabled:opacity-50">
          {saving ? '儲存中…' : '儲存'}
        </button>
      </div>
    </div>
  );
}

function Stepper({ label, unit, value, onChange, step, min, max }: { label: string; unit?: string; value: number; onChange: (v: number) => void; step: number; min: number; max: number }) {
  const [text, setText] = useState(String(value));
  const [focused, setFocused] = useState(false);
  useEffect(() => { if (!focused) setText(String(value)); }, [value, focused]);
  function commit() {
    const v = parseFloat(text);
    if (Number.isNaN(v)) { setText(String(value)); return; }
    const clamped = Math.min(max, Math.max(min, v));
    onChange(clamped);
    setText(String(clamped));
  }
  return (
    <div className="flex items-center justify-between h-14 px-4 rounded-xl bg-surface-2 border border-border-2">
      <span className="text-[13px] font-semibold text-text-muted">{label}</span>
      <div className="flex items-center gap-2">
        <button type="button" onClick={() => onChange(Math.max(min, +(value - step).toFixed(2)))} className="w-9 h-9 rounded-lg bg-surface border border-border-2 text-xl">−</button>
        <input
          type="text" inputMode="decimal" value={text}
          onFocus={() => setFocused(true)}
          onBlur={() => { commit(); setFocused(false); }}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') (e.currentTarget as HTMLInputElement).blur(); }}
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
    <div className="flex items-center justify-between h-14 px-4 rounded-xl bg-surface-2 border border-border-2">
      <div className="flex-1">
        <div className="text-[14px] font-semibold">{ex.name}</div>
        <div className="text-[10px] text-text-dim">{ex.muscles.join(' · ')}</div>
      </div>
      <div className="flex items-center gap-2">
        <button type="button" onClick={() => onChange(Math.max(0, value - 1))} className="w-8 h-8 rounded bg-surface border border-border-2">−</button>
        <input
          type="text" inputMode="decimal" value={text}
          onFocus={() => setFocused(true)}
          onBlur={() => { commit(); setFocused(false); }}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') (e.currentTarget as HTMLInputElement).blur(); }}
          className="font-mono text-[16px] font-bold tabular-nums w-16 text-center bg-transparent outline-none rounded focus:bg-surface"
        />
        <span className="text-[12px] text-text-dim">kg</span>
        <button type="button" onClick={() => onChange(value + 1)} className="w-8 h-8 rounded bg-surface border border-border-2">+</button>
      </div>
    </div>
  );
}
