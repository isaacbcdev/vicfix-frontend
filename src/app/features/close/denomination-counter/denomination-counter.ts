import { Component, computed, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CurrencyCopPipe } from '@shared/pipes/currency-cop.pipe';

/** Standard Colombian peso denominations, bills then coins, high to low. */
export const COP_DENOMINATIONS = [
  100000, 50000, 20000, 10000, 5000, 2000, 1000, 500, 200, 100, 50,
] as const;

/**
 * One physical cash-counting sheet: a quantity per denomination and a running total.
 * Owns its own quantities so tab-switching in the parent doesn't lose counts; emits the
 * grand total on every change so the parent can drive a form field or a delta display.
 */
@Component({
  selector: 'app-denomination-counter',
  imports: [FormsModule, CurrencyCopPipe],
  templateUrl: './denomination-counter.html',
})
export class DenominationCounterComponent {
  protected readonly denominations = COP_DENOMINATIONS;
  protected readonly quantities = signal<Record<number, number>>({});

  /** Recomputed grand total, emitted on every quantity change. */
  readonly totalChange = output<number>();

  protected readonly grandTotal = computed(() =>
    this.denominations.reduce((sum, d) => sum + d * (this.quantities()[d] ?? 0), 0),
  );

  protected lineTotal(denom: number): number {
    return denom * (this.quantities()[denom] ?? 0);
  }

  protected setQuantity(denom: number, qty: number | null): void {
    const clean = qty != null && qty > 0 ? Math.floor(qty) : 0;
    this.quantities.set({ ...this.quantities(), [denom]: clean });
    this.totalChange.emit(this.grandTotal());
  }
}
