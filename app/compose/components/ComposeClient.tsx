'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ReasonPanel } from './ReasonPanel';
import { SuggestionCard } from './SuggestionCard';
import { QuietHoursBanner } from '../../../components/QuietHoursBanner';

interface DraftState {
  title: string;
  notes?: string;
  due?: string;
  start?: string;
  durationMin?: number;
  priority?: 'low' | 'med' | 'high';
  tags?: string[];
  flexibility?: 'strict' | '±15m' | '±30m' | '±2h';
  recurrence?: { rrule: string } | null;
  reminders?: Array<{ offsetMin: number; mode: 'silent' | 'popup' }>;
  conflicts?: Array<{ type: 'worktime' | 'quiet' | 'overlap'; detail: string }>;
  rationale: string;
}

type Suggestion = {
  start?: string;
  due?: string;
  durationMin?: number;
  flexibility?: 'strict' | '±15m' | '±30m' | '±2h';
  rationale: string;
};

const priorityOptions = [
  { value: 'low', label: '低' },
  { value: 'med', label: '中' },
  { value: 'high', label: '高' }
] as const;

const flexibilityOptions = ['strict', '±15m', '±30m', '±2h'] as const;

function isoToLocalInput(value?: string) {
  if (!value) return '';
  const date = new Date(value);
  const tzOffset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - tzOffset * 60 * 1000);
  return local.toISOString().slice(0, 16);
}

function localInputToISO(value: string | undefined) {
  if (!value) return undefined;
  const date = new Date(value);
  return date.toISOString();
}

export function ComposeClient() {
  const router = useRouter();
  const [text, setText] = useState('明天下午三点前交 CS 作业，优先级高，若冲突改到晚上七点后');
  const [draft, setDraft] = useState<DraftState | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function parseText() {
    try {
      setIsParsing(true);
      setError(null);
      const response = await fetch('/api/ai/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      });
      if (!response.ok) {
        throw new Error('解析失败');
      }
      const data = await response.json();
      setDraft(data);
      setSuggestions([]);
    } catch (err: any) {
      setError(err.message || '无法解析输入');
    } finally {
      setIsParsing(false);
    }
  }

  async function fetchSuggestions() {
    if (!draft) return;
    const payload = {
      draft: {
        start: draft.start,
        due: draft.due,
        durationMin: draft.durationMin,
        flexibility: draft.flexibility
      }
    };
    const response = await fetch('/api/ai/suggest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (response.ok) {
      const data = await response.json();
      setSuggestions(data);
    }
  }

  async function saveTask() {
    if (!draft) return;
    try {
      setIsSaving(true);
      const payload = {
        title: draft.title,
        notes: draft.notes,
        due: draft.due,
        start: draft.start,
        durationMin: draft.durationMin,
        priority: draft.priority,
        tags: draft.tags,
        flexibility: draft.flexibility,
        remindPolicy: draft.reminders,
        source: 'nlp'
      };
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!response.ok) {
        throw new Error('保存失败');
      }
      setDraft(null);
      setSuggestions([]);
      setText('');
      router.push('/');
      router.refresh();
    } catch (err: any) {
      setError(err.message || '保存失败');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold text-white">自然语言录入</h1>
        <p className="text-sm text-slate-400">
          输入想法即可自动解析任务。模型会展示提取的槽位与理由，你可以逐项确认再保存。
        </p>
      </header>

      <div className="space-y-3">
        <label className="text-xs uppercase tracking-widest text-slate-500">输入框</label>
        <textarea
          className="w-full min-h-[160px] rounded-lg border border-slate-800 bg-slate-950/60 p-4 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary/60"
          placeholder="例如：周五 5pm 前提交报告，高优先级，若冲突改晚上"
          value={text}
          onChange={(event) => setText(event.target.value)}
        />
        <div className="flex gap-2">
          <button
            className="px-4 py-2 rounded bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/80"
            onClick={parseText}
            disabled={isParsing}
          >
            {isParsing ? '解析中…' : '解析任务'}
          </button>
          <button
            className="px-4 py-2 rounded border border-slate-700 text-sm text-slate-200 hover:bg-slate-800"
            onClick={() => setDraft(null)}
          >
            清空
          </button>
        </div>
        {error && <p className="text-xs text-rose-400">{error}</p>}
      </div>

      {draft && (
        <div className="grid gap-6 md:grid-cols-[2fr_1fr]">
          <div className="space-y-4">
            <div className="border border-slate-800 rounded-lg bg-slate-900/60 p-4 space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <label className="text-xs text-slate-400 space-y-1">
                  标题
                  <input
                    className="w-full rounded border border-slate-700 bg-slate-950 px-2 py-1 text-slate-100"
                    value={draft.title}
                    onChange={(event) => setDraft({ ...draft, title: event.target.value })}
                  />
                </label>
                <label className="text-xs text-slate-400 space-y-1">
                  优先级
                  <select
                    className="w-full rounded border border-slate-700 bg-slate-950 px-2 py-1 text-slate-100"
                    value={draft.priority}
                    onChange={(event) =>
                      setDraft({ ...draft, priority: event.target.value as DraftState['priority'] })
                    }
                  >
                    {priorityOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-xs text-slate-400 space-y-1">
                  截止时间
                  <input
                    type="datetime-local"
                    className="w-full rounded border border-slate-700 bg-slate-950 px-2 py-1 text-slate-100"
                    value={isoToLocalInput(draft.due)}
                    onChange={(event) =>
                      setDraft({ ...draft, due: localInputToISO(event.target.value) })
                    }
                  />
                </label>
                <label className="text-xs text-slate-400 space-y-1">
                  开始时间
                  <input
                    type="datetime-local"
                    className="w-full rounded border border-slate-700 bg-slate-950 px-2 py-1 text-slate-100"
                    value={isoToLocalInput(draft.start)}
                    onChange={(event) =>
                      setDraft({ ...draft, start: localInputToISO(event.target.value) })
                    }
                  />
                </label>
                <label className="text-xs text-slate-400 space-y-1">
                  时长（分钟）
                  <input
                    type="number"
                    className="w-full rounded border border-slate-700 bg-slate-950 px-2 py-1 text-slate-100"
                    value={draft.durationMin ?? ''}
                    onChange={(event) =>
                      setDraft({ ...draft, durationMin: Number(event.target.value) || undefined })
                    }
                  />
                </label>
                <label className="text-xs text-slate-400 space-y-1">
                  灵活度
                  <select
                    className="w-full rounded border border-slate-700 bg-slate-950 px-2 py-1 text-slate-100"
                    value={draft.flexibility}
                    onChange={(event) =>
                      setDraft({ ...draft, flexibility: event.target.value as DraftState['flexibility'] })
                    }
                  >
                    {flexibilityOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <label className="text-xs text-slate-400 space-y-1 block">
                备注
                <textarea
                  className="w-full rounded border border-slate-700 bg-slate-950 px-2 py-1 text-sm text-slate-100"
                  value={draft.notes ?? ''}
                  onChange={(event) => setDraft({ ...draft, notes: event.target.value })}
                />
              </label>
              <label className="text-xs text-slate-400 space-y-1 block">
                标签（使用逗号分隔）
                <input
                  className="w-full rounded border border-slate-700 bg-slate-950 px-2 py-1 text-sm text-slate-100"
                  value={(draft.tags ?? []).join(', ')}
                  onChange={(event) =>
                    setDraft({
                      ...draft,
                      tags: event.target.value
                        .split(',')
                        .map((tag) => tag.trim())
                        .filter(Boolean)
                    })
                  }
                />
              </label>
              <div className="space-y-2">
                <h3 className="text-xs text-slate-400">提醒策略</h3>
                {(draft.reminders ?? []).map((reminder, index) => (
                  <div key={index} className="flex gap-3 text-xs text-slate-300 items-center">
                    <span>提前</span>
                    <input
                      type="number"
                      className="w-20 rounded border border-slate-700 bg-slate-950 px-2 py-1 text-sm text-slate-100"
                      value={reminder.offsetMin}
                      onChange={(event) => {
                        const value = Number(event.target.value);
                        const reminders = [...(draft.reminders ?? [])];
                        reminders[index] = { ...reminder, offsetMin: value };
                        setDraft({ ...draft, reminders });
                      }}
                    />
                    <span>分钟，以</span>
                    <select
                      className="rounded border border-slate-700 bg-slate-950 px-2 py-1 text-slate-100"
                      value={reminder.mode}
                      onChange={(event) => {
                        const reminders = [...(draft.reminders ?? [])];
                        reminders[index] = { ...reminder, mode: event.target.value as 'silent' | 'popup' };
                        setDraft({ ...draft, reminders });
                      }}
                    >
                      <option value="silent">软提醒</option>
                      <option value="popup">硬提醒</option>
                    </select>
                  </div>
                ))}
                {(draft.reminders ?? []).length === 0 && (
                  <button
                    className="text-xs text-primary"
                    onClick={() =>
                      setDraft({
                        ...draft,
                        reminders: [{ offsetMin: 30, mode: 'popup' }]
                      })
                    }
                  >
                    添加提醒
                  </button>
                )}
              </div>
            </div>

            <QuietHoursBanner conflicts={draft.conflicts ?? []} onRequestSuggestion={fetchSuggestions} />

            {suggestions.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm text-slate-300">候选安排</h3>
                <div className="grid gap-3 md:grid-cols-2">
                  {suggestions.map((suggestion, index) => (
                    <SuggestionCard
                      key={index}
                      suggestion={suggestion}
                      onApply={() =>
                        setDraft({
                          ...draft,
                          start: suggestion.start ?? draft.start,
                          due: suggestion.due ?? draft.due,
                          durationMin: suggestion.durationMin ?? draft.durationMin,
                          flexibility: suggestion.flexibility ?? draft.flexibility,
                          conflicts: []
                        })
                      }
                    />
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <button
                className="px-4 py-2 rounded bg-emerald-500 text-slate-900 font-semibold text-sm hover:bg-emerald-400"
                onClick={saveTask}
                disabled={isSaving}
              >
                {isSaving ? '保存中…' : '确认并保存'}
              </button>
              <button
                className="px-4 py-2 rounded border border-slate-700 text-sm text-slate-200 hover:bg-slate-800"
                onClick={fetchSuggestions}
              >
                请求候选
              </button>
            </div>
          </div>
          <ReasonPanel rationale={draft.rationale} />
        </div>
      )}
    </div>
  );
}
