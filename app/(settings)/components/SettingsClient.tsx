'use client';

import { useEffect, useState } from 'react';

interface UserPrefs {
  workHours: Record<string, { start: string; end: string }>;
  focusBlocks: Array<{ start: string; end: string; weekday: number }>;
  quietHours: Array<{ start: string; end: string }>;
  defaultReminder: { offsetMin: number; mode: 'silent' | 'popup' };
  aggregationWindowMin: number;
  timezone: string;
}

const weekdays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];

export function SettingsClient() {
  const [prefs, setPrefs] = useState<UserPrefs | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const response = await fetch('/api/user-prefs');
      const data = await response.json();
      setPrefs(data);
      setLoading(false);
    }
    load();
  }, []);

  async function save(newPrefs: Partial<UserPrefs>) {
    const response = await fetch('/api/user-prefs', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newPrefs)
    });
    if (response.ok) {
      const data = await response.json();
      setPrefs(data);
      setMessage('已更新');
      setTimeout(() => setMessage(null), 2500);
    }
  }

  if (loading || !prefs) {
    return <div className="text-sm text-slate-400">加载设置中…</div>;
  }

  return (
    <div className="space-y-6">
      <section className="border border-slate-800 rounded-lg bg-slate-900/60 p-4 space-y-3">
        <h2 className="text-lg font-semibold text-white">工作时段</h2>
        <p className="text-xs text-slate-400">用于检测冲突与提醒聚合。</p>
        <div className="grid md:grid-cols-2 gap-3 text-sm">
          {weekdays.map((day) => (
            <label key={day} className="flex items-center gap-3">
              <span className="w-20 capitalize">{day}</span>
              <input
                type="time"
                className="rounded border border-slate-700 bg-slate-950 px-2 py-1 text-slate-100"
                value={prefs.workHours[day]?.start ?? '09:00'}
                onChange={(event) => {
                  const workHours = { ...prefs.workHours, [day]: { ...prefs.workHours[day], start: event.target.value } };
                  const end = workHours[day].end ?? '18:00';
                  workHours[day] = { ...workHours[day], end };
                  setPrefs({ ...prefs, workHours });
                  save({ workHours });
                }}
              />
              <span>至</span>
              <input
                type="time"
                className="rounded border border-slate-700 bg-slate-950 px-2 py-1 text-slate-100"
                value={prefs.workHours[day]?.end ?? '18:00'}
                onChange={(event) => {
                  const workHours = { ...prefs.workHours, [day]: { ...prefs.workHours[day], end: event.target.value } };
                  const start = workHours[day].start ?? '09:00';
                  workHours[day] = { ...workHours[day], start };
                  setPrefs({ ...prefs, workHours });
                  save({ workHours });
                }}
              />
            </label>
          ))}
        </div>
      </section>

      <section className="border border-slate-800 rounded-lg bg-slate-900/60 p-4 space-y-3">
        <h2 className="text-lg font-semibold text-white">安静时间 & 聚合</h2>
        <div className="space-y-2 text-sm text-slate-300">
          {prefs.quietHours.map((range, index) => (
            <div key={index} className="flex items-center gap-2">
              <input
                type="time"
                className="rounded border border-slate-700 bg-slate-950 px-2 py-1 text-slate-100"
                value={range.start}
                onChange={(event) => {
                  const quietHours = [...prefs.quietHours];
                  quietHours[index] = { ...range, start: event.target.value };
                  setPrefs({ ...prefs, quietHours });
                  save({ quietHours });
                }}
              />
              <span>至</span>
              <input
                type="time"
                className="rounded border border-slate-700 bg-slate-950 px-2 py-1 text-slate-100"
                value={range.end}
                onChange={(event) => {
                  const quietHours = [...prefs.quietHours];
                  quietHours[index] = { ...range, end: event.target.value };
                  setPrefs({ ...prefs, quietHours });
                  save({ quietHours });
                }}
              />
              <button
                className="text-xs text-rose-300"
                onClick={() => {
                  const quietHours = prefs.quietHours.filter((_, i) => i !== index);
                  setPrefs({ ...prefs, quietHours });
                  save({ quietHours });
                }}
              >
                删除
              </button>
            </div>
          ))}
          <button
            className="text-xs text-primary"
            onClick={() => {
              const quietHours = [...prefs.quietHours, { start: '22:00', end: '07:00' }];
              setPrefs({ ...prefs, quietHours });
              save({ quietHours });
            }}
          >
            添加安静时段
          </button>
        </div>
        <div className="flex items-center gap-3 text-sm text-slate-300">
          <span>提醒聚合窗口（分钟）</span>
          <input
            type="number"
            className="w-24 rounded border border-slate-700 bg-slate-950 px-2 py-1 text-slate-100"
            value={prefs.aggregationWindowMin}
            onChange={(event) => {
              const aggregationWindowMin = Number(event.target.value);
              setPrefs({ ...prefs, aggregationWindowMin });
              save({ aggregationWindowMin });
            }}
          />
        </div>
      </section>

      <section className="border border-slate-800 rounded-lg bg-slate-900/60 p-4 space-y-3">
        <h2 className="text-lg font-semibold text-white">默认提醒</h2>
        <div className="flex items-center gap-3 text-sm text-slate-300">
          <span>提前</span>
          <input
            type="number"
            className="w-20 rounded border border-slate-700 bg-slate-950 px-2 py-1 text-slate-100"
            value={prefs.defaultReminder.offsetMin}
            onChange={(event) => {
              const offsetMin = Number(event.target.value);
              const defaultReminder = { ...prefs.defaultReminder, offsetMin };
              setPrefs({ ...prefs, defaultReminder });
              save({ defaultReminder });
            }}
          />
          <span>分钟，方式</span>
          <select
            className="rounded border border-slate-700 bg-slate-950 px-2 py-1 text-slate-100"
            value={prefs.defaultReminder.mode}
            onChange={(event) => {
              const defaultReminder = { ...prefs.defaultReminder, mode: event.target.value as 'silent' | 'popup' };
              setPrefs({ ...prefs, defaultReminder });
              save({ defaultReminder });
            }}
          >
            <option value="popup">硬提醒</option>
            <option value="silent">软提醒</option>
          </select>
        </div>
        <div className="text-xs text-slate-500">当前时区：{prefs.timezone}</div>
      </section>

      {message && <div className="text-xs text-emerald-300">{message}</div>}
    </div>
  );
}
