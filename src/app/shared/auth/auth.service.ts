import { computed, inject, Injectable, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { catchError, finalize, map, Observable, of, switchMap, tap } from 'rxjs';
import { environment } from '@environments/environment';
import { LoginResponse, LoginResult, User } from './auth.models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/api/v1/auth`;

  // Access token lives ONLY in memory — never written to any storage
  private readonly _accessToken = signal<string | null>(null);
  private readonly _currentUser = signal<User | null>(null);

  readonly accessToken = this._accessToken.asReadonly();
  readonly currentUser = this._currentUser.asReadonly();
  readonly isAuthenticated = computed(() => this._accessToken() !== null);

  clearAuth(): void {
    this._accessToken.set(null);
    this._currentUser.set(null);
  }

  login(username: string, password: string): Observable<LoginResult> {
    return this.http
      .post<LoginResponse>(`${this.base}/login`, { username, password }, { withCredentials: true })
      .pipe(
        switchMap(res => {
          this._accessToken.set(res.accessToken);
          return this.loadCurrentUser();
        }),
        map((): LoginResult => ({ ok: true })),
        catchError((err: HttpErrorResponse) => {
          this.clearAuth();
          const reason = err.status === 423 ? 'locked' : 'credentials';
          return of<LoginResult>({ ok: false, reason });
        })
      );
  }

  refresh(): Observable<string | null> {
    return this.http
      .post<LoginResponse>(`${this.base}/refresh`, {}, { withCredentials: true })
      .pipe(
        map(res => {
          this._accessToken.set(res.accessToken);
          return res.accessToken;
        }),
        catchError(() => {
          this.clearAuth();
          return of(null);
        })
      );
  }

  logout(): Observable<void> {
    return this.http
      .post<void>(`${this.base}/logout`, {}, { withCredentials: true })
      .pipe(
        catchError((): Observable<void> => of(undefined)),
        finalize(() => this.clearAuth())
      );
  }

  loadCurrentUser(): Observable<User> {
    return this.http
      .get<User>(`${this.base}/me`)
      .pipe(tap(user => this._currentUser.set(user)));
  }
}
