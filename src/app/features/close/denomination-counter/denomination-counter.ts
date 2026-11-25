import { Component, computed, model } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CurrencyCopPipe } from '@shared/pipes/currency-cop.pipe';
import { DenominationCount, DenominationCountRequest } from '../close.models';

/** Standard Colombian peso denominations, bills then coins, high to low. */
export const COP_DENOMINATIONS = [
  100000, 50000, 20000, 10000, 5000, 2000, 1000, 500, 200, 100, 50,
] as const;

/** Quantity per denomination, as held by a counter. Missing keys mean 0. */
export type DenominationQuantities = Record<number, number>;

/** Display-only sum of a pile. The backend computes the persisted totals from the counts. */
export function countTotal(q: DenominationQuantities): number {
  return COP_DENOMINATIONS.reduce((sum, d) => sum + d * (q[d] ?? 0), 0);
}

/** Request payload for one pile; zero quantities are omitted (the backend treats them as 0). */
export function toCountRequests(q: DenominationQuantities): DenominationCountRequest[] {
  return COP_DENOMINATIONS.filter((d) => (q[d] ?? 0) > 0).map((d) => ({
    denomination: d,
    quantity: q[d],
  }));
}

/** Prefill a counter from a saved close's counts. */
export function fromCountDtos(counts: DenominationCount[] | null | undefined): DenominationQuantities {
  const q: DenominationQuantities = {};
  for (const c of counts ?? []) q[c.denomination] = c.quantity;
  return q;
}

/**
 * One physical cash-counting sheet: a quantity per denomination and a running total.
 * Quantities are a two-way `model()` so the parent can prefill them (edit) and read them
 * (submit) without events; the parent owns the state, so tab-switching never loses counts.
 */
@Component({
  selector: 'app-denomination-counter',
  imports: [FormsModule, CurrencyCopPipe],
  templateUrl: './denomination-counter.html',
})
export class DenominationCounterComponent {
  protected readonly denominations = COP_DENOMINATIONS;
  readonly quantities = model<DenominationQuantities>({});

  protected readonly grandTotal = computed(() => countTotal(this.quantities()));

  protected lineTotal(denom: number): number {
    return denom * (this.quantities()[denom] ?? 0);
  }

  protected setQuantity(denom: number, qty: number | null): void {
    const clean = qty != null && qty > 0 ? Math.floor(qty) : 0;
    this.quantities.set({ ...this.quantities(), [denom]: clean });
  }
}
