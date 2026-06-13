import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@environments/environment';
import { CreateSaleRequest } from './sales.models';

@Injectable({ providedIn: 'root' })
export class SalesService {
  private http = inject(HttpClient);

  createSale(payload: CreateSaleRequest): Observable<{ saleId: number }> {
    return this.http.post<{ saleId: number }>(`${environment.apiUrl}/api/v1/sales`, payload);
  }
}
