import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@environments/environment';
import { DebtEntry } from './debts.models';

const base = `${environment.apiUrl}/api/v1/debts`;

@Injectable({ providedIn: 'root' })
export class DebtsService {
  private http = inject(HttpClient);

  getOutstanding(): Observable<DebtEntry[]> {
    return this.http.get<DebtEntry[]>(`${base}/outstanding`);
  }

  resolve(id: number): Observable<DebtEntry> {
    return this.http.patch<DebtEntry>(`${base}/${id}/resolve`, {});
  }
}
