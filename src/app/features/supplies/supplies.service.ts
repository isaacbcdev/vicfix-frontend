import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@environments/environment';
import { Page } from '@shared/models/product.model';
import { CreateSupplyRequest, Supply } from './supplies.models';

const base = `${environment.apiUrl}/api/v1/supplies`;

@Injectable({ providedIn: 'root' })
export class SuppliesService {
  private http = inject(HttpClient);

  getSupplies(
    page: number,
    size: number,
    query = '',
    status = '',
    startDate?: string,
    endDate?: string,
  ): Observable<Page<Supply>> {
    let params = new HttpParams()
      .set('page', page)
      .set('size', size)
      .set('query', query)
      .set('status', status);
    if (startDate) params = params.set('startDate', startDate);
    if (endDate) params = params.set('endDate', endDate);
    return this.http.get<Page<Supply>>(base, { params });
  }

  createSupply(req: CreateSupplyRequest): Observable<Supply> {
    return this.http.post<Supply>(base, req);
  }

  confirmSupply(id: number): Observable<void> {
    return this.http.post<void>(`${base}/${id}/confirm`, {});
  }

  cancelSupply(id: number): Observable<void> {
    return this.http.post<void>(`${base}/${id}/cancel`, {});
  }

  deleteSupply(id: number): Observable<void> {
    return this.http.delete<void>(`${base}/${id}`);
  }
}
