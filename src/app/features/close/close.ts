import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { CurrencyCopPipe } from '@shared/pipes/currency-cop.pipe';
import { DailyCloseService } from './daily-close-api';
import {
  DailyClose,
  DailyClosePreview,
  DebtKind,
  NewDebtEntryRequest,
  NewEfectyMovementRequest,
} from './close.models';

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export type StatSeverity = 'ok' | 'warning' | 'error';

/**
 * Diferencia/sobrante are cash-count mismatches in COP with no decimals — a few hundred
 * pesos is rounding noise, not a real discrepancy, so "ok" tolerates a small band around
 * zero rather than requiring an exact match.
 */
function severityForBalance(value: number): StatSeverity {
  const abs = Math.abs(value);
  if (abs <= 1000) return 'ok';
  if (abs <= 10000) return 'warning';
  return 'error';
}

/** Efecty float is informational (money already counted elsewhere), never itself an error. */
function severityForFloat(value: number): StatSeverity {
  return value <= 0 ? 'ok' : 'warning';
}

@Component({
  selector: 'app-close',
  imports: [FormsModule, CurrencyCopPipe, DatePipe],
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
  protected cashCounted = signal<number | null>(null);
  protected cashBase = signal<number | null>(null);
  protected notes = signal('');

  protected resolveEfectyMovementIds = signal<Set<number>>(new Set());
  protected resolveDebtIds = signal<Set<number>>(new Set());

  protected newEfectyMovements = signal<NewEfectyMovementRequest[]>([]);
  protected newDebts = signal<NewDebtEntryRequest[]>([]);

  protected submitting = signal(false);
  protected submitError = signal<string | null>(null);
  protected result = signal<DailyClose | null>(null);

  protected readonly headerDate = new Date()
    .toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    .replace(/^\p{L}/u, (c) => c.toUpperCase());

  protected readonly diferenciaSeverity = computed<StatSeverity>(() =>
    severityForBalance(this.result()?.diferencia ?? 0),
  );
  protected readonly efectyFlotanteSeverity = computed<StatSeverity>(() =>
    severityForFloat(this.result()?.efectyFlotante ?? 0),
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

  protected toggleEfectyMovement(id: number): void {
    const set = new Set(this.resolveEfectyMovementIds());
    if (set.has(id)) set.delete(id);
    else set.add(id);
    this.resolveEfectyMovementIds.set(set);
  }

  protected toggleDebt(id: number): void {
    const set = new Set(this.resolveDebtIds());
    if (set.has(id)) set.delete(id);
    else set.add(id);
    this.resolveDebtIds.set(set);
  }

  protected addEfectyMovementRow(): void {
    this.newEfectyMovements.set([
      ...this.newEfectyMovements(),
      { amount: 0, description: '' },
    ]);
  }

  protected removeEfectyMovementRow(index: number): void {
    this.newEfectyMovements.set(this.newEfectyMovements().filter((_, i) => i !== index));
  }

  protected addDebtRow(): void {
    this.newDebts.set([
      ...this.newDebts(),
      { debtKind: 'PERSONAL_LOAN' as DebtKind, amount: 0, description: '' },
    ]);
  }

  protected removeDebtRow(index: number): void {
    this.newDebts.set(this.newDebts().filter((_, i) => i !== index));
  }

  protected updateEfectyMovementRow(index: number, patch: Partial<NewEfectyMovementRequest>): void {
    const rows = [...this.newEfectyMovements()];
    rows[index] = { ...rows[index], ...patch };
    this.newEfectyMovements.set(rows);
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
      cashCounted: this.cashCounted() ?? 0,
      cashBase: this.cashBase(),
      notes: this.notes() || null,
      newEfectyMovements: this.newEfectyMovements(),
      resolveEfectyMovementIds: [...this.resolveEfectyMovementIds()],
      newDebts: this.newDebts(),
      resolveDebtIds: [...this.resolveDebtIds()],
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

  protected trackByIndex(index: number): number {
    return index;
  }
}
