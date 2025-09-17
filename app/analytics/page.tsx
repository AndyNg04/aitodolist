import { getSevenDayMetrics } from '../../src/server/db/metrics';
import { listAuditLogs } from '../../src/server/db/tasks';

export default function AnalyticsPage() {
  const metrics = getSevenDayMetrics();
  const logs = listAuditLogs(50);

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold text-white">评测面板</h1>
        <p className="text-sm text-slate-400">
          追踪七天内的关键 UX 指标，便于撰写研究报告。
        </p>
      </header>
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <h2 className="text-sm text-slate-400">完成率</h2>
          <p className="text-3xl font-semibold text-white">{(metrics.completionRate * 100).toFixed(1)}%</p>
          <p className="text-xs text-slate-500">样本：{metrics.totalCompleted}/{metrics.totalCreated}</p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <h2 className="text-sm text-slate-400">修改次数</h2>
          <p className="text-3xl font-semibold text-white">{metrics.modificationCount}</p>
          <p className="text-xs text-slate-500">包含任务字段的所有更新</p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <h2 className="text-sm text-slate-400">平均完成时长</h2>
          <p className="text-3xl font-semibold text-white">{metrics.averageCompletionMinutes.toFixed(1)} 分钟</p>
          <p className="text-xs text-slate-500">撤销率 {(metrics.reopenRate * 100).toFixed(1)}%</p>
        </div>
      </section>
      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-white">最近交互</h2>
        <div className="overflow-x-auto rounded-lg border border-slate-800">
          <table className="min-w-full text-sm text-left">
            <thead className="bg-slate-900/80 text-slate-400 uppercase text-xs tracking-wide">
              <tr>
                <th className="px-4 py-2">时间</th>
                <th className="px-4 py-2">动作</th>
                <th className="px-4 py-2">细节</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log, index) => (
                <tr key={index} className="border-t border-slate-800">
                  <td className="px-4 py-2 text-slate-300">{new Date(log.ts).toLocaleString('zh-CN')}</td>
                  <td className="px-4 py-2 text-slate-200">{log.action}</td>
                  <td className="px-4 py-2 text-slate-400">
                    <code className="text-xs bg-slate-900/60 px-2 py-1 rounded">{JSON.stringify(log.payload)}</code>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
