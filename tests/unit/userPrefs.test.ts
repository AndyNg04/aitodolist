import { describe, it, expect } from 'vitest';
import { getUserPreferences, updateUserPreferences } from '../../src/server/db/userPrefs';

describe('user preferences', () => {
  it('读取默认设置', () => {
    const prefs = getUserPreferences();
    expect(prefs.timezone).toBe('Australia/Sydney');
  });

  it('更新聚合窗口', () => {
    const prefs = updateUserPreferences({ aggregationWindowMin: 60 });
    expect(prefs.aggregationWindowMin).toBe(60);
  });
});
