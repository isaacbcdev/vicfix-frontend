import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../../auth/auth-api';

@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './shell.html',
})
export class ShellComponent {
  protected auth = inject(AuthService);
  protected authService = this.auth;
  private router = inject(Router);
  loggingOut = signal(false);

  logout(): void {
    this.loggingOut.set(true);
    this.auth.logout().subscribe({
      complete: () => this.router.navigate(['/login']),
    });
  }
}
