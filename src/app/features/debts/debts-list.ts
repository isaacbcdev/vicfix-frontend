import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AuthService } from '@auth/auth-api';
import { CurrencyCopPipe } from '@shared/pipes/currency-cop.pipe';
import { ConfirmDialogService } from '@shared/ui/confirm-dialog/confirm-dialog.service';
import { DebtsService } from './debts-api';
import { DebtEntry } from './debts.models';

const KIND_LABELS: Record<DebtEntry['debtKind'], string> = {
  CUSTOMER_CREDIT: 'Crédito cliente',
  PERSONAL_LOAN: 'Préstamo personal',
};

@Component({
  selector: 'app-debts-list',
  imports: [DatePipe, CurrencyCopPipe],
  templateUrl: './debts-list.html',
})
export class DebtsListComponent implements OnInit {
  protected readonly auth = inject(AuthService);
  private readonly svc = inject(DebtsService);
  private readonly confirmDialog = inject(ConfirmDialogService);
  private readonly destroyRef = inject(DestroyRef);

  protected debts = signal<DebtEntry[]>([]);
  protected loading = signal(false);
  protected error = signal<string | null>(null);
  protected resolvingId = signal<number | null>(null);

  ngOnInit(): void {
    this.loadDebts();
  }

  protected loadDebts(): void {
    this.loading.set(true);
    this.error.set(null);
    this.svc
      .getOutstanding()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (debts) => {
          this.debts.set(debts);
          this.loading.set(false);
        },
        error: () => {
          this.error.set('No se pudieron cargar las deudas pendientes. Intenta de nuevo.');
          this.loading.set(false);
        },
      });
  }

  protected kindLabel(kind: DebtEntry['debtKind']): string {
    return KIND_LABELS[kind];
  }

  protected canResolve(): boolean {
    return this.auth.hasAnyRole(['ROLE_ADMIN', 'ROLE_ROOT']);
  }

  protected async onResolve(debt: DebtEntry): Promise<void> {
    const confirmed = await this.confirmDialog.confirm({
      title: 'Marcar deuda como pagada',
      message: `¿Marcar esta ${this.kindLabel(debt.debtKind).toLowerCase()} como pagada? Esta acción no se puede deshacer.`,
      confirmLabel: 'Marcar como pagada',
      variant: 'default',
    });
    if (!confirmed) return;

    this.resolvingId.set(debt.id);
    this.error.set(null);
    this.svc
      .resolve(debt.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.resolvingId.set(null);
          this.loadDebts();
        },
        error: () => {
          this.resolvingId.set(null);
          this.error.set('No se pudo marcar la deuda como pagada. Intenta de nuevo.');
        },
      });
  }
}
