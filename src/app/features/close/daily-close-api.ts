import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@environments/environment';
import { CreateDailyCloseRequest, DailyClose, DailyClosePreview } from './close.models';

const base = `${environment.apiUrl}/api/v1/daily-close`;

@Injectable({ providedIn: 'root' })
export class DailyCloseService {
  private http = inject(HttpClient);

  getPreview(): Observable<DailyClosePreview> {
    return this.http.get<DailyClosePreview>(`${base}/preview`);
  }

  submitClose(req: CreateDailyCloseRequest): Observable<DailyClose> {
    return this.http.post<DailyClose>(base, req);
  }

  getLatest(): Observable<DailyClose> {
    return this.http.get<DailyClose>(`${base}/latest`);
  }
}
