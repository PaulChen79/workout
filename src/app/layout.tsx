import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', weight: ['400','500','600','700','800'] });
const jet = JetBrains_Mono({ subsets: ['latin'], variable: '--font-jet', weight: ['400','500','600','700'] });

export const metadata: Metadata = { title: 'FORGE', description: 'Built by reps' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${jet.variable}`}>
      <body>{children}</body>
    </html>
  );
}
