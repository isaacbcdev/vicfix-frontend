import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AuthService } from '@auth/auth-api';
import { CurrencyCopPipe } from '@shared/pipes/currency-cop.pipe';
import { ModalComponent } from '@shared/ui/modal/modal';
import { ConfirmDialogService } from '@shared/ui/confirm-dialog/confirm-dialog.service';
import { DebtsService } from './debts-api';
import { DebtEntry } from './debts.models';

const KIND_LABELS: Record<DebtEntry['debtKind'], string> = {
  CUSTOMER_CREDIT: 'Crédito cliente',
  PERSONAL_LOAN: 'Préstamo personal',
};

@Component({
  selector: 'app-debts-list',
  imports: [DatePipe, CurrencyCopPipe, FormsModule, ModalComponent],
  templateUrl: './debts-list.html',
})
export class DebtsListComponent implements OnInit {
  protected readonly auth = inject(AuthService);
  private readonly svc = inject(DebtsService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly confirmDialog = inject(ConfirmDialogService);

  protected debts = signal<DebtEntry[]>([]);
  protected loading = signal(false);
  protected error = signal<string | null>(null);
  protected resolvingId = signal<number | null>(null);
  protected deletingId = signal<number | null>(null);

  protected resolveModalOpen = signal(false);
  protected resolveTarget = signal<DebtEntry | null>(null);
  protected resolutionNote = signal('');

  ngOnInit(): void {
    this.loadDebts();
  }

  protected isAdminView(): boolean {
    return this.auth.hasAnyRole(['ROLE_ADMIN', 'ROLE_ROOT']);
  }

  protected loadDebts(): void {
    this.loading.set(true);
    this.error.set(null);
    const source$ = this.isAdminView() ? this.svc.getMonthly() : this.svc.getOutstanding();
    source$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (debts) => {
        this.debts.set(debts);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('No se pudieron cargar las deudas. Intenta de nuevo.');
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

  protected openResolveModal(debt: DebtEntry): void {
    this.resolveTarget.set(debt);
    this.resolutionNote.set('');
    this.resolveModalOpen.set(true);
  }

  protected closeResolveModal(): void {
    this.resolveModalOpen.set(false);
    this.resolveTarget.set(null);
  }

  protected confirmResolve(): void {
    this.resolveWithNote(this.resolutionNote().trim());
  }

  protected resolveWithoutNote(): void {
    this.resolveWithNote('');
  }

  private resolveWithNote(note: string): void {
    const debt = this.resolveTarget();
    if (!debt) return;

    this.resolveModalOpen.set(false);
    this.resolvingId.set(debt.id);
    this.error.set(null);
    this.svc
      .resolve(debt.id, { resolutionNote: note || null })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.resolvingId.set(null);
          this.resolveTarget.set(null);
          this.loadDebts();
        },
        error: () => {
          this.resolvingId.set(null);
          this.resolveTarget.set(null);
          this.error.set('No se pudo marcar la deuda como pagada. Intenta de nuevo.');
        },
      });
  }

  protected async deleteDebt(debt: DebtEntry): Promise<void> {
    const confirmed = await this.confirmDialog.confirm({
      title: 'Eliminar deuda',
      message:
        'Esta acción eliminará la deuda permanentemente. Úsala solo si fue creada por error — si ya fue pagada, usa "Marcar como pagada" en su lugar.',
      confirmLabel: 'Eliminar',
      variant: 'danger',
    });
    if (!confirmed) return;

    this.deletingId.set(debt.id);
    this.error.set(null);
    this.svc
      .delete(debt.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.deletingId.set(null);
          this.loadDebts();
        },
        error: () => {
          this.deletingId.set(null);
          this.error.set('No se pudo eliminar la deuda. Intenta de nuevo.');
        },
      });
  }
}
