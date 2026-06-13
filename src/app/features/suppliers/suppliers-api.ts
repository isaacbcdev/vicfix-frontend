import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@environments/environment';
import { Page } from '@shared/models/product.model';
import { CreateSupplierRequest, Supplier } from './suppliers.models';

const base = `${environment.apiUrl}/api/v1/suppliers`;

@Injectable({ providedIn: 'root' })
export class SuppliersService {
  private http = inject(HttpClient);

  getSuppliers(
    page: number,
    size: number,
    query: string,
    status: string,
  ): Observable<Page<Supplier>> {
    const params = new HttpParams()
      .set('page', page)
      .set('size', size)
      .set('query', query)
      .set('status', status);
    return this.http.get<Page<Supplier>>(base, { params });
  }

  getSupplierById(id: number): Observable<Supplier> {
    return this.http.get<Supplier>(`${base}/${id}`);
  }

  createSupplier(req: CreateSupplierRequest): Observable<{ supplierId: number }> {
    return this.http.post<{ supplierId: number }>(base, req);
  }

  updateSupplier(id: number, req: CreateSupplierRequest): Observable<Supplier> {
    return this.http.put<Supplier>(`${base}/${id}`, req);
  }

  deactivateSupplier(id: number): Observable<void> {
    return this.http.patch<void>(`${base}/${id}/deactivate`, {});
  }

  restoreSupplier(id: number): Observable<void> {
    return this.http.patch<void>(`${base}/${id}/restore`, {});
  }
}
