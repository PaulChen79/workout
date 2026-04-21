'use client';
import Link from 'next/link';
import { ChevronRight, Zap, ArrowDown, Footprints } from 'lucide-react';
import type { DayKey } from '@/lib/workout-data';
import { DAY_TEMPLATES } from '@/lib/workout-data';

const ICONS: Record<DayKey, React.ComponentType<{ size?: number; className?: string }>> = {
  push: Zap, pull: ArrowDown, legs: Footprints,
};

export default function DaySelector({ suggested, dateLabel }: { suggested: DayKey; dateLabel: string }) {
  const days: DayKey[] = ['push', 'pull', 'legs'];
  return (
    <div className="px-5 py-6">
      <p className="text-[10px] uppercase tracking-widest text-text-dim">{dateLabel}</p>
      <h1 className="text-[28px] font-bold mt-2">今天練什麼？</h1>
      <p className="text-[13px] text-text-muted mt-1">選擇部位 — 菜單會根據你目前的 max 自動生成</p>
      <div className="mt-6 space-y-3">
        {days.map((d) => {
          const tpl = DAY_TEMPLATES[d];
          const Icon = ICONS[d];
          return (
            <Link key={d} href={`/today/workout/${d}`}
              className="flex items-center gap-4 rounded-2xl bg-surface border border-border p-5 active:bg-surface-2">
              <div className="w-[72px] h-[72px] rounded-2xl bg-surface-2 flex items-center justify-center">
                <Icon size={32} className="text-accent" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-[20px] font-bold">{tpl.label}</span>
                  {suggested === d && <span className="px-1.5 py-0.5 rounded bg-accent text-black text-[10px] font-bold tracking-wider">SUGGESTED</span>}
                </div>
                <div className="text-[12px] text-text-muted">{tpl.subtitle}</div>
              </div>
              <ChevronRight className="text-text-dim" />
            </Link>
          );
        })}
      </div>
    </div>
  );
}
