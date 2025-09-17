'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import type { TaskRecord } from '../../../src/server/db/types';
import clsx from 'clsx';

interface Props {
  task: TaskRecord;
}

const priorityLabels: Record<TaskRecord['priority'], string> = {
  low: '低',
  med: '中',
  high: '高'
};

export function TaskCard({ task }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [priority, setPriority] = useState(task.priority);
  const [tagsInput, setTagsInput] = useState(task.tags.join(', '));

  async function mutate(patch: Record<string, unknown>) {
    await fetch(`/api/tasks/${task.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch)
    });
    startTransition(() => router.refresh());
  }

  const due = task.due ? new Date(task.due) : null;
  const dueLabel = due
    ? new Intl.DateTimeFormat('zh-CN', {
        hour: '2-digit',
        minute: '2-digit',
        month: 'short',
        day: 'numeric'
      }).format(due)
    : '未指定';

  const statusStyles: Record<TaskRecord['status'], string> = {
    TODO: 'bg-slate-800 text-slate-200',
    DOING: 'bg-indigo-800 text-indigo-100',
    DONE: 'bg-emerald-800 text-emerald-100'
  };

  return (
    <div
      className={clsx('border border-slate-800 rounded-lg p-4 space-y-3 bg-slate-900/60', isPending && 'opacity-70')}
      aria-busy={isPending}
    >
      <div className="flex items-center justify-between gap-4">
        <h3 className="text-lg font-semibold text-white">{task.title}</h3>
        <span className={clsx('px-2 py-1 rounded text-xs font-medium', statusStyles[task.status])}>{task.status}</span>
      </div>
      <p className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">{task.notes || '暂无备注'}</p>
      <div className="flex flex-wrap gap-3 text-xs text-slate-400">
        <span>截止：{dueLabel}</span>
        <span>灵活度：{task.flexibility}</span>
        <span>来源：{task.source === 'nlp' ? '模型解析' : '手动'}</span>
      </div>
      <div className="flex flex-wrap gap-4 items-center">
        <label className="text-xs text-slate-400">
          优先级
          <select
            className="ml-2 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-slate-100"
            value={priority}
            onChange={(event) => {
              const value = event.target.value as TaskRecord['priority'];
              setPriority(value);
              mutate({ priority: value });
            }}
          >
            {(['low', 'med', 'high'] as const).map((level) => (
              <option key={level} value={level}>
                {priorityLabels[level]}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs text-slate-400 flex items-center gap-2">
          标签
          <input
            className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-slate-100"
            value={tagsInput}
            onChange={(event) => setTagsInput(event.target.value)}
            onBlur={() => {
              const tags = tagsInput
                .split(',')
                .map((tag) => tag.trim())
                .filter(Boolean);
              mutate({ tags });
            }}
            placeholder="设计, 深度工作"
          />
        </label>
      </div>
      <div className="flex gap-2 text-xs">
        <button className="px-3 py-1 rounded border border-slate-700 hover:bg-slate-800" onClick={() => mutate({ status: 'TODO' })}>
          待处理
        </button>
        <button className="px-3 py-1 rounded border border-slate-700 hover:bg-slate-800" onClick={() => mutate({ status: 'DOING' })}>
          进行中
        </button>
        <button
          className="px-3 py-1 rounded border border-emerald-700 text-emerald-200 hover:bg-emerald-900/40"
          onClick={() => mutate({ status: 'DONE' })}
        >
          完成
        </button>
      </div>
      {task.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 text-xs text-primary">
          {task.tags.map((tag) => (
            <span key={tag} className="px-2 py-1 rounded-full bg-primary/10">
              #{tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
