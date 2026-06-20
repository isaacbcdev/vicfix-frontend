import { Component, computed, effect, inject, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { finalize } from 'rxjs';
import { CurrencyCopPipe } from '@shared/pipes/currency-cop.pipe';
import { ConfirmDialogService } from '@shared/ui/confirm-dialog/confirm-dialog.service';
import { SalesService } from '../sales-api';
import { SaleSummary } from '../sales.models';

function firstDayOfCurrentMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

@Component({
  selector: 'app-sales-history',
  imports: [CurrencyCopPipe, DatePipe],
  templateUrl: './sales-history.html',
})
export class SalesHistoryComponent implements OnInit {
  private readonly svc = inject(SalesService);
  private readonly confirmDialog = inject(ConfirmDialogService);

  protected sales = signal<SaleSummary[]>([]);
  protected totalElements = signal(0);
  protected currentPage = signal(0);
  protected pageSize = signal(20);
  protected statusFilter = signal('');
  protected startDate = signal(firstDayOfCurrentMonth());
  protected endDate = signal(today());
  protected loading = signal(false);
  protected error = signal<string | null>(null);
  protected actionError = signal<string | null>(null);
  protected confirmingId = signal<number | null>(null);
  protected cancelingId = signal<number | null>(null);
  protected deletingId = signal<number | null>(null);

  protected readonly totalPages = computed(() => Math.ceil(this.totalElements() / this.pageSize()) || 1);

  constructor() {
    effect(() => {
      // Re-run whenever any filter signal changes.
      this.statusFilter();
      this.startDate();
      this.endDate();
      this.currentPage.set(0);
      this.loadSales();
    });
  }

  ngOnInit(): void {
    // Initial load is handled by the constructor effect.
  }

  protected loadSales(): void {
    this.loading.set(true);
    this.error.set(null);
    this.svc
      .getSales(
        this.currentPage(),
        this.pageSize(),
        this.statusFilter() || undefined,
        this.startDate() || undefined,
        this.endDate() || undefined,
      )
      .subscribe({
        next: (page) => {
          this.sales.set(page.content);
          this.totalElements.set(page.page.totalElements);
          this.loading.set(false);
        },
        error: () => {
          this.error.set('No se pudo cargar el historial. Intenta de nuevo.');
          this.loading.set(false);
        },
      });
  }

  protected setStatusFilter(value: string): void {
    this.statusFilter.set(value);
  }

  protected onDateChange(field: 'start' | 'end', value: string): void {
    if (field === 'start') this.startDate.set(value);
    else this.endDate.set(value);
  }

  protected onConfirm(id: number): void {
    this.confirmingId.set(id);
    this.actionError.set(null);
    this.svc
      .confirmSale(id)
      .pipe(finalize(() => this.confirmingId.set(null)))
      .subscribe({
        next: () => this.loadSales(),
        error: (err) => {
          const msg = err?.error?.message as string | undefined;
          this.actionError.set(msg ?? 'No se pudo confirmar la venta. Intenta de nuevo.');
        },
      });
  }

  protected async onCancel(id: number): Promise<void> {
    const confirmed = await this.confirmDialog.confirm({
      title: 'Cancelar venta',
      message: '¿Cancelar esta venta? Se restaurará el stock.',
      confirmLabel: 'Cancelar venta',
      variant: 'default',
    });
    if (!confirmed) return;
    this.cancelingId.set(id);
    this.actionError.set(null);
    this.svc
      .cancelSale(id)
      .pipe(finalize(() => this.cancelingId.set(null)))
      .subscribe({
        next: () => this.loadSales(),
        error: (err) => {
          const msg = err?.error?.message as string | undefined;
          this.actionError.set(msg ?? 'No se pudo cancelar la venta. Intenta de nuevo.');
        },
      });
  }

  protected async onDelete(id: number): Promise<void> {
    const confirmed = await this.confirmDialog.confirm({
      title: 'Eliminar venta',
      message: '¿Eliminar esta venta? Esta acción no se puede deshacer.',
      confirmLabel: 'Eliminar',
      variant: 'danger',
    });
    if (!confirmed) return;
    this.deletingId.set(id);
    this.actionError.set(null);
    this.svc
      .deleteSale(id)
      .pipe(finalize(() => this.deletingId.set(null)))
      .subscribe({
        next: () => this.loadSales(),
        error: (err) => {
          const msg = err?.error?.message as string | undefined;
          this.actionError.set(msg ?? 'No se pudo eliminar la venta. Intenta de nuevo.');
        },
      });
  }

  protected goToPage(page: number): void {
    this.currentPage.set(page);
    this.loadSales();
  }

  protected statusBadgeClass(status: SaleSummary['status']): string {
    switch (status) {
      case 'PENDING':
        return 'bg-amber-100 text-amber-700';
      case 'COMPLETED':
        return 'bg-emerald-100 text-emerald-700';
      case 'CANCELED':
        return 'bg-slate-100 text-slate-500';
    }
  }
}
