import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'MacroDeals',
  description: 'Budget-aware grocery deals and meal planning',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-white text-slate-900">{children}</body>
    </html>
  );
}
