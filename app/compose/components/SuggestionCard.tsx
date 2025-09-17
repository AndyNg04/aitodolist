'use client';

interface Props {
  suggestion: {
    start?: string;
    due?: string;
    durationMin?: number;
    flexibility?: 'strict' | '±15m' | '±30m' | '±2h';
    rationale: string;
  };
  onApply: () => void;
}

export function SuggestionCard({ suggestion, onApply }: Props) {
  return (
    <div className="border border-slate-800 rounded-lg bg-slate-900/70 p-4 space-y-2">
      <div className="text-sm text-slate-200">
        {suggestion.start && <p>开始：{new Date(suggestion.start).toLocaleString('zh-CN')}</p>}
        {suggestion.due && <p>截止：{new Date(suggestion.due).toLocaleString('zh-CN')}</p>}
        {suggestion.durationMin && <p>时长：{suggestion.durationMin} 分钟</p>}
        <p>灵活度：{suggestion.flexibility}</p>
      </div>
      <p className="text-xs text-slate-400 leading-relaxed">{suggestion.rationale}</p>
      <button
        className="px-3 py-1 rounded bg-primary text-primary-foreground text-sm hover:bg-primary/80"
        onClick={onApply}
      >
        应用此安排
      </button>
    </div>
  );
}
