import { Component, computed, DestroyRef, inject, OnInit, signal } from '@angular/core';

function firstDayOfCurrentMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}
import { DatePipe, AsyncPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AuthService } from '@auth/auth-api';
import { ModalComponent } from '@shared/ui/modal/modal';
import { CurrencyCopPipe } from '@shared/pipes/currency-cop.pipe';
import { ConfirmDialogService } from '@shared/ui/confirm-dialog/confirm-dialog.service';
import { SuppliesService } from './supplies-api';
import { Supply } from './supplies.models';
import { SupplyFormComponent } from './supply-form/supply-form';

@Component({
  selector: 'app-supplies',
  imports: [FormsModule, DatePipe, CurrencyCopPipe, ModalComponent, SupplyFormComponent],
  templateUrl: './supplies.html',
})
export class SuppliesComponent implements OnInit {
  protected readonly auth = inject(AuthService);
  private readonly svc = inject(SuppliesService);
  private readonly confirmDialog = inject(ConfirmDialogService);
  private readonly destroyRef = inject(DestroyRef);

  protected supplies = signal<Supply[]>([]);
  protected totalElements = signal(0);
  protected currentPage = signal(0);
  protected pageSize = signal(20);
  protected query = signal('');
  protected statusFilter = signal('');
  protected startDate = signal(firstDayOfCurrentMonth());
  protected endDate = signal(today());
  protected loading = signal(false);
  protected error = signal<string | null>(null);
  protected actionError = signal<string | null>(null);
  protected showModal = signal(false);
  protected viewingSupply = signal<Supply | null>(null);
  protected showDetailModal = signal(false);
  protected loadingDetail = signal(false);
  protected confirmingId = signal<number | null>(null);
  protected cancelingId = signal<number | null>(null);
  protected deletingId = signal<number | null>(null);

  protected readonly totalPages = computed(() => Math.ceil(this.totalElements() / this.pageSize()) || 1);

  private search$ = new Subject<string>();
  protected searchInput = signal('');

  ngOnInit(): void {
    this.search$
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe((q) => {
        this.query.set(q);
        this.currentPage.set(0);
        this.loadSupplies();
      });

    this.loadSupplies();
  }

  protected loadSupplies(): void {
    this.loading.set(true);
    this.error.set(null);
    this.svc
      .getSupplies(
        this.currentPage(),
        this.pageSize(),
        this.query(),
        this.statusFilter(),
        this.startDate() || undefined,
        this.endDate() || undefined,
      )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (page) => {
          this.supplies.set(page.content);
          this.totalElements.set(page.page.totalElements);
          this.loading.set(false);
        },
        error: () => {
          this.error.set('No se pudo cargar la lista de suministros. Intenta de nuevo.');
          this.loading.set(false);
        },
      });
  }

  protected setStatusFilter(status: string): void {
    this.statusFilter.set(status);
    this.currentPage.set(0);
    this.loadSupplies();
  }

  protected onSearchChange(value: string): void {
    this.searchInput.set(value);
    this.search$.next(value);
  }

  protected onDateChange(field: 'start' | 'end', value: string): void {
    if (field === 'start') this.startDate.set(value);
    else this.endDate.set(value);
    this.currentPage.set(0);
    this.loadSupplies();
  }

  protected clearSearch(): void {
    this.searchInput.set('');
    this.search$.next('');
  }

  protected onConfirm(id: number): void {
    this.confirmingId.set(id);
    this.actionError.set(null);
    this.svc
      .confirmSupply(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.confirmingId.set(null);
          this.loadSupplies();
        },
        error: (err) => {
          this.confirmingId.set(null);
          const msg = err?.error?.message as string | undefined;
          this.actionError.set(msg ?? 'No se pudo confirmar el suministro. Intenta de nuevo.');
        },
      });
  }

  protected async onCancel(id: number): Promise<void> {
    const confirmed = await this.confirmDialog.confirm({
      title: 'Cancelar suministro',
      message: '¿Cancelar este suministro? Se revertirá el stock si fue entregado.',
      confirmLabel: 'Cancelar suministro',
      variant: 'default',
    });
    if (!confirmed) return;

    this.cancelingId.set(id);
    this.actionError.set(null);
    this.svc
      .cancelSupply(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.cancelingId.set(null);
          this.loadSupplies();
        },
        error: (err) => {
          this.cancelingId.set(null);
          const msg = err?.error?.message as string | undefined;
          this.actionError.set(msg ?? 'No se pudo cancelar el suministro. Intenta de nuevo.');
        },
      });
  }

  protected async onDelete(id: number): Promise<void> {
    const confirmed = await this.confirmDialog.confirm({
      title: 'Eliminar suministro',
      message: '¿Eliminar este suministro? Esta acción no se puede deshacer.',
      confirmLabel: 'Eliminar',
      variant: 'danger',
    });
    if (!confirmed) return;

    this.deletingId.set(id);
    this.actionError.set(null);
    this.svc
      .deleteSupply(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.deletingId.set(null);
          this.loadSupplies();
        },
        error: (err) => {
          this.deletingId.set(null);
          const msg = err?.error?.message as string | undefined;
          this.actionError.set(msg ?? 'No se pudo eliminar el suministro. Intenta de nuevo.');
        },
      });
  }

  protected openSupplyDetail(id: number): void {
    this.loadingDetail.set(true);
    this.showDetailModal.set(true);
    this.svc
      .getSupplyById(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (supply) => {
          this.viewingSupply.set(supply);
          this.loadingDetail.set(false);
        },
        error: () => {
          this.loadingDetail.set(false);
          this.showDetailModal.set(false);
          this.actionError.set('No se pudo cargar el detalle del suministro.');
        },
      });
  }

  protected onSaved(): void {
    this.showModal.set(false);
    this.loadSupplies();
  }

  protected goToPage(page: number): void {
    this.currentPage.set(page);
    this.loadSupplies();
  }
}
