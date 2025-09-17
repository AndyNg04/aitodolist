import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Link from 'next/link';
import './globals.css';
import { ReactNode } from 'react';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'LumiList · LLM 增强的待办',
  description:
    'LumiList 以透明、可控、低干扰为原则构建，自然语言即可记录任务，并附带解释与提醒聚合。'
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="zh-Hans">
      <body className={`${inter.className} bg-slate-950 text-slate-100`}>
        <div className="min-h-screen grid grid-cols-[16rem_1fr]">
          <aside className="bg-slate-900 border-r border-slate-800 p-6 flex flex-col gap-6">
            <Link href="/" className="text-2xl font-semibold text-primary">
              LumiList
            </Link>
            <nav className="flex flex-col gap-3 text-sm text-slate-300">
              <Link href="/" className="hover:text-white transition-colors">
                仪表盘
              </Link>
              <Link href="/compose" className="hover:text-white transition-colors">
                自然语言录入
              </Link>
              <Link href="/settings" className="hover:text-white transition-colors">
                设置与勿扰
              </Link>
              <Link href="/analytics" className="hover:text-white transition-colors">
                评测面板
              </Link>
            </nav>
            <div className="mt-auto text-xs text-slate-500 leading-relaxed">
              <p>默认时区：Australia/Sydney</p>
              <p>模型会展示解析理由，所有操作均记录审计日志。</p>
            </div>
          </aside>
          <main className="p-8 overflow-y-auto">
            <div className="max-w-6xl mx-auto space-y-8">{children}</div>
          </main>
        </div>
      </body>
    </html>
  );
}
