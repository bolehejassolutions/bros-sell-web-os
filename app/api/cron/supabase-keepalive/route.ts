// Read-only Supabase activity for the Free plan. No customer records are returned.
// The endpoint is callable only by Vercel Cron with CRON_SECRET.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const PROJECT_URL = 'https://cyryoirzxpvummckegyh.supabase.co';
const PROBE_PATH = '/rest/v1/products?select=id&limit=1';

function noStore(status: number): Response {
  return new Response(null, {
    status,
    headers: { 'Cache-Control': 'no-store' },
  });
}

export async function GET(request: Request): Promise<Response> {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get('authorization') !== `Bearer ${secret}`) {
    return noStore(401);
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (url !== PROJECT_URL || !key) {
    console.error('Supabase keepalive: project environment is not configured');
    return noStore(503);
  }

  // Three small, independent queries per day; Supabase does not guarantee
  // that these prevent pausing, so keep monitoring the project's status.
  for (let i = 0; i < 3; i++) {
    try {
      const response = await fetch(`${PROJECT_URL}${PROBE_PATH}`, {
        method: 'GET',
        headers: { apikey: key, accept: 'application/json' },
        cache: 'no-store',
        signal: AbortSignal.timeout(8000),
      });
      if (!response.ok) {
        console.error('Supabase keepalive: database probe failed with HTTP', response.status);
        return noStore(503);
      }
      await response.body?.cancel();
    } catch {
      console.error('Supabase keepalive: database probe request failed');
      return noStore(503);
    }
  }

  console.info('Supabase keepalive: three read-only database probes passed');
  return noStore(204);
}
