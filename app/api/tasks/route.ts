import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { listByView, createTaskFromIntent } from '../../../src/server/services/tasks';
import type { TaskInput } from '../../../src/server/db/types';

const reminderSchema = z.object({ offsetMin: z.number().int(), mode: z.enum(['silent', 'popup']) });
const createSchema = z.object({
  title: z.string().min(1),
  notes: z.string().optional(),
  status: z.enum(['TODO', 'DOING', 'DONE']).optional(),
  priority: z.enum(['low', 'med', 'high']).optional(),
  tags: z.array(z.string()).optional(),
  due: z.string().optional(),
  start: z.string().optional(),
  durationMin: z.number().int().positive().optional(),
  flexibility: z.enum(['strict', '±15m', '±30m', '±2h']).optional(),
  remindPolicy: z.array(reminderSchema).optional(),
  source: z.enum(['nlp', 'manual']).optional()
});

export async function GET(request: NextRequest) {
  const param = request.nextUrl.searchParams.get('view');
  const allowed = new Set(['today', 'upcoming', 'overdue']);
  const view = allowed.has(param ?? '') ? (param as 'today' | 'upcoming' | 'overdue') : 'all';
  const tasks = listByView(view);
  return NextResponse.json({ tasks });
}

export async function POST(request: NextRequest) {
  const payload = await request.json();
  const parsed = createSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.format() }, { status: 400 });
  }
  const record = createTaskFromIntent(parsed.data as TaskInput);
  return NextResponse.json(record);
}
