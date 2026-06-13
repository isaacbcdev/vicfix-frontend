import { inject } from '@angular/core';
import { HttpErrorResponse, HttpHandlerFn, HttpRequest } from '@angular/common/http';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { environment } from '@environments/environment';
import { AuthService } from './auth-api';

export function jwtInterceptor(req: HttpRequest<unknown>, next: HttpHandlerFn) {
  const router = inject(Router);
  const token = inject(AuthService).token();

  // Pass third-party requests through untouched
  if (!req.url.startsWith(environment.apiUrl)) {
    return next(req);
  }

  // All requests to our API: attach credentials cookie + bearer token when present
  const apiReq = req.clone({
    headers: req.headers.append('Authorization', `Bearer ${token}`),
  });

  return next(apiReq).pipe(
    catchError((err: HttpErrorResponse) => {
      // Auth endpoints manage their own 401 handling via service catchError.
      // Only redirect on 401 from protected API resources.
      const isAuthEndpoint = req.url.includes('/api/v1/auth/');
      if (err.status === 401 && !isAuthEndpoint) {
        router.navigate(['/login']);
      }
      return throwError(() => err);
    }),
  );
}
