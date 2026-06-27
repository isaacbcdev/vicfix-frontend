import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { AuthService } from '@auth/auth-api';
import { ModalComponent } from '@shared/ui/modal/modal';
import { CurrencyCopPipe } from '@shared/pipes/currency-cop.pipe';
import { PlatformsService } from './platforms-api';
import { EfectyDailyClose, Platform } from './platforms.models';

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

@Component({
  selector: 'app-platforms',
  imports: [ReactiveFormsModule, DatePipe, CurrencyCopPipe, ModalComponent, RouterLink],
  templateUrl: './platforms.html',
})
export class PlatformsComponent implements OnInit {
  protected readonly auth = inject(AuthService);
  private readonly svc = inject(PlatformsService);
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);

  protected platforms = signal<Platform[]>([]);
  protected loading = signal(false);
  protected error = signal<string | null>(null);
  protected editingPlatform = signal<Platform | null>(null);
  protected showBalanceModal = signal(false);
  protected showEfectyModal = signal(false);
  protected latestEfectyClose = signal<EfectyDailyClose | null>(null);

  protected submittingBalance = signal(false);
  protected submittingEfecty = signal(false);
  protected balanceError = signal<string | null>(null);
  protected efectyError = signal<string | null>(null);

  protected balanceForm = this.fb.group({
    currentBalance: [null as number | null, [Validators.required, Validators.min(0)]],
    minimumThreshold: [null as number | null],
  });

  protected efectyForm = this.fb.group({
    closeDate: [today(), Validators.required],
    closingBalance: [null as number | null, [Validators.required, Validators.min(0)]],
    notes: [''],
  });

  ngOnInit(): void {
    this.loadPlatforms();
    this.loadLatestEfectyClose();
  }

  protected loadPlatforms(): void {
    this.loading.set(true);
    this.error.set(null);
    this.svc
      .getPlatforms()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (list) => {
          this.platforms.set(list);
          this.loading.set(false);
        },
        error: () => {
          this.error.set('No se pudieron cargar las plataformas. Intenta de nuevo.');
          this.loading.set(false);
        },
      });
  }

  private loadLatestEfectyClose(): void {
    this.svc
      .getLatestEfectyClose()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (c) => this.latestEfectyClose.set(c),
        error: () => {},
      });
  }

  protected openBalanceModal(platform: Platform): void {
    this.editingPlatform.set(platform);
    this.balanceError.set(null);
    this.balanceForm.reset({
      currentBalance: platform.currentBalance,
      minimumThreshold: platform.minimumThreshold,
    });
    this.showBalanceModal.set(true);
  }

  protected closeBalanceModal(): void {
    this.showBalanceModal.set(false);
    this.editingPlatform.set(null);
  }

  protected openEfectyModal(): void {
    this.efectyError.set(null);
    this.efectyForm.reset({ closeDate: today(), closingBalance: null, notes: '' });
    this.showEfectyModal.set(true);
  }

  protected submitBalance(): void {
    this.balanceForm.markAllAsTouched();
    if (this.balanceForm.invalid || this.submittingBalance()) return;
    const platform = this.editingPlatform();
    if (!platform) return;

    this.submittingBalance.set(true);
    this.balanceError.set(null);
    const raw = this.balanceForm.getRawValue();
    const threshold = raw.minimumThreshold != null ? Number(raw.minimumThreshold) : undefined;

    this.svc
      .updateBalance(platform.id, {
        currentBalance: Number(raw.currentBalance),
        ...(threshold !== undefined && { minimumThreshold: threshold }),
      })
      .pipe(finalize(() => this.submittingBalance.set(false)))
      .subscribe({
        next: () => {
          this.closeBalanceModal();
          this.loadPlatforms();
        },
        error: (err) => {
          const msg = err?.error?.message as string | undefined;
          this.balanceError.set(msg ?? 'No se pudo actualizar el saldo. Intenta de nuevo.');
        },
      });
  }

  protected submitEfectyClose(): void {
    this.efectyForm.markAllAsTouched();
    if (this.efectyForm.invalid || this.submittingEfecty()) return;

    this.submittingEfecty.set(true);
    this.efectyError.set(null);
    const raw = this.efectyForm.getRawValue();

    this.svc
      .createEfectyClose({
        closeDate: raw.closeDate!,
        closingBalance: Number(raw.closingBalance),
        notes: raw.notes || undefined,
      })
      .pipe(finalize(() => this.submittingEfecty.set(false)))
      .subscribe({
        next: (c) => {
          this.latestEfectyClose.set(c);
          this.showEfectyModal.set(false);
          this.loadPlatforms();
        },
        error: (err) => {
          const msg = err?.error?.message as string | undefined;
          this.efectyError.set(msg ?? 'No se pudo registrar el cierre. Intenta de nuevo.');
        },
      });
  }

  protected fe(ctrl: AbstractControl | null): boolean {
    return !!(ctrl?.invalid && ctrl.touched);
  }

  protected progressWidth(platform: Platform): number {
    if (!platform.minimumThreshold) return 100;
    return Math.min((platform.currentBalance / platform.minimumThreshold) * 100, 100);
  }

  protected progressColorClass(status: Platform['status']): string {
    switch (status) {
      case 'SUFFICIENT':
        return 'bg-emerald-500';
      case 'LOW':
        return 'bg-amber-500';
      case 'CRITICAL':
        return 'bg-red-500';
    }
  }

  protected isEfecty(platform: Platform): boolean {
    return platform.code === 'EFECTY';
  }
}
