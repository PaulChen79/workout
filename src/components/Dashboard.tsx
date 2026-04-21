'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Flame, TrendingUp, Pencil, Plus } from 'lucide-react';
import { EXERCISES } from '@/lib/workout-data';
import LineChart from './charts/LineChart';
import BarChart from './charts/BarChart';
import BodyLogModal from './BodyLogModal';
import EditMaxesModal from './EditMaxesModal';

export interface DashboardData {
  username: string;
  name: string | null;
  heightCm: number | null;
  age: number | null;
  latestWeight: number | null;
  firstWeight: number | null;
  bodyFat: number | null;
  bodyLogHistory: number[];
  workoutCount: number;
  streakDays: number;
  maxes: { exerciseId: string; current: number; first: number; history: number[] }[];
  volumeSeries: { x: string; y: number }[];
  recent: { id: number; dayKey: string; finishedAt: string; setCount: number; volume: number; pr: number }[];
}

export default function Dashboard({ data }: { data: DashboardData }) {
  const [bodyOpen, setBodyOpen] = useState(false);
  const [maxesOpen, setMaxesOpen] = useState(false);
  const router = useRouter();

  const weightDelta = data.firstWeight != null && data.latestWeight != null ? +(data.latestWeight - data.firstWeight).toFixed(1) : null;

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/auth'); router.refresh();
  }

  return (
    <div className="px-5 py-6 space-y-6">
      <header className="flex items-start justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-wider text-text-dim">
            DASHBOARD · <span className="text-accent">@{data.username}</span>
          </p>
          <h1 className="text-[28px] font-bold mt-1">{data.name ?? 'You'}</h1>
          <p className="text-[12px] text-text-muted">
            {data.heightCm ? `${data.heightCm}cm` : ''}
            {data.latestWeight ? ` · ${data.latestWeight}kg` : ''}
            {data.age ? ` · ${data.age}歲` : ''}
          </p>
        </div>
        <button onClick={logout} className="text-[11px] font-semibold text-text-dim">登出</button>
      </header>

      <section className="grid grid-cols-2 gap-3">
        <Stat label="總訓練次數" value={String(data.workoutCount)} />
        <Stat label="連續天數"   value={String(data.streakDays)} />
      </section>

      <Card title="體重走勢" action={<button onClick={() => setBodyOpen(true)} className="text-accent text-[12px]"><Plus size={14} className="inline" /> 記錄</button>}>
        <div className="flex items-baseline gap-3">
          <span className="font-mono text-[28px] font-bold">{data.latestWeight ?? '—'}</span>
          <span className="text-text-dim text-[13px]">kg</span>
          {weightDelta !== null && (
            <span className={`text-[12px] font-mono ${weightDelta > 0 ? 'text-accent' : weightDelta < 0 ? 'text-success' : 'text-text-dim'}`}>
              {weightDelta > 0 ? '+' : ''}{weightDelta}kg
            </span>
          )}
        </div>
        <div className="mt-3"><LineChart points={data.bodyLogHistory} /></div>
      </Card>

      {data.bodyFat !== null && (
        <Card title="體脂率" action={<button onClick={() => setBodyOpen(true)} className="text-text-dim text-[12px]"><Pencil size={14} className="inline" /> 編輯</button>}>
          <div className="flex items-baseline gap-3">
            <span className="font-mono text-[28px] font-bold">{data.bodyFat}</span>
            <span className="text-text-dim text-[13px]">%</span>
          </div>
        </Card>
      )}

      <Card title="主項 Max 進步" action={<button onClick={() => setMaxesOpen(true)} className="text-text-dim text-[12px]"><Pencil size={14} className="inline" /> 編輯</button>}>
        <div className="space-y-3">
          {data.maxes.map((m) => {
            const delta = m.current - m.first;
            return (
              <div key={m.exerciseId} className="flex items-center gap-3">
                <span className="text-[13px] flex-1">{EXERCISES[m.exerciseId].name}</span>
                <div className="w-20 h-8"><LineChart points={m.history} height={28} /></div>
                <span className="font-mono tabular-nums w-20 text-right">{m.current}kg
                  {delta > 0 && <span className="text-accent text-[11px] ml-1">+{delta}</span>}
                </span>
              </div>
            );
          })}
        </div>
      </Card>

      <Card title="訓練量">
        <BarChart points={data.volumeSeries} />
      </Card>

      <Card title="最近訓練">
        <div className="space-y-2">
          {data.recent.map((r) => (
            <div key={r.id} className="flex items-center gap-3 text-[12px]">
              <span className="font-mono tabular-nums text-text-dim w-16">{new Date(r.finishedAt).toLocaleDateString('zh', { month: '2-digit', day: '2-digit' })}</span>
              <span className="uppercase w-10 text-text-muted">{r.dayKey}</span>
              <span className="font-mono tabular-nums">{r.setCount} 組</span>
              <span className="font-mono tabular-nums text-text-muted">{Math.round(r.volume)}kg</span>
              {r.pr > 0 && <span className="ml-auto text-accent flex items-center gap-1"><Flame size={12} />{r.pr}</span>}
            </div>
          ))}
          {data.recent.length === 0 && <p className="text-[12px] text-text-dim">還沒有紀錄</p>}
        </div>
      </Card>

      {bodyOpen && <BodyLogModal onClose={() => setBodyOpen(false)} initialWeight={data.latestWeight ?? 70} />}
      {maxesOpen && <EditMaxesModal onClose={() => setMaxesOpen(false)} current={Object.fromEntries(data.maxes.map((m) => [m.exerciseId, m.current]))} />}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-surface border border-border p-4">
      <p className="text-[11px] uppercase tracking-wider text-text-dim">{label}</p>
      <p className="font-mono text-[22px] font-bold mt-1">{value}</p>
    </div>
  );
}
function Card({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl bg-surface border border-border p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-[11px] uppercase tracking-wider text-text-dim font-semibold">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}
