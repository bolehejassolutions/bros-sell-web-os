import { timingSafeEqual } from 'node:crypto';
import { NextResponse } from 'next/server';
import { dispatchOnboarding } from '@/lib/onboarding/dispatch';

export const runtime = 'nodejs';
export const maxDuration = 120;

export async function POST(request: Request) {
  const secret = process.env.BROS_ONBOARDING_WORKER_SECRET;
  if (!secret || process.env.BROS_ONBOARDING_ENABLED !== 'true') {
    return NextResponse.json({ error: 'Onboarding unavailable.' }, { status: 503 });
  }
  const actual = Buffer.from(request.headers.get('authorization') ?? '');
  const expected = Buffer.from(`Bearer ${secret}`);
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }
  try {
    return NextResponse.json(await dispatchOnboarding());
  } catch {
    console.error('BROS SELL onboarding dispatch requires review.');
    return NextResponse.json({ error: 'Onboarding unavailable.' }, { status: 503 });
  }
}
