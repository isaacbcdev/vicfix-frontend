import { Component, effect, inject, input, output, signal } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { finalize } from 'rxjs';
import { UsersService } from '../users-api';
import { RolesService } from '../roles-api';
import { Role, UserModel } from '../users.models';

interface ErrorResponse {
  status: number;
  message: string;
  timestamp: string;
}

function atLeastOneRole(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const val = control.value as number[];
    return val && val.length > 0 ? null : { noRoles: true };
  };
}

@Component({
  selector: 'app-user-form',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './user-form.html',
})
export class UserFormComponent {
  user = input<UserModel | null>(null);
  saved = output<void>();
  cancelled = output<void>();

  private fb = inject(FormBuilder);
  private svc = inject(UsersService);
  private rolesSvc = inject(RolesService);

  submitting = signal(false);
  errorMessage = signal<string | null>(null);
  availableRoles = signal<Role[]>([]);
  rolesLoading = signal(false);

  form = this.fb.group({
    username: ['', Validators.required],
    name: ['', Validators.required],
    lastname: ['', Validators.required],
    mail: ['', [Validators.required, Validators.email]],
    phone: [''],
    password: ['', [Validators.required, Validators.minLength(8)]],
    roleIds: [[] as number[], atLeastOneRole()],
  });

  constructor() {
    this.loadRoles();

    effect(() => {
      const u = this.user();
      if (u) {
        const pwdCtrl = this.form.get('password')!;
        pwdCtrl.clearValidators();
        pwdCtrl.setValidators(Validators.minLength(8));
        pwdCtrl.updateValueAndValidity();

        this.form.patchValue({
          username: u.username,
          name: u.name,
          lastname: u.lastname,
          mail: u.mail,
          phone: u.phone ?? '',
          password: '',
          roleIds: [...u.roleIds],
        });
      } else {
        const pwdCtrl = this.form.get('password')!;
        pwdCtrl.setValidators([Validators.required, Validators.minLength(8)]);
        pwdCtrl.updateValueAndValidity();
        this.form.reset({ roleIds: [] });
      }
    });
  }

  private loadRoles(): void {
    this.rolesLoading.set(true);
    this.rolesSvc.getRoles().subscribe({
      next: (page) => {
        this.availableRoles.set(page.content);
        this.rolesLoading.set(false);
      },
      error: () => this.rolesLoading.set(false),
    });
  }

  get isEditMode(): boolean {
    return this.user() !== null;
  }

  isRoleSelected(roleId: number): boolean {
    const ids = this.form.get('roleIds')!.value as number[];
    return ids.includes(roleId);
  }

  toggleRole(roleId: number): void {
    const ctrl = this.form.get('roleIds')!;
    const ids = [...(ctrl.value as number[])];
    const idx = ids.indexOf(roleId);
    if (idx >= 0) {
      ids.splice(idx, 1);
    } else {
      ids.push(roleId);
    }
    ctrl.setValue(ids);
    ctrl.markAsTouched();
  }

  fieldError(field: string): boolean {
    const ctrl = this.form.get(field);
    return !!(ctrl?.invalid && ctrl.touched);
  }

  submit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid || this.submitting()) return;

    this.submitting.set(true);
    this.errorMessage.set(null);

    const raw = this.form.getRawValue();
    const u = this.user();

    const req = {
      username: raw.username!,
      name: raw.name!,
      lastname: raw.lastname!,
      mail: raw.mail!,
      phone: raw.phone || undefined,
      active: true,
      roleIds: raw.roleIds as number[],
      ...(raw.password ? { password: raw.password } : {}),
    };

    const request$ = u ? this.svc.updateUser(u.id, req) : this.svc.createUser(req);

    request$.pipe(finalize(() => this.submitting.set(false))).subscribe({
      next: () => this.saved.emit(),
      error: (err) => {
        const body = err?.error as Partial<ErrorResponse> | null;
        this.errorMessage.set(
          body?.message ?? 'Ocurrió un error al guardar el usuario. Intenta de nuevo.',
        );
      },
    });
  }
}
