import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getTask } from '../../../../src/server/db/tasks';
import { updateTaskWithAudit, deleteTaskWithAudit } from '../../../../src/server/services/tasks';

const updateSchema = z.object({
  title: z.string().optional(),
  notes: z.string().nullable().optional(),
  status: z.enum(['TODO', 'DOING', 'DONE']).optional(),
  priority: z.enum(['low', 'med', 'high']).optional(),
  tags: z.array(z.string()).optional(),
  due: z.string().nullable().optional(),
  start: z.string().nullable().optional(),
  durationMin: z.number().int().positive().nullable().optional(),
  flexibility: z.enum(['strict', '±15m', '±30m', '±2h']).optional(),
  remindPolicy: z.array(z.object({ offsetMin: z.number(), mode: z.enum(['silent', 'popup']) })).optional()
});

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const task = getTask(params.id);
  if (!task) {
    return NextResponse.json({ error: 'Task not found' }, { status: 404 });
  }
  return NextResponse.json(task);
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const payload = await request.json();
  const parsed = updateSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.format() }, { status: 400 });
  }
  const updated = updateTaskWithAudit(params.id, parsed.data);
  return NextResponse.json(updated);
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  deleteTaskWithAudit(params.id);
  return NextResponse.json({ ok: true });
}
