import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DecimalPipe } from '@angular/common';
import { CurrencyCopPipe } from '@shared/pipes/currency-cop.pipe';
import { ReportsService } from './reports-api';
import {
  CashFlowReport,
  CategoryBalanceReport,
  FinancialReport,
  SalesByProductReport,
  StockReport,
} from './reports.models';

type Tab = 'sales' | 'financial' | 'stock' | 'categories' | 'cashflow';

function firstDayOfCurrentMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
}

function today(): string {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}

@Component({
  selector: 'app-reports',
  imports: [CurrencyCopPipe, DecimalPipe],
  templateUrl: './reports.html',
})
export class ReportsComponent implements OnInit {
  private svc = inject(ReportsService);
  private destroyRef = inject(DestroyRef);

  activeTab = signal<Tab>('sales');
  startDate = signal<string>(firstDayOfCurrentMonth());
  endDate = signal<string>(today());
  loading = signal(false);
  error = signal<string | null>(null);

  salesByProductData = signal<SalesByProductReport | null>(null);
  financialData = signal<FinancialReport | null>(null);
  stockData = signal<StockReport | null>(null);
  categoryBalanceData = signal<CategoryBalanceReport | null>(null);
  cashFlowData = signal<CashFlowReport | null>(null);

  ngOnInit(): void {
    this.loadReport();
  }

  setActiveTab(tab: Tab): void {
    this.activeTab.set(tab);
    if (!this.hasData(tab)) {
      this.loadReport();
    }
  }

  onDateChange(field: 'start' | 'end', value: string): void {
    if (field === 'start') {
      this.startDate.set(value);
    } else {
      this.endDate.set(value);
    }
    this.clearAllData();
    this.loadReport();
  }

  loadReport(): void {
    const tab = this.activeTab();
    const start = this.startDate();
    const end = this.endDate();

    this.loading.set(true);
    this.error.set(null);

    if (tab === 'sales') {
      this.svc
        .getSalesByProduct(start, end)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (data) => {
            this.salesByProductData.set(data);
            this.loading.set(false);
          },
          error: () => this.setError(),
        });
    } else if (tab === 'financial') {
      this.svc
        .getFinancialSummary(start, end)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (data) => {
            this.financialData.set(data);
            this.loading.set(false);
          },
          error: () => this.setError(),
        });
    } else if (tab === 'stock') {
      this.svc
        .getStockReport()
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (data) => {
            this.stockData.set(data);
            this.loading.set(false);
          },
          error: () => this.setError(),
        });
    } else if (tab === 'categories') {
      this.svc
        .getCategoryBalance(start, end)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (data) => {
            this.categoryBalanceData.set(data);
            this.loading.set(false);
          },
          error: () => this.setError(),
        });
    } else if (tab === 'cashflow') {
      this.svc
        .getCashFlow(start, end)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (data) => {
            this.cashFlowData.set(data);
            this.loading.set(false);
          },
          error: () => this.setError(),
        });
    }
  }

  private hasData(tab: Tab): boolean {
    if (tab === 'sales') return this.salesByProductData() !== null;
    if (tab === 'financial') return this.financialData() !== null;
    if (tab === 'stock') return this.stockData() !== null;
    if (tab === 'categories') return this.categoryBalanceData() !== null;
    if (tab === 'cashflow') return this.cashFlowData() !== null;
    return false;
  }

  private clearAllData(): void {
    this.salesByProductData.set(null);
    this.financialData.set(null);
    this.stockData.set(null);
    this.categoryBalanceData.set(null);
    this.cashFlowData.set(null);
  }

  private setError(): void {
    this.error.set('No se pudo cargar el reporte. Intenta de nuevo.');
    this.loading.set(false);
  }

  categoryEntries(groupedRows: Record<string, { stockSum: number; valueSum: number }>): [string, { stockSum: number; valueSum: number }][] {
    return Object.entries(groupedRows);
  }

  profitMargin(profit: number, sales: number): number {
    if (sales <= 0) return 0;
    return (profit / sales) * 100;
  }

  cashFlowTypeBadgeClass(type: string): string {
    const t = type.toLowerCase();
    if (t === 'income' || t === 'ingreso') return 'bg-emerald-100 text-emerald-700';
    if (t === 'supply' || t === 'compra') return 'bg-amber-100 text-amber-700';
    return 'bg-red-100 text-red-700';
  }
}
