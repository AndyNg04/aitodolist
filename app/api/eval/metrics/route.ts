import { NextResponse } from 'next/server';
import { getSevenDayMetrics } from '../../../../src/server/db/metrics';

export async function GET() {
  const metrics = getSevenDayMetrics();
  return NextResponse.json({ metrics });
}
