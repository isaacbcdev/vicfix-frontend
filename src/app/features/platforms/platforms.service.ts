import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@environments/environment';
import { Page } from '@shared/models/product.model';
import {
  CreateEfectyCloseRequest,
  CreateTransactionRequest,
  EfectyDailyClose,
  Platform,
  PlatformTransaction,
  UpdateBalanceRequest,
} from './platforms.models';

const base = `${environment.apiUrl}/api/v1/platforms`;

@Injectable({ providedIn: 'root' })
export class PlatformsService {
  private http = inject(HttpClient);

  getPlatforms(): Observable<Platform[]> {
    return this.http.get<Platform[]>(base);
  }

  updateBalance(id: number, req: UpdateBalanceRequest): Observable<Platform> {
    return this.http.patch<Platform>(`${base}/${id}/balance`, req);
  }

  getTransactions(
    id: number,
    page: number,
    size: number,
    startDate?: string,
    endDate?: string,
  ): Observable<Page<PlatformTransaction>> {
    let params = new HttpParams().set('page', page).set('size', size);
    if (startDate) params = params.set('startDate', startDate);
    if (endDate) params = params.set('endDate', endDate);
    return this.http.get<Page<PlatformTransaction>>(`${base}/${id}/transactions`, { params });
  }

  createTransaction(req: CreateTransactionRequest): Observable<PlatformTransaction> {
    return this.http.post<PlatformTransaction>(`${base}/${req.platformId}/transactions`, req);
  }

  createEfectyClose(req: CreateEfectyCloseRequest): Observable<EfectyDailyClose> {
    return this.http.post<EfectyDailyClose>(`${base}/efecty/close`, req);
  }

  getLatestEfectyClose(): Observable<EfectyDailyClose> {
    return this.http.get<EfectyDailyClose>(`${base}/efecty/close/latest`);
  }
}
