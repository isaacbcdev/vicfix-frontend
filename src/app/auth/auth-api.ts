import { computed, inject, Injectable, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { catchError, finalize, map, Observable, of, switchMap, tap } from 'rxjs';
import { environment } from '@environments/environment';
import { LoginResponse, LoginResult, User } from './auth.models';

const baseUrl = `${environment.apiUrl}/api/v1/auth`;

@Injectable({ providedIn: 'root' })
export class AuthService {
  // Access token lives ONLY in memory — never written to any storage
  private _token = signal<string | null>(null);
  private _user = signal<User | null>(null);

  private http = inject(HttpClient);

  token = computed(this._token);
  user = computed<User | null>(() => this._user());
  isAuthenticated = computed(() => this._token() !== null);
  isAdmin = computed(() => this._user()?.roles!.includes('ROLE_ADMIN') ?? false);
  isRoot = computed(() => this._user()?.roles!.includes('ROLE_ROOT') ?? false);

  clearAuth(): void {
    this._token.set(null);
    this._user.set(null);
  }

  login(username: string, password: string): Observable<LoginResult> {
    return this.http
      .post<LoginResponse>(`${baseUrl}/login`, { username, password }, { withCredentials: true })
      .pipe(
        switchMap((res) => {
          this._token.set(res.accessToken);
          return this.loadCurrentUser();
        }),
        map((): LoginResult => ({ ok: true })),
        catchError((err: HttpErrorResponse) => {
          this.clearAuth();
          const reason = err.status === 423 ? 'locked' : 'credentials';
          return of<LoginResult>({ ok: false, reason });
        }),
      );
  }

  refresh(): Observable<string | null> {
    return this.http.post<LoginResponse>(`${baseUrl}/refresh`, {}, { withCredentials: true }).pipe(
      map((res) => {
        this._token.set(res.accessToken);
        return res.accessToken;
      }),
      catchError(() => {
        this.clearAuth();
        return of(null);
      }),
    );
  }

  logout(): Observable<void> {
    return this.http.post<void>(`${baseUrl}/logout`, {}, { withCredentials: true }).pipe(
      catchError((): Observable<void> => of(undefined)),
      finalize(() => this.clearAuth()),
    );
  }

  loadCurrentUser(): Observable<User> {
    return this.http.get<User>(`${baseUrl}/me`).pipe(tap((user) => this._user.set(user)));
  }
}
