import { authorizeCaseAccess, caseResponse } from '@/lib/sales-case-api';

// Never expose session tokens, customer resources, or entitlement internals.
// The existing server-side access guard is required before any offline sync.
export async function GET() {
  const access = await authorizeCaseAccess();
  if (!access.ok) return access.response;
  return caseResponse({ userId: access.user.id });
}
