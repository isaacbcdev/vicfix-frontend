import { inject } from '@angular/core';
import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { environment } from '@environments/environment';
import { AuthService } from './auth.service';

export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const token = auth.accessToken();

  // Pass third-party requests through untouched
  if (!req.url.startsWith(environment.apiUrl)) {
    return next(req);
  }

  // All requests to our API: attach credentials cookie + bearer token when present
  const apiReq = req.clone({
    withCredentials: true,
    ...(token ? { setHeaders: { Authorization: `Bearer ${token}` } } : {}),
  });

  return next(apiReq).pipe(
    catchError((err: HttpErrorResponse) => {
      // Auth endpoints manage their own 401 handling via service catchError.
      // Only redirect on 401 from protected API resources.
      const isAuthEndpoint = req.url.includes('/api/v1/auth/');
      if (err.status === 401 && !isAuthEndpoint) {
        // TODO: silent refresh + request queue — implement in a later commit
        auth.clearAuth();
        router.navigate(['/login']);
      }
      return throwError(() => err);
    })
  );
};
