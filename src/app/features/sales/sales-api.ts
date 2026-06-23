import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@environments/environment';
import { CreateSaleRequest, SaleDetail, SaleSummary } from './sales.models';
import { Page } from '@shared/models/product.model';

const base = `${environment.apiUrl}/api/v1/sales`;

@Injectable({ providedIn: 'root' })
export class SalesService {
  private http = inject(HttpClient);

  createSale(payload: CreateSaleRequest): Observable<{ saleId: number }> {
    return this.http.post<{ saleId: number }>(base, payload);
  }

  getSales(
    page: number,
    size: number,
    status?: string,
    startDate?: string,
    endDate?: string,
  ): Observable<Page<SaleSummary>> {
    let params = new HttpParams().set('page', page).set('size', size);
    if (status) params = params.set('status', status);
    if (startDate) params = params.set('startDate', startDate);
    if (endDate) params = params.set('endDate', endDate);
    return this.http.get<Page<SaleSummary>>(base, { params });
  }

  confirmSale(id: number): Observable<void> {
    return this.http.post<void>(`${base}/${id}/confirm`, {});
  }

  cancelSale(id: number): Observable<void> {
    return this.http.post<void>(`${base}/${id}/cancel`, {});
  }

  deleteSale(id: number): Observable<void> {
    return this.http.delete<void>(`${base}/${id}`);
  }

  getSaleById(id: number): Observable<SaleDetail> {
    return this.http.get<SaleDetail>(`${base}/${id}`);
  }
}
