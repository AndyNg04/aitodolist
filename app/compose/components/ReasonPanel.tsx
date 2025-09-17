'use client';

interface Props {
  rationale?: string;
}

export function ReasonPanel({ rationale }: Props) {
  if (!rationale) {
    return (
      <div className="border border-dashed border-slate-700 rounded-lg p-4 text-sm text-slate-400">
        模型的解析理由将显示在这里，帮助你理解字段来源。
      </div>
    );
  }
  const lines = rationale.split('\n');
  return (
    <div className="border border-slate-800 rounded-lg bg-slate-900/60 p-4 text-sm text-slate-200 space-y-2">
      <h3 className="text-xs uppercase tracking-widest text-slate-500">解析理由</h3>
      <ul className="list-disc list-inside space-y-1">
        {lines.map((line, index) => (
          <li key={index}>{line.replace(/^-\s*/, '')}</li>
        ))}
      </ul>
    </div>
  );
}
