import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '@auth/auth-api';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule],
  templateUrl: './login.html',
})
export class LoginComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  form = this.fb.group({
    username: ['', [Validators.required]],
    password: ['', [Validators.required]],
  });

  readonly submitting = signal(false);
  readonly showPassword = signal(false);
  readonly errorMessage = signal<string | null>(null);

  get username() {
    return this.form.controls.username;
  }
  get password() {
    return this.form.controls.password;
  }

  togglePassword(): void {
    this.showPassword.update((v) => !v);
  }

  fieldClass(invalid: boolean): Record<string, boolean> {
    return {
      'border-red-400': invalid,
      'bg-red-50': invalid,
      'border-slate-300': !invalid,
      'bg-white': !invalid,
    };
  }

  submit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid || this.submitting()) return;

    this.submitting.set(true);
    this.errorMessage.set(null);

    this.auth
      .login(this.form.controls.username.value!, this.form.controls.password.value!)
      .subscribe((result) => {
        this.submitting.set(false);
        if (result.ok) {
          this.router.navigate(['/dashboard']);
          return;
        }
        this.errorMessage.set(
          result.reason === 'locked'
            ? 'Cuenta bloqueada temporalmente. Intenta de nuevo en unos minutos.'
            : 'Usuario o contraseña incorrectos.',
        );
      });
  }
}
