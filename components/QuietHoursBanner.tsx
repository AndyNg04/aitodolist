'use client';

interface Props {
  conflicts: Array<{ type: string; detail: string }>;
  onRequestSuggestion?: () => void;
}

export function QuietHoursBanner({ conflicts, onRequestSuggestion }: Props) {
  if (!conflicts.length) return null;
  return (
    <div className="border border-amber-500/60 bg-amber-500/10 rounded-lg p-4 text-sm text-amber-200 space-y-2">
      <div className="font-semibold">检测到 {conflicts.length} 个冲突：</div>
      <ul className="list-disc list-inside space-y-1">
        {conflicts.map((conflict, index) => (
          <li key={`${conflict.type}-${index}`}>{conflict.detail}</li>
        ))}
      </ul>
      {onRequestSuggestion && (
        <button
          className="px-3 py-1 rounded bg-amber-500 text-slate-900 text-xs font-semibold"
          onClick={onRequestSuggestion}
        >
          生成候选安排
        </button>
      )}
    </div>
  );
}
