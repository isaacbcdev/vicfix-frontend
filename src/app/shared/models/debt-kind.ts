/**
 * Single source of truth for how each debt kind is presented. The backend derives the
 * direction from the kind (PERSONAL_LOAN → OWED_BY_ME, CUSTOMER_CREDIT → OWED_TO_ME), so the
 * UI must always spell out who owes whom instead of showing a bare "deuda".
 */
export type DebtKindKey = 'CUSTOMER_CREDIT' | 'PERSONAL_LOAN';

export interface DebtKindMeta {
  /** Main label, e.g. badge text and section heading. */
  label: string;
  /** Direction clarifier shown next to the label. */
  hint: string;
  /** Tailwind classes for the kind badge. */
  badgeClass: string;
  /** Badge shown once the debt is settled. */
  paidBadge: string;
  /** Prefix for the settled date, e.g. "Pagado el 3 nov 2026". */
  paidOnPrefix: string;
  /** Action button / modal confirm label. */
  markPaidAction: string;
  /** Modal title. */
  markPaidTitle: string;
  /** Modal question; the amount is appended by the template. */
  markPaidQuestion: string;
}

export const DEBT_KINDS: Record<DebtKindKey, DebtKindMeta> = {
  CUSTOMER_CREDIT: {
    label: 'Crédito a cliente',
    hint: 'el cliente le debe al negocio',
    badgeClass: 'bg-emerald-100 text-emerald-700',
    paidBadge: 'Pagado por el cliente',
    paidOnPrefix: 'Pagado el',
    markPaidAction: 'Marcar como pagado',
    markPaidTitle: 'Marcar crédito como pagado',
    markPaidQuestion: '¿Confirmas que el cliente le pagó al negocio',
  },
  PERSONAL_LOAN: {
    label: 'Dinero inyectado al negocio',
    hint: 'el negocio te lo debe',
    badgeClass: 'bg-amber-100 text-amber-700',
    paidBadge: 'Devuelto al dueño',
    paidOnPrefix: 'Devuelto el',
    markPaidAction: 'Marcar como devuelto',
    markPaidTitle: 'Marcar como devuelto al dueño',
    markPaidQuestion: '¿Confirmas que el negocio le devolvió al dueño',
  },
};

/** Display order wherever kinds are grouped. */
export const DEBT_KIND_ORDER: DebtKindKey[] = ['CUSTOMER_CREDIT', 'PERSONAL_LOAN'];
