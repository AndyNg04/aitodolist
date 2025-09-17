import { describe, it, expect } from 'vitest';
import { runExtractTaskIntent } from '../../src/server/llm/geminiClient';
import { DateTime } from 'luxon';

const timezone = 'Australia/Sydney';

describe('Gemini client fallback', () => {
  it('在无 API Key 时返回本地解析', async () => {
    delete process.env.GEMINI_API_KEY;
    const result = await runExtractTaskIntent({
      inputText: '明天早上九点团队站会',
      nowISO: DateTime.fromISO('2024-05-20T08:00:00', { zone: timezone }).toISO(),
      timezone
    });
    expect(result.title).toContain('团队站会');
  });
});
