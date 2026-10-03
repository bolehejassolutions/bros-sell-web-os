import { NextResponse } from 'next/server';
import { createClient } from './supabase/server';
import { hasWebOSAccess } from './supabase/entitlement';
import { diagnoseCase, type CaseDocument } from './bros-sell/sales-case';

export const CASE_TABLE = 'bros_sell_sales_cases';
export const CASE_COLUMNS = 'id,revision,created_at,updated_at,document';
export function caseResponse(data: unknown, status = 200) {
  return NextResponse.json(data, { status, headers: { 'Cache-Control': 'private, no-store' } });
}
export async function authorizeCaseAccess() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return { ok: false as const, response: caseResponse({ error: 'Log masuk diperlukan.' }, 401) };
  if (!(await hasWebOSAccess(supabase))) return { ok: false as const, response: caseResponse({ error: 'Akses BROS SELL aktif diperlukan.' }, 403) };
  return { ok: true as const, supabase, user };
}
export function caseProjection(document: CaseDocument) {
  const diagnosis = diagnoseCase(document);
  return { document, status: document.status, stage: diagnosis.stage, lead_state: diagnosis.leadState, next_action_at: document.dueAt };
}
export function unavailable() {
  return caseResponse({ error: 'Simpanan akaun belum tersedia. Data anda belum disimpan. Cuba lagi atau hubungi sokongan.' }, 503);
}
export async function readCaseBody(request: Request) {
  if (!request.headers.get('content-type')?.toLowerCase().startsWith('application/json')) throw new SyntaxError('JSON required');
  const raw = await request.text();
  if (raw.length > 220000) throw new SyntaxError('Case too large');
  const body = JSON.parse(raw);
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw new SyntaxError('Invalid case body');
  return body as Record<string, unknown>;
}
export function validCaseId(id: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
}
