import { NextResponse } from 'next/server';
import { DateTime } from 'luxon';
import { runExtractTaskIntent } from '../../../../src/server/llm/geminiClient';
import { getUserPreferences } from '../../../../src/server/db/userPrefs';
import { logAudit } from '../../../../src/server/db/tasks';

export async function POST(request: Request) {
  const body = await request.json();
  if (!body?.text) {
    return NextResponse.json({ error: 'text is required' }, { status: 400 });
  }
  const prefs = getUserPreferences();
  const now = DateTime.now().setZone(prefs.timezone).toISO();
  const result = await runExtractTaskIntent({
    inputText: body.text,
    nowISO: now,
    timezone: prefs.timezone,
    userPrefs: prefs
  });
  logAudit('nlp.parse', { text: body.text, result: { title: result.title, due: result.due } });
  return NextResponse.json(result);
}
