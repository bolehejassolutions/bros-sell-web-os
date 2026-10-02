import { authorizeCaseAccess, CASE_COLUMNS, CASE_TABLE, caseProjection, caseResponse, readCaseBody, unavailable } from '@/lib/sales-case-api';
import { isCaseDocument } from '@/lib/bros-sell/sales-case';

export async function GET(request: Request) {
  try {
    const access = await authorizeCaseAccess();
    if (!access.ok) return access.response;
    const page = Number(new URL(request.url).searchParams.get('page') ?? '0');
    if (!Number.isSafeInteger(page) || page < 0 || page > 10000) return caseResponse({ error: 'Halaman tidak sah.' }, 400);
    const { data, count, error } = await access.supabase.from(CASE_TABLE).select(CASE_COLUMNS, { count: 'exact' })
      .eq('owner_id', access.user.id).order('created_at', { ascending: false }).order('id', { ascending: false }).range(page * 100, page * 100 + 99);
    if (error || data?.some(row => !isCaseDocument(row.document))) return unavailable();
    return caseResponse({ cases: data ?? [], total: count ?? 0 });
  } catch { return unavailable(); }
}

export async function POST(request: Request) {
  try {
    const access = await authorizeCaseAccess();
    if (!access.ok) return access.response;
    let body;
    try { body = await readCaseBody(request); } catch { return caseResponse({ error: 'Data case tidak sah.' }, 400); }
    if (!isCaseDocument(body.document)) return caseResponse({ error: 'Situasi, tajuk atau bukti case tidak lengkap / tidak sah.' }, 400);
    const { data, error } = await access.supabase.from(CASE_TABLE).insert({ owner_id: access.user.id, ...caseProjection(body.document) }).select(CASE_COLUMNS).single();
    if (error || !data) return unavailable();
    return caseResponse({ case: data }, 201);
  } catch { return unavailable(); }
}
