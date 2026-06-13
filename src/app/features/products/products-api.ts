import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@environments/environment';
import { Page, Product } from '@shared/models/product.model';

const base = `${environment.apiUrl}/api/v1/products`;

@Injectable({ providedIn: 'root' })
export class ProductsService {
  private http = inject(HttpClient);

  getProducts(page: number, size: number, query: string): Observable<Page<Product>> {
    const params = new HttpParams()
      .set('page', page)
      .set('size', size)
      .set('query', query);
    return this.http.get<Page<Product>>(base, { params });
  }

  getProductById(id: number): Observable<Product> {
    return this.http.get<Product>(`${base}/${id}`);
  }

  createProduct(dto: Partial<Product>): Observable<Product> {
    return this.http.post<Product>(base, dto);
  }

  updateProduct(id: number, dto: Partial<Product>): Observable<Product> {
    return this.http.put<Product>(`${base}/${id}`, dto);
  }

  deleteProduct(id: number): Observable<void> {
    return this.http.delete<void>(`${base}/${id}`);
  }
}
