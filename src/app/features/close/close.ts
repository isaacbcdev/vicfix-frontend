import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { CurrencyCopPipe } from '@shared/pipes/currency-cop.pipe';
import { DEBT_KIND_ORDER, DEBT_KINDS } from '@shared/models/debt-kind';
import { ConfirmDialogService } from '@shared/ui/confirm-dialog/confirm-dialog.service';
import { DailyCloseService } from './daily-close-api';
import { CloseDraftStore, DraftDebtRow } from './close-draft';
import {
  countTotal,
  DenominationCounterComponent,
  toCountRequests,
} from './denomination-counter/denomination-counter';
import {
  CreateDailyCloseRequest,
  DailyClose,
  DailyClosePreview,
  DebtEntry,
  DebtKind,
  NewDebtEntryRequest,
} from './close.models';

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
  private readonly draft = inject(CloseDraftStore);
  private readonly confirmDialog = inject(ConfirmDialogService);

  protected loadingPreview = signal(false);
  protected previewError = signal<string | null>(null);
  protected preview = signal<DailyClosePreview | null>(null);

  // Typed form state lives in the draft store (survives navigation and reloads).
  protected readonly closeDate = this.draft.closeDate;
  protected readonly efectyReportedBalance = this.draft.efectyReportedBalance;
  protected readonly cashBase = this.draft.cashBase;
  protected readonly notes = this.draft.notes;

  // Counting is mandatory: the backend derives cashCounted/efectyPileCounted from these.
  protected readonly cashQuantities = this.draft.cashQuantities;
  protected readonly efectyQuantities = this.draft.efectyQuantities;
  private readonly cashTotal = computed(() => countTotal(this.cashQuantities()));
  private readonly efectyTotal = computed(() => countTotal(this.efectyQuantities()));
  protected readonly bothCountsZero = computed(
    () => this.cashTotal() === 0 && this.efectyTotal() === 0,
  );

  protected readonly newDebts = this.draft.newDebts;

  protected readonly draftRecovered = this.draft.recovered;
  /** `dd/MM` of the recovered draft's close date. */
  protected readonly draftDateLabel = computed(() => {
    const [, month, day] = this.closeDate().split('-');
    return `${day}/${month}`;
  });

  protected readonly debtKinds = DEBT_KINDS;
  protected readonly debtKindOrder = DEBT_KIND_ORDER;

  // Rows live in one array (that's what the API takes) but render in one section per kind;
  // each row's stable `id` is used for update/remove.
  protected readonly newDebtsByKind = computed(() => {
    const groups: Record<DebtKind, DraftDebtRow[]> = { CUSTOMER_CREDIT: [], PERSONAL_LOAN: [] };
    for (const row of this.newDebts()) groups[row.debtKind].push(row);
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

  // Cash-denomination counters: General = cash pile, Efecty = Efecty pile.
  protected readonly counterTabs: { id: CounterId; label: string }[] = [
    { id: 'general', label: 'General' },
    { id: 'efecty', label: 'Efecty' },
  ];
  protected readonly activeCounter = signal<CounterId>('general');

  protected readonly efectyGapPreview = computed(
    () => this.efectyTotal() - (this.efectyReportedBalance() ?? 0),
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
    this.draft.hydrate();
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
          // Keep a base the cashier already typed (recovered draft); otherwise suggest one.
          if (this.cashBase() === null) this.cashBase.set(p.suggestedCashBase);
        },
        error: (err) => {
          const msg = err?.error?.message as string | undefined;
          this.previewError.set(msg ?? 'No se pudo cargar la vista previa.');
        },
      });
  }

  protected addDebtRow(debtKind: DebtKind): void {
    const row: DraftDebtRow = { id: crypto.randomUUID(), debtKind, amount: 0, description: '' };
    this.newDebts.set([...this.newDebts(), row]);
  }

  protected removeDebtRow(id: string): void {
    this.newDebts.set(this.newDebts().filter((r) => r.id !== id));
  }

  protected updateDebtRow(id: string, patch: Partial<NewDebtEntryRequest>): void {
    this.newDebts.set(this.newDebts().map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }

  protected async discardDraft(): Promise<void> {
    const confirmed = await this.confirmDialog.confirm({
      title: 'Descartar borrador',
      message: 'Se borrarán los conteos, saldos, notas y deudas que escribiste. Esta acción no se puede deshacer.',
      confirmLabel: 'Descartar',
      variant: 'danger',
    });
    if (!confirmed) return;
    this.draft.clear();
    const suggested = this.preview()?.suggestedCashBase;
    if (suggested !== undefined) this.cashBase.set(suggested);
  }

  protected submit(): void {
    if (this.submitting()) return;
    this.submitting.set(true);
    this.submitError.set(null);
    this.result.set(null);

    const req: CreateDailyCloseRequest = {
      closeDate: this.closeDate(),
      efectyReportedBalance: this.efectyReportedBalance() ?? 0,
      cashCounts: toCountRequests(this.cashQuantities()),
      efectyCounts: toCountRequests(this.efectyQuantities()),
      cashBase: this.cashBase(),
      notes: this.notes() || null,
      newDebts: this.newDebts().map(({ debtKind, amount, description }) => ({
        debtKind,
        amount,
        description,
      })),
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
          this.draft.clear();
        },
        error: (err) => {
          const msg = err?.error?.message as string | undefined;
          this.submitError.set(msg ?? 'No se pudo enviar el cierre. Intenta de nuevo.');
        },
      });
  }
}
