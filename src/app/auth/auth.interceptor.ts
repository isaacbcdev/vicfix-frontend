import { inject } from '@angular/core';
import { HttpErrorResponse, HttpHandlerFn, HttpRequest } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, catchError, filter, switchMap, take, throwError } from 'rxjs';
import { environment } from '@environments/environment';
import { AuthService } from './auth-api';

let isRefreshing = false;
let refreshSubject = new BehaviorSubject<string | null>(null);

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
  const apiReq = addToken(req, token);

  return next(apiReq).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.status !== 401 || isAuthEndpoint) {
        return throwError(() => err);
      }

      if (!isRefreshing) {
        isRefreshing = true;
        refreshSubject.next(null);

        return authService.refresh().pipe(
          switchMap((newToken) => {
            isRefreshing = false;
            if (newToken) {
              refreshSubject.next(newToken);
              return next(addToken(req, newToken));
            }
            // Refresh returned null — session is gone
            authService.clearAuth();
            router.navigate(['/login']);
            return throwError(() => err);
          }),
          catchError((refreshErr) => {
            isRefreshing = false;
            authService.clearAuth();
            router.navigate(['/login']);
            return throwError(() => refreshErr);
          }),
        );
      }

      // Another request is already refreshing — queue behind it
      return refreshSubject.pipe(
        filter((t): t is string => t !== null),
        take(1),
        switchMap((newToken) => next(addToken(req, newToken))),
      );
    }),
  );
}
