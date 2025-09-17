import { listByView } from '../../src/server/services/tasks';
import { TaskCard } from './components/TaskCard';
import { getSevenDayMetrics } from '../../src/server/db/metrics';

export default function DashboardPage() {
  const overdue = listByView('overdue');
  const today = listByView('today');
  const upcoming = listByView('upcoming');
  const metrics = getSevenDayMetrics();

  return (
    <div className="space-y-10">
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
          <h2 className="text-sm text-slate-400">7 天完成率</h2>
          <p className="text-3xl font-semibold text-white">
            {(metrics.completionRate * 100).toFixed(0)}%
          </p>
          <p className="text-xs text-slate-500 mt-2">
            {metrics.totalCompleted} / {metrics.totalCreated} 个任务已完成
          </p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
          <h2 className="text-sm text-slate-400">修改次数</h2>
          <p className="text-3xl font-semibold text-white">{metrics.modificationCount}</p>
          <p className="text-xs text-slate-500 mt-2">记录更改用于评估可控性</p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
          <h2 className="text-sm text-slate-400">平均完成时长</h2>
          <p className="text-3xl font-semibold text-white">
            {metrics.averageCompletionMinutes.toFixed(1)} 分钟
          </p>
          <p className="text-xs text-slate-500 mt-2">撤销率 {(metrics.reopenRate * 100).toFixed(0)}%</p>
        </div>
      </section>

      <section className="space-y-4">
        <header className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-white">今日聚焦</h2>
            <p className="text-sm text-slate-400">安静模式下仅显示高优先级提醒</p>
          </div>
        </header>
        {today.length === 0 ? (
          <div className="border border-dashed border-slate-700 rounded-xl p-8 text-slate-400 text-sm">
            今天暂无任务，试试在左侧导航进入“自然语言录入”创建新任务。
          </div>
        ) : (
          <div className="grid gap-3">
            {today.map((task) => (
              <TaskCard key={task.id} task={task} />
            ))}
          </div>
        )}
      </section>

      <section className="space-y-4">
        <header className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white">逾期待办</h2>
          <span className="text-sm text-slate-400">优先安排这些任务，必要时请求模型建议候选</span>
        </header>
        <div className="grid gap-3">
          {overdue.length === 0 ? (
            <div className="border border-dashed border-slate-800 rounded-xl p-6 text-slate-500 text-sm">
              所有任务都按时进行，做得好！
            </div>
          ) : (
            overdue.map((task) => <TaskCard key={task.id} task={task} />)
          )}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-white">即将到来</h2>
        <div className="grid gap-3">
          {upcoming.length === 0 ? (
            <div className="border border-dashed border-slate-800 rounded-xl p-6 text-slate-500 text-sm">
              未来七天暂无安排，保持专注或尝试添加练习任务。
            </div>
          ) : (
            upcoming.map((task) => <TaskCard key={task.id} task={task} />)
          )}
        </div>
      </section>
    </div>
  );
}
