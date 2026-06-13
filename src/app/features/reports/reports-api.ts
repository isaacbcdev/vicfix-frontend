import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@environments/environment';
import {
  CashFlowReport,
  CategoryBalanceReport,
  FinancialReport,
  SalesByProductReport,
  StockReport,
} from './reports.models';

const base = `${environment.apiUrl}/api/v1/reports`;

@Injectable({ providedIn: 'root' })
export class ReportsService {
  private http = inject(HttpClient);

  getSalesByProduct(startDate: string, endDate: string): Observable<SalesByProductReport> {
    const params = new HttpParams().set('startDate', startDate).set('endDate', endDate);
    return this.http.get<SalesByProductReport>(`${base}/sales/by-product`, { params });
  }

  getFinancialSummary(startDate: string, endDate: string): Observable<FinancialReport> {
    const params = new HttpParams().set('startDate', startDate).set('endDate', endDate);
    return this.http.get<FinancialReport>(`${base}/finance/summary`, { params });
  }

  getStockReport(): Observable<StockReport> {
    return this.http.get<StockReport>(`${base}/inventory/stock`);
  }

  getCategoryBalance(startDate: string, endDate: string): Observable<CategoryBalanceReport> {
    const params = new HttpParams().set('startDate', startDate).set('endDate', endDate);
    return this.http.get<CategoryBalanceReport>(`${base}/categories/balance`, { params });
  }

  getCashFlow(startDate: string, endDate: string): Observable<CashFlowReport> {
    const params = new HttpParams().set('startDate', startDate).set('endDate', endDate);
    return this.http.get<CashFlowReport>(`${base}/finance/cashflow`, { params });
  }
}
