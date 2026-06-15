import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@environments/environment';
import { Category } from '@shared/models/product.model';

const base = `${environment.apiUrl}/api/v1/categories`;

@Injectable({ providedIn: 'root' })
export class CategoriesService {
  private http = inject(HttpClient);

  getCategories(): Observable<Category[]> {
    return this.http.get<Category[]>(base);
  }
}
