import { Component, computed, DestroyRef, inject, LOCALE_ID, OnInit, signal } from '@angular/core';
import { DatePipe, formatDate } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AuthService } from '@auth/auth-api';
import { CurrencyCopPipe } from '@shared/pipes/currency-cop.pipe';
import { ConfirmDialogService } from '@shared/ui/confirm-dialog/confirm-dialog.service';
import { DEBT_KINDS } from '@shared/models/debt-kind';
import { DailyCloseService } from '../daily-close-api';
import { severityForBalance } from '../close';
import { DailyClose, DenominationCount } from '../close.models';
import { CloseEditComponent } from './close-edit';

/** Local (not UTC) current month as `YYYY-MM`, matching `<input type="month">`. */
function currentMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function hasNoCounts(counts: DenominationCount[] | null | undefined): boolean {
  return (counts ?? []).every((c) => c.quantity === 0);
}

@Component({
  selector: 'app-close-history',
  imports: [DatePipe, FormsModule, CurrencyCopPipe, CloseEditComponent],
  templateUrl: './close-history.html',
})
export class CloseHistoryComponent implements OnInit {
  private readonly svc = inject(DailyCloseService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly auth = inject(AuthService);
  private readonly confirmDialog = inject(ConfirmDialogService);
  private readonly locale = inject(LOCALE_ID);

  protected readonly severityForBalance = severityForBalance;
  protected readonly debtKinds = DEBT_KINDS;

  protected closes = signal<DailyClose[]>([]);
  protected loading = signal(false);
  protected error = signal<string | null>(null);
  protected expandedId = signal<number | null>(null);
  protected deletingId = signal<number | null>(null);
  protected editing = signal<DailyClose | null>(null);

  // GET /daily-close returns every close; filter by month client-side for now.
  protected month = signal(currentMonth());
  protected readonly filteredCloses = computed(() => {
    const month = this.month();
    return month ? this.closes().filter((c) => c.closeDate.startsWith(month)) : this.closes();
  });
  protected readonly monthLabel = computed(() =>
    this.month() ? formatDate(`${this.month()}-01T00:00:00`, 'MMMM y', this.locale) : '',
  );

  ngOnInit(): void {
    this.loadCloses();
  }

  protected loadCloses(): void {
    this.loading.set(true);
    this.error.set(null);
    this.svc
      .getAll()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (closes) => {
          this.closes.set(closes);
          this.loading.set(false);
        },
        error: () => {
          this.error.set('No se pudo cargar el historial de cierres. Intenta de nuevo.');
          this.loading.set(false);
        },
      });
  }

  protected toggleExpanded(id: number): void {
    this.expandedId.set(this.expandedId() === id ? null : id);
  }

  /**
   * Closes saved before denomination counts existed (V20) have totals but all-zero counts.
   * Editing them would replace the original totals with a recount that can't be done anymore.
   */
  protected isPreCountClose(c: DailyClose): boolean {
    return (
      (c.cashCounted > 0 && hasNoCounts(c.cashCounts)) ||
      (c.efectyPileCounted > 0 && hasNoCounts(c.efectyCounts))
    );
  }

  protected onSaved(updated: DailyClose): void {
    this.closes.set(this.closes().map((c) => (c.id === updated.id ? updated : c)));
    this.editing.set(updated);
  }

  protected canDelete(): boolean {
    return this.auth.hasAnyRole(['ROLE_ADMIN', 'ROLE_ROOT']);
  }

  protected async deleteClose(close: DailyClose): Promise<void> {
    const formattedDate = formatDate(close.closeDate, 'd MMM y', this.locale);
    const confirmed = await this.confirmDialog.confirm({
      title: 'Eliminar cierre',
      message: `Esta acción eliminará el cierre del ${formattedDate} permanentemente. Las deudas creadas ese día se conservarán, pero perderán la referencia a este cierre.`,
      confirmLabel: 'Eliminar',
      variant: 'danger',
    });
    if (!confirmed) return;

    this.deletingId.set(close.id);
    this.error.set(null);
    this.svc
      .delete(close.closeDate)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.deletingId.set(null);
          this.loadCloses();
        },
        error: () => {
          this.deletingId.set(null);
          this.error.set('No se pudo eliminar el cierre. Intenta de nuevo.');
        },
      });
  }
}
