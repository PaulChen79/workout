import TabBar from '@/components/TabBar';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh max-w-shell mx-auto pb-24 bg-bg">
      {children}
      <TabBar />
    </div>
  );
}
