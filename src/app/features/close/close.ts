import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { CurrencyCopPipe } from '@shared/pipes/currency-cop.pipe';
import { DEBT_KIND_ORDER, DEBT_KINDS } from '@shared/models/debt-kind';
import { DailyCloseService } from './daily-close-api';
import { DenominationCounterComponent } from './denomination-counter/denomination-counter';
import {
  DailyClose,
  DailyClosePreview,
  DebtEntry,
  DebtKind,
  NewDebtEntryRequest,
} from './close.models';

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export type StatSeverity = 'ok' | 'warning' | 'error';

type CounterId = 'general' | 'efecty';

/**
 * Diferencia/sobrante are cash-count mismatches in COP with no decimals — a few hundred
 * pesos is rounding noise, not a real discrepancy, so "ok" tolerates a small band around
 * zero rather than requiring an exact match.
 */
export function severityForBalance(value: number): StatSeverity {
  const abs = Math.abs(value);
  if (abs <= 1000) return 'ok';
  if (abs <= 10000) return 'warning';
  return 'error';
}

@Component({
  selector: 'app-close',
  imports: [FormsModule, CurrencyCopPipe, DenominationCounterComponent],
  templateUrl: './close.html',
})
export class CloseComponent implements OnInit {
  private readonly svc = inject(DailyCloseService);
  private readonly destroyRef = inject(DestroyRef);

  protected loadingPreview = signal(false);
  protected previewError = signal<string | null>(null);
  protected preview = signal<DailyClosePreview | null>(null);

  protected closeDate = signal(today());
  protected efectyReportedBalance = signal<number | null>(null);
  protected efectyPileCounted = signal<number | null>(null);
  protected cashCounted = signal<number | null>(null);
  protected cashBase = signal<number | null>(null);
  protected notes = signal('');

  protected showDenominationCounter = signal(false);

  protected newDebts = signal<NewDebtEntryRequest[]>([]);

  protected readonly debtKinds = DEBT_KINDS;
  protected readonly debtKindOrder = DEBT_KIND_ORDER;

  // Rows live in one array (that's what the API takes) but render in one section per kind;
  // `index` points back into `newDebts` for update/remove.
  protected readonly newDebtsByKind = computed(() => {
    const groups: Record<DebtKind, { row: NewDebtEntryRequest; index: number }[]> = {
      CUSTOMER_CREDIT: [],
      PERSONAL_LOAN: [],
    };
    this.newDebts().forEach((row, index) => groups[row.debtKind].push({ row, index }));
    return groups;
  });

  // Read-only: debts still open from previous closes, grouped like the new-debt sections.
  protected readonly outstandingByKind = computed(() => {
    const groups: Record<DebtKind, DebtEntry[]> = { CUSTOMER_CREDIT: [], PERSONAL_LOAN: [] };
    for (const d of this.preview()?.outstandingDebts ?? []) groups[d.debtKind].push(d);
    return groups;
  });

  protected submitting = signal(false);
  protected submitError = signal<string | null>(null);
  protected result = signal<DailyClose | null>(null);

  protected readonly headerDate = new Date()
    .toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    .replace(/^\p{L}/u, (c) => c.toUpperCase());

  // Cash-denomination counters (frontend-only; never persisted). The General counter drives
  // the `cashCounted` field; the Efecty counter drives the `efectyPileCounted` field.
  protected readonly counterTabs: { id: CounterId; label: string }[] = [
    { id: 'general', label: 'General' },
    { id: 'efecty', label: 'Efecty' },
  ];
  protected readonly activeCounter = signal<CounterId>('general');

  protected readonly efectyGapPreview = computed(
    () => (this.efectyPileCounted() ?? 0) - (this.efectyReportedBalance() ?? 0),
  );
  protected readonly efectyGapPreviewSeverity = computed<StatSeverity>(() =>
    severityForBalance(this.efectyGapPreview()),
  );

  protected readonly diferenciaSeverity = computed<StatSeverity>(() =>
    severityForBalance(this.result()?.diferencia ?? 0),
  );
  protected readonly efectyGapSeverity = computed<StatSeverity>(() =>
    severityForBalance(this.result()?.efectyGap ?? 0),
  );
  protected readonly sobranteRealSeverity = computed<StatSeverity>(() =>
    severityForBalance(this.result()?.sobranteReal ?? 0),
  );

  ngOnInit(): void {
    this.loadPreview();
  }

  private loadPreview(): void {
    this.loadingPreview.set(true);
    this.previewError.set(null);
    this.svc
      .getPreview()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.loadingPreview.set(false)),
      )
      .subscribe({
        next: (p) => {
          this.preview.set(p);
          this.cashBase.set(p.suggestedCashBase);
        },
        error: (err) => {
          const msg = err?.error?.message as string | undefined;
          this.previewError.set(msg ?? 'No se pudo cargar la vista previa.');
        },
      });
  }

  protected addDebtRow(debtKind: DebtKind): void {
    this.newDebts.set([...this.newDebts(), { debtKind, amount: 0, description: '' }]);
  }

  protected removeDebtRow(index: number): void {
    this.newDebts.set(this.newDebts().filter((_, i) => i !== index));
  }

  protected updateDebtRow(index: number, patch: Partial<NewDebtEntryRequest>): void {
    const rows = [...this.newDebts()];
    rows[index] = { ...rows[index], ...patch };
    this.newDebts.set(rows);
  }

  protected submit(): void {
    if (this.submitting()) return;
    this.submitting.set(true);
    this.submitError.set(null);
    this.result.set(null);

    const req = {
      closeDate: this.closeDate(),
      efectyReportedBalance: this.efectyReportedBalance() ?? 0,
      efectyPileCounted: this.efectyPileCounted() ?? 0,
      cashCounted: this.cashCounted() ?? 0,
      cashBase: this.cashBase(),
      notes: this.notes() || null,
      newDebts: this.newDebts(),
    };

    this.svc
      .submitClose(req)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.submitting.set(false)),
      )
      .subscribe({
        next: (res) => {
          this.result.set(res);
        },
        error: (err) => {
          const msg = err?.error?.message as string | undefined;
          this.submitError.set(msg ?? 'No se pudo enviar el cierre. Intenta de nuevo.');
        },
      });
  }
}
