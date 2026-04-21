'use client';
import { Home, TrendingUp } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';

export default function TabBar() {
  const path = usePathname();
  const router = useRouter();
  // Show only on /today and /progress
  if (!(path === '/today' || path === '/progress')) return null;
  const tabs = [
    { href: '/today', label: 'Today', icon: Home },
    { href: '/progress', label: '進度', icon: TrendingUp },
  ];
  return (
    <nav className="fixed bottom-0 left-0 right-0 mx-auto max-w-shell bg-bg border-t border-border"
      style={{ paddingBottom: 'calc(14px + env(safe-area-inset-bottom))' }}>
      <div className="flex h-14 pt-2">
        {tabs.map(({ href, label, icon: Icon }) => {
          const active = path === href;
          return (
            <button key={href} onClick={() => router.push(href)}
              className={`flex-1 flex flex-col items-center gap-0.5 ${active ? 'text-accent' : 'text-text-dim'}`}>
              <Icon size={22} strokeWidth={2} />
              <span className="text-[10px] font-semibold tracking-wider uppercase">{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
