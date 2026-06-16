import { Component, computed, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { AuthService } from '@auth/auth-api';
import { ModalComponent } from '@shared/ui/modal/modal';
import { CurrencyCopPipe } from '@shared/pipes/currency-cop.pipe';
import { PlatformsService } from '../platforms.service';
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

const EXTRA_CHARGE_CODES = ['PTM', 'PUNTORED', 'REFACIL'];

@Component({
  selector: 'app-platform-detail',
  imports: [ReactiveFormsModule, DatePipe, CurrencyCopPipe, ModalComponent, RouterLink],
  templateUrl: './platform-detail.html',
})
export class PlatformDetailComponent implements OnInit {
  protected auth = inject(AuthService);
  private svc = inject(PlatformsService);
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private destroyRef = inject(DestroyRef);

  private platformId = signal(0);
  platform = signal<Platform | null>(null);
  transactions = signal<PlatformTransaction[]>([]);
  totalElements = signal(0);
  currentPage = signal(0);
  pageSize = signal(20);
  startDate = signal(firstDayOfCurrentMonth());
  endDate = signal(today());
  loading = signal(false);
  error = signal<string | null>(null);

  showTxModal = signal(false);
  submittingTx = signal(false);
  txError = signal<string | null>(null);

  showBalanceModal = signal(false);
  submittingBalance = signal(false);
  balanceError = signal<string | null>(null);

  totalPages = computed(() => Math.ceil(this.totalElements() / this.pageSize()) || 1);

  showExtraCharge = computed(() => {
    const code = this.platform()?.code ?? '';
    return EXTRA_CHARGE_CODES.includes(code);
  });

  txModalTitle = computed(() => `Registrar transacción — ${this.platform()?.name ?? ''}`);
  balanceModalTitle = computed(() => `Actualizar saldo — ${this.platform()?.name ?? ''}`);

  txForm = this.fb.group({
    transactionDate: [nowDatetimeLocal(), Validators.required],
    operation: ['', Validators.required],
    movementType: ['EXIT' as 'ENTRY' | 'EXIT', Validators.required],
    amount: [null as number | null, [Validators.required, Validators.min(1)]],
    balanceBefore: [null as number | null],
    balanceAfter: [null as number | null],
    commission: [0 as number | null],
    extraCharge: [null as number | null],
    phoneNumber: [''],
    notes: [''],
  });

  balanceForm = this.fb.group({
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

  loadTransactions(): void {
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

  onDateChange(field: 'start' | 'end', value: string): void {
    if (field === 'start') this.startDate.set(value);
    else this.endDate.set(value);
    this.currentPage.set(0);
    this.loadTransactions();
  }

  goToPage(page: number): void {
    this.currentPage.set(page);
    this.loadTransactions();
  }

  openTxModal(): void {
    this.txError.set(null);
    this.txForm.reset({
      transactionDate: nowDatetimeLocal(),
      operation: '',
      movementType: 'EXIT',
      amount: null,
      balanceBefore: null,
      balanceAfter: null,
      commission: 0,
      extraCharge: null,
      phoneNumber: '',
      notes: '',
    });
    this.showTxModal.set(true);
  }

  setMovementType(type: 'ENTRY' | 'EXIT'): void {
    this.txForm.patchValue({ movementType: type });
  }

  submitTx(): void {
    this.txForm.markAllAsTouched();
    if (this.txForm.invalid || this.submittingTx()) return;
    const id = this.platformId();
    if (!id) return;

    this.submittingTx.set(true);
    this.txError.set(null);
    const raw = this.txForm.getRawValue();

    const req = {
      platformId: id,
      transactionDate: raw.transactionDate!,
      operation: raw.operation!,
      movementType: raw.movementType!,
      amount: Number(raw.amount),
      ...(raw.balanceBefore != null && { balanceBefore: Number(raw.balanceBefore) }),
      ...(raw.balanceAfter != null && { balanceAfter: Number(raw.balanceAfter) }),
      ...(raw.commission != null && { commission: Number(raw.commission) }),
      ...(this.showExtraCharge() && raw.extraCharge != null && { extraCharge: Number(raw.extraCharge) }),
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

  openBalanceModal(): void {
    const p = this.platform();
    if (!p) return;
    this.balanceError.set(null);
    this.balanceForm.reset({
      currentBalance: p.currentBalance,
      minimumThreshold: p.minimumThreshold,
    });
    this.showBalanceModal.set(true);
  }

  submitBalance(): void {
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

  fe(ctrl: AbstractControl | null): boolean {
    return !!(ctrl?.invalid && ctrl.touched);
  }
}
