import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getUserPreferences, updateUserPreferences } from '../../../src/server/db/userPrefs';

const prefsSchema = z.object({
  workHours: z.record(z.object({ start: z.string(), end: z.string() })).optional(),
  focusBlocks: z.array(z.object({ start: z.string(), end: z.string(), weekday: z.number().int().min(0).max(6) })).optional(),
  quietHours: z.array(z.object({ start: z.string(), end: z.string() })).optional(),
  defaultReminder: z.object({ offsetMin: z.number().int(), mode: z.enum(['silent', 'popup']) }).optional(),
  aggregationWindowMin: z.number().int().min(5).max(240).optional(),
  timezone: z.string().optional()
});

export async function GET() {
  const prefs = getUserPreferences();
  return NextResponse.json(prefs);
}

export async function PATCH(request: NextRequest) {
  const payload = await request.json();
  const parsed = prefsSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.format() }, { status: 400 });
  }
  const prefs = updateUserPreferences(parsed.data);
  return NextResponse.json(prefs);
}
