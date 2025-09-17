import { describe, it, expect } from 'vitest';
import { extractTaskIntent } from '../../src/server/llm/tools';
import { createTask } from '../../src/server/db/tasks';
import { getUserPreferences } from '../../src/server/db/userPrefs';
import { DateTime } from 'luxon';

const timezone = 'Australia/Sydney';

describe('extractTaskIntent', () => {
  it('解析截止时间与标题', () => {
    const now = DateTime.fromISO('2024-05-20T09:00:00', { zone: timezone });
    const result = extractTaskIntent({
      inputText: '明天上午十点提交设计稿',
      nowISO: now.toISO(),
      timezone
    });
    expect(result.title).toContain('提交设计稿');
    expect(result.due).toBeTruthy();
    expect(DateTime.fromISO(result.due ?? '', { zone: timezone }).hour).toBe(10);
  });

  it('识别高优先级', () => {
    const now = DateTime.fromISO('2024-05-20T09:00:00', { zone: timezone });
    const result = extractTaskIntent({
      inputText: '今天下午三点前交报告，高优先级',
      nowISO: now.toISO(),
      timezone
    });
    expect(result.priority).toBe('high');
  });

  it('提取标签与默认提醒', () => {
    const now = DateTime.fromISO('2024-05-20T09:00:00', { zone: timezone });
    const result = extractTaskIntent({
      inputText: '周五上午十点 #研究 回顾 UX 数据',
      nowISO: now.toISO(),
      timezone
    });
    expect(result.tags).toContain('研究');
    expect(result.reminders?.length).toBeGreaterThan(0);
  });

  it('识别提醒偏好', () => {
    const now = DateTime.fromISO('2024-05-20T09:00:00', { zone: timezone });
    const result = extractTaskIntent({
      inputText: '周二 14:00 开会，提前15分钟静默提醒',
      nowISO: now.toISO(),
      timezone
    });
    expect(result.reminders?.[0]).toMatchObject({ offsetMin: 15, mode: 'silent' });
  });

  it('检测与既有任务的重叠冲突', () => {
    const prefs = getUserPreferences();
    const existing = createTask({
      title: '测试任务',
      due: DateTime.now().setZone(timezone).plus({ hours: 2 }).toISO(),
      start: DateTime.now().setZone(timezone).plus({ hours: 1 }).toISO(),
      durationMin: 60
    });
    const now = DateTime.fromISO(existing.start ?? '', { zone: timezone }).minus({ hours: 2 });
    const result = extractTaskIntent({
      inputText: '今天' + DateTime.fromISO(existing.start ?? '', { zone: timezone }).toFormat('HH:mm') + ' 讨论事项',
      nowISO: now.toISO(),
      timezone,
      userPrefs: prefs
    });
    expect(result.conflicts?.some((conflict) => conflict.type === 'overlap')).toBe(true);
  });
});
