import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@environments/environment';
import { Page } from '@shared/models/product.model';
import { CreateUserRequest, UserModel } from './users.models';

const base = `${environment.apiUrl}/api/v1/users`;

@Injectable({ providedIn: 'root' })
export class UsersService {
  private http = inject(HttpClient);

  getUsers(
    page: number,
    size: number,
    query: string,
    active?: boolean,
  ): Observable<Page<UserModel>> {
    let params = new HttpParams().set('page', page).set('size', size).set('query', query);
    if (active !== undefined) {
      params = params.set('active', active);
    }
    return this.http.get<Page<UserModel>>(base, { params });
  }

  getUserById(id: number): Observable<UserModel> {
    return this.http.get<UserModel>(`${base}/${id}`);
  }

  createUser(req: CreateUserRequest): Observable<UserModel> {
    return this.http.post<UserModel>(base, req);
  }

  updateUser(id: number, req: CreateUserRequest): Observable<UserModel> {
    return this.http.put<UserModel>(`${base}/${id}`, req);
  }

  updateStatus(id: number, active: boolean): Observable<void> {
    return this.http.patch<void>(`${base}/${id}/status`, { active });
  }
}
