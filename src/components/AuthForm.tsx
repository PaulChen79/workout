'use client';
import { Dumbbell } from 'lucide-react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

type Mode = 'login' | 'register';

export default function AuthForm({ userCount }: { userCount: number }) {
  const [mode, setMode] = useState<Mode>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (mode === 'register' && password !== confirm) { setError('密碼不一致'); return; }
    setLoading(true);
    try {
      const res = await fetch(`/api/auth/${mode}`, {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ username: username.toLowerCase(), password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? '發生錯誤'); return; }
      router.push('/today');
      router.refresh();
    } finally { setLoading(false); }
  }

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-6 max-w-shell mx-auto">
      <div className="w-16 h-16 rounded-2xl bg-accent flex items-center justify-center mb-3.5">
        <Dumbbell className="text-black" size={32} strokeWidth={2.5} />
      </div>
      <h1 className="text-[28px] font-extrabold tracking-[-0.8px]">FORGE</h1>
      <p className="text-[11px] font-semibold tracking-[3px] text-text-dim mt-1">BUILT BY REPS</p>

      <div className="mt-12 w-full">
        <div className="flex p-1 h-[38px] rounded-xl bg-surface-2 border border-border-2">
          {(['login','register'] as Mode[]).map((m) => (
            <button key={m} type="button" onClick={() => setMode(m)}
              className={`flex-1 rounded-[10px] text-[13px] font-semibold transition
                ${mode === m ? 'bg-accent text-black' : 'text-[#888]'}`}>
              {m === 'login' ? '登入' : '註冊'}
            </button>
          ))}
        </div>

        <form onSubmit={submit} className="mt-5 space-y-3.5">
          <Field label="帳號" value={username} onChange={setUsername} />
          <Field label="密碼" type="password" value={password} onChange={setPassword} />
          {mode === 'register' && <Field label="確認密碼" type="password" value={confirm} onChange={setConfirm} />}
          {error && <div className="rounded-[10px] bg-red-500/10 border border-red-500/30 text-[12px] text-danger-light px-3 py-2.5">{error}</div>}
          <button type="submit" disabled={loading}
            className="w-full h-[54px] rounded-[14px] bg-accent text-black text-[15px] font-bold disabled:opacity-50">
            {loading ? '...' : mode === 'login' ? '登入' : '建立帳號'}
          </button>
        </form>
        <p className="text-[10px] text-text-dimmer text-center mt-6">
          資料僅儲存於此裝置 · 無需 email 驗證 · 已有 {userCount} 位使用者
        </p>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, type = 'text' }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <label className="block">
      <span className="block text-[10px] uppercase tracking-wider text-text-dim mb-1.5 font-semibold">{label}</span>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)}
        className="w-full h-[50px] rounded-xl bg-surface-2 border border-border-3 px-3.5 text-[15px] outline-none focus:border-accent" />
    </label>
  );
}
