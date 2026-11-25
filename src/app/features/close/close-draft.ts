import { computed, DestroyRef, effect, inject, Injectable, signal } from '@angular/core';
import { AuthService } from '@auth/auth-api';
import { bogotaToday } from '@shared/utils/bogota-date';
import { DRAFT_KEY_PREFIX } from '@shared/utils/drafts';
import { NewDebtEntryRequest } from './close.models';
import { countTotal, DenominationQuantities } from './denomination-counter/denomination-counter';

/** A draft older than this (since its last save) is discarded on hydrate. */
export const DRAFT_TTL_MS = 12 * 60 * 60 * 1000;

const DRAFT_VERSION = 1;
const SAVE_DEBOUNCE_MS = 400;
const KEY_PREFIX = `${DRAFT_KEY_PREFIX}close:`;

/** A new-debt row as typed; `id` keeps rows stable across reloads and is stripped before POST. */
export interface DraftDebtRow extends NewDebtEntryRequest {
  id: string;
}

interface DraftData {
  closeDate: string;
  efectyReportedBalance: number | null;
  cashBase: number | null;
  notes: string;
  cashQuantities: DenominationQuantities;
  efectyQuantities: DenominationQuantities;
  newDebts: DraftDebtRow[];
}

interface StoredDraft extends DraftData {
  v: number;
  savedAt: number;
}

function keyFor(userId: number): string {
  return `${KEY_PREFIX}${userId}`;
}

function isQuantities(value: unknown): value is DenominationQuantities {
  return (
    typeof value === 'object' &&
    value !== null &&
    Object.values(value).every((n) => typeof n === 'number')
  );
}

function isNumberOrNull(value: unknown): value is number | null {
  return value === null || typeof value === 'number';
}

/** Parses a stored draft; anything malformed or from another schema version yields null. */
function parseDraft(raw: string): StoredDraft | null {
  const d = JSON.parse(raw) as Partial<StoredDraft> | null;
  if (
    !d ||
    d.v !== DRAFT_VERSION ||
    typeof d.savedAt !== 'number' ||
    typeof d.closeDate !== 'string' ||
    !isNumberOrNull(d.efectyReportedBalance) ||
    !isNumberOrNull(d.cashBase) ||
    typeof d.notes !== 'string' ||
    !isQuantities(d.cashQuantities) ||
    !isQuantities(d.efectyQuantities) ||
    !Array.isArray(d.newDebts) ||
    !d.newDebts.every((r) => typeof r?.id === 'string' && typeof r?.debtKind === 'string')
  ) {
    return null;
  }
  return d as StoredDraft;
}

/**
 * Typed state of the Cierre del Día form. Root-provided so it survives navigation, and
 * autosaved to localStorage (debounced) so it survives reloads and session expiry.
 * Only user input lives here — preview/API data is never persisted.
 *
 * One draft per user, keyed by user id. It expires DRAFT_TTL_MS after its last save
 * (not at midnight: closes sometimes happen after 00:00, or a day is skipped).
 */
@Injectable({ providedIn: 'root' })
export class CloseDraftStore {
  private readonly auth = inject(AuthService);

  readonly closeDate = signal(bogotaToday());
  readonly efectyReportedBalance = signal<number | null>(null);
  readonly cashBase = signal<number | null>(null);
  readonly notes = signal('');
  readonly cashQuantities = signal<DenominationQuantities>({});
  readonly efectyQuantities = signal<DenominationQuantities>({});
  readonly newDebts = signal<DraftDebtRow[]>([]);

  /** True when hydrate found typed input from an earlier visit. */
  readonly recovered = signal(false);

  /** cashBase alone isn't "typed content": preview prefills it. */
  readonly hasContent = computed(
    () =>
      countTotal(this.cashQuantities()) > 0 ||
      countTotal(this.efectyQuantities()) > 0 ||
      this.efectyReportedBalance() !== null ||
      this.notes().trim() !== '' ||
      this.newDebts().length > 0,
  );

  private readonly data = computed<DraftData>(() => ({
    closeDate: this.closeDate(),
    efectyReportedBalance: this.efectyReportedBalance(),
    cashBase: this.cashBase(),
    notes: this.notes(),
    cashQuantities: this.cashQuantities(),
    efectyQuantities: this.efectyQuantities(),
    newDebts: this.newDebts(),
  }));

  /** User whose draft is in memory; null until the first hydrate. */
  private owner: number | null = null;
  /** Serialized data last written to (or read from) storage, to skip no-op saves. */
  private lastWritten = '';
  private savedAt = 0;

  constructor() {
    effect((onCleanup) => {
      const data = this.data();
      const timer = setTimeout(() => this.persist(data), SAVE_DEBOUNCE_MS);
      onCleanup(() => clearTimeout(timer));
    });

    // A reload within the debounce window would otherwise lose the last keystrokes.
    const onPageHide = () => this.persist(this.data());
    window.addEventListener('pagehide', onPageHide);
    inject(DestroyRef).onDestroy(() => window.removeEventListener('pagehide', onPageHide));
  }

  /** Call on entering /close: loads the current user's draft and prunes expired ones. */
  hydrate(): void {
    const userId = this.auth.user()?.id ?? null;
    this.pruneExpired();
    this.recovered.set(false);
    if (userId === null) return;

    if (this.owner === userId) {
      // Same user, state still in memory (navigated away and back).
      const expired = Date.now() - this.savedAt > DRAFT_TTL_MS;
      if (this.hasContent() && (expired || this.wasRemovedExternally(userId))) {
        this.reset();
      } else {
        this.recovered.set(this.hasContent());
      }
      return;
    }

    // First visit, or a different user in the same tab: start fresh, then load their draft.
    this.reset();
    this.owner = userId;

    const stored = this.read(userId);
    if (!stored) return;
    this.closeDate.set(stored.closeDate);
    this.efectyReportedBalance.set(stored.efectyReportedBalance);
    this.cashBase.set(stored.cashBase);
    this.notes.set(stored.notes);
    this.cashQuantities.set(stored.cashQuantities);
    this.efectyQuantities.set(stored.efectyQuantities);
    this.newDebts.set(stored.newDebts);
    this.lastWritten = JSON.stringify(this.data());
    this.savedAt = stored.savedAt;
    this.recovered.set(this.hasContent());
  }

  /** Empties the form and removes the stored draft (successful submit, discard). */
  clear(): void {
    this.reset();
    if (this.owner !== null) this.remove(keyFor(this.owner));
  }

  private reset(): void {
    this.closeDate.set(bogotaToday());
    this.efectyReportedBalance.set(null);
    this.cashBase.set(null);
    this.notes.set('');
    this.cashQuantities.set({});
    this.efectyQuantities.set({});
    this.newDebts.set([]);
    this.recovered.set(false);
    this.lastWritten = JSON.stringify(this.data());
    this.savedAt = Date.now();
  }

  private persist(data: DraftData): void {
    // No user yet, or logged out: never write (a cleared draft must not reappear).
    if (this.owner === null || this.auth.user()?.id !== this.owner) return;
    const serialized = JSON.stringify(data);
    if (serialized === this.lastWritten) return;
    const key = keyFor(this.owner);
    this.lastWritten = serialized;
    this.savedAt = Date.now();
    if (!this.hasContent()) {
      this.remove(key);
      return;
    }
    const stored: StoredDraft = { v: DRAFT_VERSION, savedAt: this.savedAt, ...data };
    try {
      localStorage.setItem(key, JSON.stringify(stored));
    } catch {
      // Quota exceeded / storage disabled: the draft still lives in memory.
    }
  }

  /** Current user's draft, or null. Corrupt, wrong-version or expired drafts are deleted. */
  private read(userId: number): StoredDraft | null {
    const key = keyFor(userId);
    try {
      const raw = localStorage.getItem(key);
      if (raw === null) return null;
      const draft = parseDraft(raw);
      if (!draft || Date.now() - draft.savedAt > DRAFT_TTL_MS) {
        localStorage.removeItem(key);
        return null;
      }
      return draft;
    } catch {
      this.remove(key);
      return null;
    }
  }

  /**
   * Deletes expired close drafts of any user. A non-expired draft of another user is kept:
   * a cashier whose session expired must find it after someone else used /close.
   */
  private pruneExpired(): void {
    try {
      const expired: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!key?.startsWith(KEY_PREFIX)) continue;
        let savedAt: unknown;
        try {
          savedAt = (JSON.parse(localStorage.getItem(key) ?? 'null') as StoredDraft | null)?.savedAt;
        } catch {
          continue; // Corrupt: left for its owner's read(), which removes it.
        }
        if (typeof savedAt === 'number' && Date.now() - savedAt > DRAFT_TTL_MS) expired.push(key);
      }
      expired.forEach((key) => localStorage.removeItem(key));
    } catch {
      // Storage unavailable.
    }
  }

  /** Memory matches what was saved, but the key is gone: cleared by logout elsewhere. */
  private wasRemovedExternally(userId: number): boolean {
    if (JSON.stringify(this.data()) !== this.lastWritten) return false;
    try {
      return localStorage.getItem(keyFor(userId)) === null;
    } catch {
      return false;
    }
  }

  private remove(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch {
      // Storage unavailable.
    }
  }
}
