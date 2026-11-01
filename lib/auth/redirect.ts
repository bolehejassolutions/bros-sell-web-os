// Authentication callbacks accept only root-relative destinations. Check the
// resolved origin too: URL parsing treats backslashes and stripped control
// characters as separators, so a startsWith('/') check alone is insufficient.
export function safeNextPath(value: string | null, requestOrigin: string) {
  if (!value || !value.startsWith('/') || value.startsWith('//')) return '/';
  try {
    const destination = new URL(value, requestOrigin);
    if (destination.origin !== requestOrigin || destination.username || destination.password) return '/';
  } catch {
    return '/';
  }
  // Preserve the validated input. Returning a normalized pathname beginning
  // with // would turn it into an external URL when the callback resolves it.
  return value;
}
