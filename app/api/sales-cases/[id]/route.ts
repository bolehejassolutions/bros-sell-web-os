import { authorizeCaseAccess, CASE_COLUMNS, CASE_TABLE, caseProjection, caseResponse, readCaseBody, unavailable, validCaseId } from '@/lib/sales-case-api';
import { isCaseDocument } from '@/lib/bros-sell/sales-case';

type Context = { params: Promise<{ id: string }> };
export async function PUT(request: Request, context: Context) {
  try {
    const access = await authorizeCaseAccess();
    if (!access.ok) return access.response;
    const { id } = await context.params;
    if (!validCaseId(id)) return caseResponse({ error: 'Case tidak ditemui.' }, 404);
    let body;
    try { body = await readCaseBody(request); } catch { return caseResponse({ error: 'Data case tidak sah.' }, 400); }
    if (!isCaseDocument(body.document) || !Number.isSafeInteger(body.revision) || Number(body.revision) < 1) return caseResponse({ error: 'Data atau versi case tidak sah.' }, 400);
    const { data, error } = await access.supabase.from(CASE_TABLE).update(caseProjection(body.document))
      .eq('owner_id', access.user.id).eq('id', id).eq('revision', body.revision).select(CASE_COLUMNS).maybeSingle();
    if (error) return unavailable();
    if (data) return caseResponse({ case: data });
    const { data: current, error: readError } = await access.supabase.from(CASE_TABLE).select('revision').eq('owner_id', access.user.id).eq('id', id).maybeSingle();
    if (readError) return unavailable();
    return current ? caseResponse({ error: 'Versi akaun telah berubah. Simpan salinan draft sebelum memuat semula.' }, 409) : caseResponse({ error: 'Case tidak ditemui.' }, 404);
  } catch { return unavailable(); }
}
