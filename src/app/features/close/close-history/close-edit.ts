import { Component, DestroyRef, inject, input, linkedSignal, output, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { CurrencyCopPipe } from '@shared/pipes/currency-cop.pipe';
import { ModalComponent } from '@shared/ui/modal/modal';
import { DailyCloseService } from '../daily-close-api';
import { severityForBalance } from '../close';
import { DailyClose, UpdateDailyCloseRequest } from '../close.models';
import {
  DenominationCounterComponent,
  fromCountDtos,
  toCountRequests,
} from '../denomination-counter/denomination-counter';

type CounterId = 'general' | 'efecty';

/**
 * Admin edit of a saved close: Efecty reported balance, both denomination counts and notes.
 * Date, cash base, platform snapshot and debts are read-only (the backend rejects changing them).
 * Results shown after saving come from the PUT response — nothing is recomputed here.
 */
@Component({
  selector: 'app-close-edit',
  imports: [DatePipe, FormsModule, CurrencyCopPipe, ModalComponent, DenominationCounterComponent],
  templateUrl: './close-edit.html',
})
export class CloseEditComponent {
  private readonly svc = inject(DailyCloseService);
  private readonly destroyRef = inject(DestroyRef);

  readonly close = input.required<DailyClose>();
  readonly saved = output<DailyClose>();
  readonly closed = output<void>();

  protected readonly severityForBalance = severityForBalance;

  // Prefilled from the saved close; editable locally.
  protected readonly efectyReportedBalance = linkedSignal<number | null>(
    () => this.close().efectyReportedBalance,
  );
  protected readonly cashQuantities = linkedSignal(() => fromCountDtos(this.close().cashCounts));
  protected readonly efectyQuantities = linkedSignal(() => fromCountDtos(this.close().efectyCounts));
  // PUT is a full replacement: omitted notes are cleared, so always send the current value.
  protected readonly notes = linkedSignal(() => this.close().notes ?? '');

  protected readonly counterTabs: { id: CounterId; label: string }[] = [
    { id: 'general', label: 'General' },
    { id: 'efecty', label: 'Efecty' },
  ];
  protected readonly activeCounter = signal<CounterId>('general');

  protected readonly saving = signal(false);
  protected readonly saveError = signal<string | null>(null);
  protected readonly result = signal<DailyClose | null>(null);

  protected save(): void {
    if (this.saving()) return;
    this.saving.set(true);
    this.saveError.set(null);

    const req: UpdateDailyCloseRequest = {
      efectyReportedBalance: this.efectyReportedBalance() ?? 0,
      cashCounts: toCountRequests(this.cashQuantities()),
      efectyCounts: toCountRequests(this.efectyQuantities()),
      notes: this.notes().trim() || null,
    };

    this.svc
      .update(this.close().closeDate, req)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.saving.set(false)),
      )
      .subscribe({
        next: (updated) => {
          this.result.set(updated);
          this.saved.emit(updated);
        },
        error: (err) => {
          const msg = err?.error?.message as string | undefined;
          this.saveError.set(msg ?? 'No se pudo guardar el cierre. Intenta de nuevo.');
        },
      });
  }
}
