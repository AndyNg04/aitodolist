import { SettingsClient } from './components/SettingsClient';

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold text-white">设置与勿扰</h1>
        <p className="text-sm text-slate-400">自定义工作节奏、安静时段和提醒聚合策略，保持低干扰。</p>
      </header>
      <SettingsClient />
    </div>
  );
}
