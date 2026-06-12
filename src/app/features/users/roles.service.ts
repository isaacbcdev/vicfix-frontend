import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@environments/environment';
import { Page } from '@shared/models/product.model';
import { Role } from './users.models';

const base = `${environment.apiUrl}/api/v1/roles`;

@Injectable({ providedIn: 'root' })
export class RolesService {
  private http = inject(HttpClient);

  getRoles(): Observable<Page<Role>> {
    return this.http.get<Page<Role>>(base, {
      params: { page: 0, size: 50 },
    });
  }
}
