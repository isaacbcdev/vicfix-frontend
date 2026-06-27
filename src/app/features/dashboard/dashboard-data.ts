import { inject, Injectable } from '@angular/core';
import { catchError, forkJoin, map, Observable, of } from 'rxjs';
import { PlatformsService } from '@features/platforms/platforms-api';
import { ReportsService } from '@features/reports/reports-api';
import { SalesService } from '@features/sales/sales-api';
import { ProductsService } from '@features/products/products-api';
import { EfectyDailyClose, Platform } from '@features/platforms/platforms.models';
import { FinancialReport } from '@features/reports/reports.models';

export interface DashboardData {
  platforms: Platform[];
  finance: FinancialReport | null;
  salesTotalElements: number;
  outOfStockCount: number;
  lowStockCount: number;
  efectyClose: EfectyDailyClose | null;
}

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private platformsSvc = inject(PlatformsService);
  private reportsSvc = inject(ReportsService);
  private salesSvc = inject(SalesService);
  private productsSvc = inject(ProductsService);

  loadDashboardData(today: string): Observable<DashboardData> {
    return forkJoin({
      platforms: this.platformsSvc.getPlatforms().pipe(catchError(() => of([]))),
      finance: this.reportsSvc
        .getFinancialSummary(today, today)
        .pipe(catchError(() => of(null))),
      sales: this.salesSvc
        .getSales(0, 1, undefined, today, today)
        .pipe(catchError(() => of(null))),
      outOfStock: this.productsSvc
        .getProducts(0, 1, '', null, 'OUT_OF_STOCK')
        .pipe(catchError(() => of(null))),
      lowStock: this.productsSvc
        .getProducts(0, 1, '', null, null, true)
        .pipe(catchError(() => of(null))),
      efectyClose: this.platformsSvc.getLatestEfectyClose().pipe(catchError(() => of(null))),
    }).pipe(
      map((res) => ({
        platforms: res.platforms,
        finance: res.finance,
        salesTotalElements: res.sales?.page.totalElements ?? 0,
        outOfStockCount: res.outOfStock?.page.totalElements ?? 0,
        lowStockCount: res.lowStock?.page.totalElements ?? 0,
        efectyClose: res.efectyClose,
      })),
    );
  }
}
