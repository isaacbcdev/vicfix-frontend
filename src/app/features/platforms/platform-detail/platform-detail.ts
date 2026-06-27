import { Component, computed, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { AuthService } from '@auth/auth-api';
import { ModalComponent } from '@shared/ui/modal/modal';
import { CurrencyCopPipe } from '@shared/pipes/currency-cop.pipe';
import { ConfirmDialogService } from '@shared/ui/confirm-dialog/confirm-dialog.service';
import { PlatformsService } from '../platforms-api';
import { Platform, PlatformTransaction } from '../platforms.models';

function firstDayOfCurrentMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function nowDatetimeLocal(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function isoToDatetimeLocal(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const EXTRA_CHARGE_CODES = ['PTM', 'PUNTORED', 'REFACIL'];

@Component({
  selector: 'app-platform-detail',
  imports: [ReactiveFormsModule, DatePipe, CurrencyCopPipe, ModalComponent, RouterLink],
  templateUrl: './platform-detail.html',
})
export class PlatformDetailComponent implements OnInit {
  protected readonly auth = inject(AuthService);
  private readonly svc = inject(PlatformsService);
  private readonly confirmDialog = inject(ConfirmDialogService);
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  private platformId = signal(0);
  protected platform = signal<Platform | null>(null);
  protected transactions = signal<PlatformTransaction[]>([]);
  protected totalElements = signal(0);
  protected currentPage = signal(0);
  protected pageSize = signal(20);
  protected startDate = signal(firstDayOfCurrentMonth());
  protected endDate = signal(today());
  protected loading = signal(false);
  protected error = signal<string | null>(null);
  protected actionError = signal<string | null>(null);

  protected showTxModal = signal(false);
  protected submittingTx = signal(false);
  protected txError = signal<string | null>(null);

  protected editingTransaction = signal<PlatformTransaction | null>(null);
  protected showEditTxModal = signal(false);

  protected deletingTxId = signal<string | null>(null);

  protected showBalanceModal = signal(false);
  protected submittingBalance = signal(false);
  protected balanceError = signal<string | null>(null);

  protected readonly totalPages = computed(() => Math.ceil(this.totalElements() / this.pageSize()) || 1);

  protected readonly showExtraCharge = computed(() => {
    const code = this.platform()?.code ?? '';
    return EXTRA_CHARGE_CODES.includes(code);
  });

  protected readonly txModalTitle = computed(() => `Registrar transacción — ${this.platform()?.name ?? ''}`);
  protected readonly balanceModalTitle = computed(() => `Actualizar saldo — ${this.platform()?.name ?? ''}`);

  protected txForm = this.fb.group({
    transactionDate: [nowDatetimeLocal(), Validators.required],
    operation: ['', Validators.required],
    movementType: ['EXIT' as 'ENTRY' | 'EXIT', Validators.required],
    amount: [null as number | null, [Validators.required, Validators.min(1)]],
    commission: [0 as number | null],
    extraCharge: [null as number | null],
    phoneNumber: [''],
    notes: [''],
  });

  protected balanceForm = this.fb.group({
    currentBalance: [null as number | null, [Validators.required, Validators.min(0)]],
    minimumThreshold: [null as number | null],
  });

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.platformId.set(id);
    this.loadPlatform(id);
    this.loadTransactions();
  }

  private loadPlatform(id: number): void {
    this.svc
      .getPlatforms()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (list) => {
          this.platform.set(list.find((p) => p.id === id) ?? null);
        },
        error: () => {},
      });
  }

  protected loadTransactions(): void {
    const id = this.platformId();
    if (!id) return;
    this.loading.set(true);
    this.error.set(null);
    this.svc
      .getTransactions(
        id,
        this.currentPage(),
        this.pageSize(),
        this.startDate() || undefined,
        this.endDate() || undefined,
      )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (page) => {
          this.transactions.set(page.content);
          this.totalElements.set(page.page.totalElements);
          this.loading.set(false);
        },
        error: () => {
          this.error.set('No se pudieron cargar las transacciones. Intenta de nuevo.');
          this.loading.set(false);
        },
      });
  }

  protected onDateChange(field: 'start' | 'end', value: string): void {
    if (field === 'start') this.startDate.set(value);
    else this.endDate.set(value);
    this.currentPage.set(0);
    this.loadTransactions();
  }

  protected goToPage(page: number): void {
    this.currentPage.set(page);
    this.loadTransactions();
  }

  protected openTxModal(): void {
    this.txError.set(null);
    this.txForm.reset({
      transactionDate: nowDatetimeLocal(),
      operation: '',
      movementType: 'EXIT',
      amount: null,
      commission: 0,
      extraCharge: null,
      phoneNumber: '',
      notes: '',
    });
    this.showTxModal.set(true);
  }

  protected setMovementType(type: 'ENTRY' | 'EXIT'): void {
    this.txForm.patchValue({ movementType: type });
  }

  protected submitTx(): void {
    this.txForm.markAllAsTouched();
    if (this.txForm.invalid || this.submittingTx()) return;
    const id = this.platformId();
    if (!id) return;

    this.submittingTx.set(true);
    this.txError.set(null);
    const raw = this.txForm.getRawValue();
    const platform = this.platform();
    const balanceBefore = platform?.currentBalance ?? 0;
    const amount = Number(raw.amount);
    const balanceAfter =
      raw.movementType === 'ENTRY' ? balanceBefore + amount : balanceBefore - amount;

    const req = {
      platformId: id,
      transactionDate: new Date(raw.transactionDate!).toISOString(),
      operation: raw.operation!,
      movementType: raw.movementType!,
      amount: Number(raw.amount),
      balanceBefore: balanceBefore,
      balanceAfter: balanceAfter,
      ...(raw.commission != null && { commission: Number(raw.commission) }),
      ...(this.showExtraCharge() &&
        raw.extraCharge != null && { extraCharge: Number(raw.extraCharge) }),
      ...(raw.phoneNumber && { phoneNumber: raw.phoneNumber }),
      ...(raw.notes && { notes: raw.notes }),
    };

    this.svc
      .createTransaction(req)
      .pipe(finalize(() => this.submittingTx.set(false)))
      .subscribe({
        next: () => {
          this.showTxModal.set(false);
          this.currentPage.set(0);
          this.loadTransactions();
          this.loadPlatform(id);
        },
        error: (err) => {
          const msg = err?.error?.message as string | undefined;
          this.txError.set(msg ?? 'No se pudo registrar la transacción. Intenta de nuevo.');
        },
      });
  }

  protected openEditTxModal(tx: PlatformTransaction): void {
    this.editingTransaction.set(tx);
    this.txError.set(null);
    this.txForm.reset({
      transactionDate: isoToDatetimeLocal(tx.transactionDate),
      operation: tx.operation,
      movementType: tx.movementType,
      amount: tx.amount,
      commission: tx.commission,
      extraCharge: tx.extraCharge,
      phoneNumber: tx.phoneNumber ?? '',
      notes: tx.notes ?? '',
    });
    this.showEditTxModal.set(true);
  }

  protected submitEditTx(): void {
    this.txForm.markAllAsTouched();
    if (this.txForm.invalid || this.submittingTx()) return;
    const tx = this.editingTransaction();
    if (!tx) return;
    const id = this.platformId();

    this.submittingTx.set(true);
    this.txError.set(null);
    const raw = this.txForm.getRawValue();

    const req = {
      platformId: id,
      transactionDate: new Date(raw.transactionDate!).toISOString(),
      operation: raw.operation!,
      movementType: raw.movementType!,
      amount: Number(raw.amount),
      ...(raw.commission != null && { commission: Number(raw.commission) }),
      ...(this.showExtraCharge() &&
        raw.extraCharge != null && { extraCharge: Number(raw.extraCharge) }),
      ...(raw.phoneNumber && { phoneNumber: raw.phoneNumber }),
      ...(raw.notes && { notes: raw.notes }),
    };

    this.svc
      .updateTransaction(tx.id, req)
      .pipe(finalize(() => this.submittingTx.set(false)))
      .subscribe({
        next: () => {
          this.showEditTxModal.set(false);
          this.editingTransaction.set(null);
          this.loadTransactions();
          this.loadPlatform(id);
        },
        error: (err) => {
          const msg = err?.error?.message as string | undefined;
          this.txError.set(msg ?? 'No se pudo actualizar la transacción. Intenta de nuevo.');
        },
      });
  }

  protected async onDeleteTransaction(txId: string): Promise<void> {
    const confirmed = await this.confirmDialog.confirm({
      title: 'Eliminar transacción',
      message: '¿Eliminar esta transacción? El saldo de la plataforma no se ajustará automáticamente.',
      confirmLabel: 'Eliminar',
      variant: 'danger',
    });
    if (!confirmed) return;

    this.deletingTxId.set(txId);
    this.actionError.set(null);
    const platformId = this.platformId();

    this.svc
      .deleteTransaction(txId)
      .pipe(finalize(() => this.deletingTxId.set(null)))
      .subscribe({
        next: () => {
          this.loadTransactions();
          this.loadPlatform(platformId);
        },
        error: (err) => {
          const msg = err?.error?.message as string | undefined;
          this.actionError.set(msg ?? 'No se pudo eliminar la transacción. Intenta de nuevo.');
        },
      });
  }

  protected openBalanceModal(): void {
    const p = this.platform();
    if (!p) return;
    this.balanceError.set(null);
    this.balanceForm.reset({
      currentBalance: p.currentBalance,
      minimumThreshold: p.minimumThreshold,
    });
    this.showBalanceModal.set(true);
  }

  protected submitBalance(): void {
    this.balanceForm.markAllAsTouched();
    if (this.balanceForm.invalid || this.submittingBalance()) return;
    const id = this.platformId();
    if (!id) return;

    this.submittingBalance.set(true);
    this.balanceError.set(null);
    const raw = this.balanceForm.getRawValue();
    const threshold = raw.minimumThreshold != null ? Number(raw.minimumThreshold) : undefined;

    this.svc
      .updateBalance(id, {
        currentBalance: Number(raw.currentBalance),
        ...(threshold !== undefined && { minimumThreshold: threshold }),
      })
      .pipe(finalize(() => this.submittingBalance.set(false)))
      .subscribe({
        next: () => {
          this.showBalanceModal.set(false);
          this.loadPlatform(id);
        },
        error: (err) => {
          const msg = err?.error?.message as string | undefined;
          this.balanceError.set(msg ?? 'No se pudo actualizar el saldo. Intenta de nuevo.');
        },
      });
  }

  protected fe(ctrl: AbstractControl | null): boolean {
    return !!(ctrl?.invalid && ctrl.touched);
  }
}
