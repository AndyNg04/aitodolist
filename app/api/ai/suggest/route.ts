import { NextResponse } from 'next/server';
import { runSuggestAdjustments } from '../../../../src/server/llm/geminiClient';
import { logAudit } from '../../../../src/server/db/tasks';

export async function POST(request: Request) {
  const body = await request.json();
  if (!body?.draft) {
    return NextResponse.json({ error: 'draft is required' }, { status: 400 });
  }
  const result = await runSuggestAdjustments({ draft: body.draft });
  logAudit('nlp.suggest', { draft: body.draft, count: result.length });
  return NextResponse.json(result);
}
