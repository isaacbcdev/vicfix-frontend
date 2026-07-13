import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@environments/environment';
import { DebtEntry, ResolveDebtRequest } from './debts.models';

const base = `${environment.apiUrl}/api/v1/debts`;

@Injectable({ providedIn: 'root' })
export class DebtsService {
  private http = inject(HttpClient);

  getOutstanding(): Observable<DebtEntry[]> {
    return this.http.get<DebtEntry[]>(`${base}/outstanding`);
  }

  getMonthly(): Observable<DebtEntry[]> {
    return this.http.get<DebtEntry[]>(`${base}/monthly`);
  }

  resolve(id: number, req: ResolveDebtRequest = {}): Observable<DebtEntry> {
    return this.http.patch<DebtEntry>(`${base}/${id}/resolve`, req);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${base}/${id}`);
  }
}
