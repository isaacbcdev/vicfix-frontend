import { inject } from '@angular/core';
import { HttpErrorResponse, HttpHandlerFn, HttpRequest } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, catchError, finalize, shareReplay, switchMap, throwError } from 'rxjs';
import { environment } from '@environments/environment';
import { AuthService } from './auth-api';

let refreshInFlight$: Observable<string | null> | null = null;

function addToken(req: HttpRequest<unknown>, token: string | null): HttpRequest<unknown> {
  return req.clone({
    headers: req.headers.set('Authorization', `Bearer ${token}`),
  });
}

export function jwtInterceptor(req: HttpRequest<unknown>, next: HttpHandlerFn) {
  const router = inject(Router);
  const authService = inject(AuthService);
  const token = authService.token();

  // Pass third-party requests through untouched
  if (!req.url.startsWith(environment.apiUrl)) {
    return next(req);
  }

  const isAuthEndpoint = req.url.includes('/api/v1/auth/');

  // All requests to our API: attach credentials cookie + bearer token when present
  const skipToken =
    req.url.includes('/api/v1/auth/login') ||
    req.url.includes('/api/v1/auth/refresh') ||
    req.url.includes('/api/v1/auth/logout');

  const apiReq = skipToken ? req : addToken(req, token);

  return next(apiReq).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.status !== 401 || isAuthEndpoint) {
        return throwError(() => err);
      }

      // Create the refresh observable exactly once; all concurrent 401s share it
      if (!refreshInFlight$) {
        refreshInFlight$ = authService.refresh().pipe(
          shareReplay(1),
          finalize(() => {
            refreshInFlight$ = null;
          }),
        );
      }

      return refreshInFlight$.pipe(
        switchMap((newToken) => {
          if (newToken) {
            return next(addToken(req, newToken));
          }
          authService.clearAuth();
          router.navigate(['/login']);
          return throwError(() => err);
        }),
        catchError((refreshErr) => {
          authService.clearAuth();
          router.navigate(['/login']);
          return throwError(() => refreshErr);
        }),
      );
    }),
  );
}
