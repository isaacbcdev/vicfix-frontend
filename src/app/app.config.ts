import { inject, ApplicationConfig, provideBrowserGlobalErrorListeners, provideAppInitializer } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { catchError, firstValueFrom, of, switchMap } from 'rxjs';

import { routes } from './app.routes';
import { jwtInterceptor } from '@shared/auth/auth.interceptor';
import { AuthService } from '@shared/auth/auth.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(withInterceptors([jwtInterceptor])),
    provideAppInitializer(() => {
      const auth = inject(AuthService);
      // Attempt to restore session from surviving httpOnly refresh cookie.
      // Failure (no cookie, backend down) is caught — app boots unauthenticated.
      return firstValueFrom(
        auth.refresh().pipe(
          switchMap(token => (token ? auth.loadCurrentUser() : of(null))),
          catchError(() => of(null))
        )
      );
    }),
  ],
};
