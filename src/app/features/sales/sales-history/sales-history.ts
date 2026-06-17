import { Component, computed, effect, inject, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { finalize } from 'rxjs';
import { CurrencyCopPipe } from '@shared/pipes/currency-cop.pipe';
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

  sales = signal<SaleSummary[]>([]);
  totalElements = signal(0);
  currentPage = signal(0);
  pageSize = signal(20);
  statusFilter = signal('');
  startDate = signal(firstDayOfCurrentMonth());
  endDate = signal(today());
  loading = signal(false);
  error = signal<string | null>(null);
  actionError = signal<string | null>(null);
  confirmingId = signal<number | null>(null);
  cancelingId = signal<number | null>(null);
  deletingId = signal<number | null>(null);

  readonly totalPages = computed(() => Math.ceil(this.totalElements() / this.pageSize()) || 1);

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

  loadSales(): void {
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

  setStatusFilter(value: string): void {
    this.statusFilter.set(value);
  }

  onDateChange(field: 'start' | 'end', value: string): void {
    if (field === 'start') this.startDate.set(value);
    else this.endDate.set(value);
  }

  onConfirm(id: number): void {
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

  onCancel(id: number): void {
    if (!confirm('¿Cancelar esta venta? Se restaurará el stock.')) return;
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

  onDelete(id: number): void {
    if (!confirm('¿Eliminar esta venta?')) return;
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

  goToPage(page: number): void {
    this.currentPage.set(page);
    this.loadSales();
  }

  statusBadgeClass(status: SaleSummary['status']): string {
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
