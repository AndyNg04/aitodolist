import { NextRequest, NextResponse } from 'next/server';
import { searchTasks } from '../../../../src/server/services/tasks';

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get('q') ?? '';
  const tasks = searchTasks(query);
  return NextResponse.json({ tasks });
}
