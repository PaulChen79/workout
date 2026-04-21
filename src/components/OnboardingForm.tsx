'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { HelpCircle, X } from 'lucide-react';
import { EXERCISES } from '@/lib/workout-data';
import { estimate1RM } from '@/lib/formula';

const TRACKABLE = ['bench_press', 'back_squat', 'deadlift', 'ohp', 'barbell_row'] as const;

export default function OnboardingForm({ showGuide = false }: { showGuide?: boolean }) {
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
  const [guideOpen, setGuideOpen] = useState(showGuide);

  async function dismissGuide() {
    setGuideOpen(false);
    // Fire-and-forget; even if this fails, the modal is closed locally for this session.
    fetch('/api/onboarding/guide-seen', { method: 'POST' }).catch(() => {});
  }

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
      <header className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] uppercase tracking-wider text-text-dim">ONBOARDING</p>
          <h1 className="text-[28px] font-bold tracking-tight mt-1">設定你的資料</h1>
          <p className="text-[13px] text-text-muted mt-1">讓 Forge 算出建議重量。都能之後改。</p>
        </div>
        <button type="button" onClick={() => setGuideOpen(true)} aria-label="說明"
          className="p-1 text-text-dim hover:text-accent">
          <HelpCircle size={20} />
        </button>
      </header>
      {guideOpen && <GuideModal onClose={dismissGuide} />}

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
  const [reps, setReps] = useState(0);
  const [testWeight, setTestWeight] = useState(0);
  const [open, setOpen] = useState(false);
  const [text, setText] = useState(String(value));
  const [focused, setFocused] = useState(false);
  const estimate = estimate1RM(testWeight, reps);

  useEffect(() => { if (!focused) setText(String(value)); }, [value, focused]);

  function commit() {
    const v = parseFloat(text);
    if (Number.isNaN(v)) { setText(String(value)); return; }
    const clamped = Math.max(0, v);
    onChange(clamped);
    setText(String(clamped));
  }

  return (
    <div className="rounded-xl bg-surface-2 border border-border-2 p-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[15px] font-semibold">{ex.name}</div>
          <div className="text-[11px] text-text-dim">{ex.muscles.join(' · ')}</div>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => onChange(Math.max(0, value - 1))} className="w-8 h-8 rounded-md bg-surface border border-border-2">−</button>
          <input
            type="text" inputMode="decimal" value={text}
            onFocus={() => setFocused(true)}
            onBlur={() => { commit(); setFocused(false); }}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') (e.currentTarget as HTMLInputElement).blur(); }}
            className="font-mono text-[17px] tabular-nums font-bold w-16 text-center bg-transparent outline-none rounded focus:bg-surface"
          />
          <span className="text-[12px] text-text-dim">kg</span>
          <button type="button" onClick={() => onChange(value + 1)} className="w-8 h-8 rounded-md bg-surface border border-border-2">+</button>
        </div>
      </div>
      <button type="button" onClick={() => setOpen(!open)} className="mt-2 text-[11px] text-text-dim underline">用 reps 推估</button>
      {open && (
        <div className="mt-2 flex items-center gap-2 text-[12px]">
          <input type="number" value={testWeight || ''} onChange={(e) => setTestWeight(+e.target.value)} placeholder="重量" className="w-20 h-9 rounded bg-surface border border-border-2 px-2 font-mono" />
          <span>×</span>
          <input type="number" value={reps || ''} onChange={(e) => setReps(+e.target.value)} placeholder="reps" className="w-20 h-9 rounded bg-surface border border-border-2 px-2 font-mono" />
          {estimate && <button type="button" onClick={() => onChange(Math.round(estimate))} className="ml-auto text-accent">套用 {Math.round(estimate)}kg</button>}
        </div>
      )}
    </div>
  );
}

function GuideModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-end sm:items-center justify-center" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-shell mx-auto bg-surface rounded-t-[20px] sm:rounded-[20px] max-h-[85dvh] overflow-y-auto"
      >
        <div className="sticky top-0 bg-surface px-5 pt-4 pb-3 border-b border-border flex items-center justify-between">
          <div className="w-9 h-1 bg-border-4 rounded-full absolute top-2 left-1/2 -translate-x-1/2" />
          <h2 className="text-[18px] font-bold">一分鐘看懂怎麼填 1RM</h2>
          <button type="button" onClick={onClose} aria-label="關閉" className="p-1 text-text-dim"><X size={20} /></button>
        </div>

        <div className="px-5 py-4 space-y-5 text-[13px] leading-relaxed">
          <section>
            <h3 className="text-[14px] font-bold mb-1">1RM 是什麼</h3>
            <p className="text-text-muted">
              你做 <span className="text-text font-semibold">一下</span>、姿勢完美能舉起的最大重量。
              app 用它算你每次訓練該用的重量（例：臥推 1RM 60kg，strength 組 80% → 47.5kg × 5 下 × 4 組）。
            </p>
          </section>

          <section>
            <h3 className="text-[14px] font-bold mb-1">⚠️ 不要真的挑戰 1RM</h3>
            <p className="text-text-muted">
              姿勢崩或熱身不夠時硬上最大重量很容易受傷。用下面三種安全做法擇一即可。
            </p>
          </section>

          <section className="rounded-xl bg-surface-2 border border-border-2 p-3 space-y-1">
            <h3 className="text-[14px] font-bold text-accent">做法 1 — 用 reps 推估（推薦）</h3>
            <p className="text-text-muted">
              每個動作下方有「<span className="font-semibold text-text">用 reps 推估</span>」：
            </p>
            <ol className="list-decimal list-inside text-text-muted space-y-0.5">
              <li>熱身（空槓 10 下 → 加輕重量 5 下）</li>
              <li>加到「做得動、但不輕鬆」的重量，做 5 下</li>
              <li>填入「重量 × 5」→ 按「套用」</li>
            </ol>
            <p className="text-[11px] text-text-dim pt-1">例：臥推 40kg × 5 下還 ok → app 算出 ≈ 47kg。誤差只 ±5%。</p>
          </section>

          <section className="rounded-xl bg-surface-2 border border-border-2 p-3 space-y-1">
            <h3 className="text-[14px] font-bold text-accent">做法 2 — 用體重比例猜</h3>
            <p className="text-text-muted text-[12px]">從沒進過健身房？先用體重粗估：</p>
            <table className="w-full text-[12px] text-text-muted mt-1">
              <thead>
                <tr className="text-text-dim text-[10px] uppercase tracking-wider">
                  <th className="text-left pb-1">動作</th>
                  <th className="text-right pb-1">男 × 體重</th>
                  <th className="text-right pb-1">女 × 體重</th>
                </tr>
              </thead>
              <tbody className="font-mono tabular-nums">
                <tr><td>臥推</td><td className="text-right">0.5</td><td className="text-right">0.3</td></tr>
                <tr><td>肩推</td><td className="text-right">0.35</td><td className="text-right">0.2</td></tr>
                <tr><td>背蹲</td><td className="text-right">0.75</td><td className="text-right">0.5</td></tr>
                <tr><td>硬舉</td><td className="text-right">1.0</td><td className="text-right">0.65</td></tr>
                <tr><td>划船</td><td className="text-right">0.5</td><td className="text-right">0.3</td></tr>
              </tbody>
            </table>
            <p className="text-[11px] text-text-dim pt-1">例：70kg 男生 → 臥推 35、硬舉 70、蹲 52.5。</p>
          </section>

          <section className="rounded-xl bg-surface-2 border border-border-2 p-3 space-y-1">
            <h3 className="text-[14px] font-bold text-accent">做法 3 — 故意估低（最佛系）</h3>
            <p className="text-text-muted">
              不確定就填低一點。系統會根據你每次訓練結果自動往上調 2.5%，大概 1-2 週會爬到真實位置。
              <span className="text-text">不會受傷，只會前幾次偏輕。</span>
            </p>
          </section>

          <section>
            <h3 className="text-[14px] font-bold mb-1">填錯怎麼辦？</h3>
            <p className="text-text-muted">
              去 <span className="text-accent">進度 → 編輯資料</span> 隨時改。
              錯 20% 都能在 2 週內靠自動調整修正回來。
            </p>
          </section>

          <section>
            <h3 className="text-[14px] font-bold mb-1">我根本不會做這些動作？</h3>
            <p className="text-text-muted">
              先別管 1RM。花 2-3 週在 YouTube 學 bench / squat / deadlift 姿勢，
              用空槓練到穩再回來填。<span className="text-text font-semibold">姿勢安全 &gt;&gt;&gt; 1RM 數字。</span>
            </p>
          </section>
        </div>

        <div className="sticky bottom-0 bg-surface px-5 py-4 border-t border-border">
          <button type="button" onClick={onClose}
            className="w-full h-12 rounded-xl bg-accent text-black font-bold">
            我懂了，開始填
          </button>
        </div>
      </div>
    </div>
  );
}
