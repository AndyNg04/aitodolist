# LumiList · LLM 增强的 To-Do & 日程待办应用

LumiList 是围绕“透明、可控、低干扰”原则打造的自然语言任务管理工具。借助 Gemini API 的函数调用能力，将自由输入的任务描述解析为结构化字段，展示模型理由，并结合安静模式与提醒聚合策略，帮助你保持专注。

## ✨ 核心特性

- **自然语言录入**：在 `/compose` 输入中文任务，系统自动调用 `extract_task_intent` 工具解析标题、时间、优先级、提醒策略等字段并呈现解释。
- **可解释与可控**：解析卡片允许逐项调整字段，右侧面板展示模型的 `rationale`，冲突时可请求候选安排。
- **低打扰提醒**：依据用户偏好聚合提醒窗口，区分软提醒（静默标记）与硬提醒（弹窗/通知），并记录提醒日志。
- **冲突检测 & 候选建议**：静态规则结合现有任务与安静时段检测冲突，可调用 `suggest_schedule_adjustments` 生成 2~4 个替代方案。
- **评测面板**：`/analytics` 提供 7 日完成率、修改次数、撤销率、平均完成时长及审计日志，便于 UX 研究复盘。
- **设置中心**：`/settings` 管理工作时段、安静时间、提醒聚合窗口与默认提醒模式。

## 🧱 技术栈概览

| 层级 | 技术 |
| --- | --- |
| 前端 | Next.js 14 (App Router), React 18, Tailwind CSS |
| 服务端 | Next.js API Routes, better-sqlite3, Luxon, Zod |
| LLM | Gemini 1.5 Flash（函数调用，含本地回退解析） |
| 调度 | 自实现提醒聚合器（基于 setInterval） |
| 测试 | Vitest（单元 ≥ 20 条），Playwright（E2E 自然语言流程） |

## 📂 目录结构

```
app/                   # Next.js App Router 页面与组件
  (dashboard)/         # 仪表盘视图
  (settings)/          # 设置与勿扰中心
  compose/             # 自然语言录入流程
  analytics/           # 评测面板
app/api/               # API Routes（LLM 解析、任务 CRUD、评测等）
src/server/db/         # SQLite 封装、Schema、测试工具
src/server/llm/        # Gemini 客户端 & 工具实现
src/server/logic/      # 冲突检测、候选建议、时间工具
src/server/scheduling/ # 提醒聚合调度器
scripts/               # 数据库初始化、种子脚本
tests/                 # Vitest 单测 & Playwright 端到端
```

## ⚙️ 环境配置

1. 复制 `.env.example` 为 `.env` 并填写：
   ```bash
   cp .env.example .env
   ```
   - `GEMINI_API_KEY`：可选，缺省时走本地解析回退。
   - `APP_TZ`：默认 `Australia/Sydney`。
   - `CALENDAR_ENABLED`：保留为未来集成 Google Calendar。

2. 初始化与运行：
   ```bash
   make setup       # 安装依赖并初始化数据库
   make dev         # 启动开发模式（http://localhost:3000）
   ```

3. 常用命令：
   ```bash
   make seed        # 写入示例任务
   make test        # 运行 Vitest + Playwright
   make build       # 生产构建
   make start       # 生产模式启动
   ```

## 🔌 Gemini 函数调用

- `extract_task_intent`：解析自然语言为结构化任务，并返回 `rationale` 与冲突列表。
- `suggest_schedule_adjustments`：针对冲突生成 2-4 个备选时间窗口。
- 当 `GEMINI_API_KEY` 缺省或调用失败时，自动回退至基于 Chrono + 规则的本地解析逻辑，确保流程可离线运行。

### 调用时序概览

1. 前端调用 `/api/ai/parse` → `runExtractTaskIntent`（Gemini 或回退）。
2. 返回候选草稿 → 展示字段、理由、冲突。
3. 若冲突或用户点击“请求候选” → `/api/ai/suggest` → `runSuggestAdjustments`。
4. 用户确认后 `/api/tasks` → 写库（带审计日志） → 可选同步日历。
5. 提醒聚合器定时扫描 `remindPolicy`，批量写入 `reminder_log` 并触发通知。

## 🔁 数据模型摘要

- `tasks`：任务主体，含优先级、灵活度、提醒策略、来源等字段。
- `user_prefs`：工作时段、安静时间、默认提醒、聚合窗口、时区。
- `audit_log`：记录所有解析、候选、CRUD 操作以供评估。
- `reminder_log`：聚合提醒出队历史。

## 🧪 测试

- 单元测试（Vitest）覆盖解析、冲突检测、候选生成、提醒聚合、数据库 CRUD、指标统计、偏好更新、Gemini 回退等，合计 20+ 条。
- 端到端测试（Playwright）模拟自然语言录入 → 解析 → 保存 → 仪表盘验证。
- 所有测试可通过 `make test` 一键运行。

## 🛠️ 常见问题

- **解析结果与预期不符**：在候选卡片中直接修改字段或点击“请求候选”获取模型建议。
- **提醒未触发**：确认 `remindPolicy` 已配置且当前时间超过提醒点；聚合器每分钟轮询一次并在控制台打印 `[Reminder]` 日志。
- **Gemini 请求失败**：控制台会输出“Gemini 调用失败，使用本地解析”，此时流程仍可继续；补齐 API Key 后重启即可启用在线模型。

## 🗺️ 后续扩展

- Google Calendar OAuth 同步（占位模块 `src/server/integrations/googleCalendar/`）。
- CSV/ICS 批量导入、柔性区间调度器、可视化分析等可按需求拓展。

欢迎结合 HCI 研究需要自定义提示词、调优提醒策略，或扩展更多评价指标。
