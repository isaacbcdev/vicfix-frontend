/** Every form draft kept in localStorage starts with this prefix (never auth data). */
export const DRAFT_KEY_PREFIX = 'vicfix:draft:';

/** Removes all drafts. Called on explicit logout only — not on session expiry. */
export function clearDrafts(): void {
  try {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(DRAFT_KEY_PREFIX)) keys.push(key);
    }
    keys.forEach((key) => localStorage.removeItem(key));
  } catch {
    // Storage unavailable: nothing to clear.
  }
}
