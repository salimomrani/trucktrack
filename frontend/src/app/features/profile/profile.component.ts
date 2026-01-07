import { Component, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { StoreFacade } from '../../store/store.facade';
import { AuthService } from '../../core/services/auth.service';
import { ChangePasswordRequest } from '../../core/models/auth.model';
import { ToastService } from '../../shared/components/toast/toast.service';

/**
 * Profile Component - Displays user profile information and allows password change
 * Uses NgRx store for user data (no API call needed)
 */
@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    TranslateModule,
    DatePipe
  ],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProfileComponent {
  private readonly fb = inject(FormBuilder);
  private readonly facade = inject(StoreFacade);
  private readonly authService = inject(AuthService);
  private readonly toast = inject(ToastService);
  private readonly translate = inject(TranslateService);

  // User data from store (already loaded after login)
  readonly user = this.facade.currentUser;

  // Computed profile data
  readonly hasUser = computed(() => !!this.user());

  // Password change form
  passwordForm: FormGroup;
  isChangingPassword = signal(false);
  hideCurrentPassword = signal(true);
  hideNewPassword = signal(true);
  hideConfirmPassword = signal(true);

  constructor() {
    this.passwordForm = this.fb.group({
      currentPassword: ['', [Validators.required]],
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }

  /**
   * Handle password change form submission
   */
  onChangePassword(): void {
    if (this.passwordForm.invalid) {
      this.markFormGroupTouched(this.passwordForm);
      return;
    }

    this.isChangingPassword.set(true);

    const request: ChangePasswordRequest = {
      currentPassword: this.passwordForm.value.currentPassword,
      newPassword: this.passwordForm.value.newPassword
    };

    this.authService.changePassword(request).subscribe({
      next: () => {
        this.showSuccess(this.translate.instant('PROFILE.PASSWORD_CHANGED'));
        this.passwordForm.reset();
        this.isChangingPassword.set(false);
      },
      error: (error) => {
        console.error('Failed to change password:', error);
        const message = error.error?.message || this.translate.instant('PROFILE.PASSWORD_CHANGE_ERROR');
        this.showError(message);
        this.isChangingPassword.set(false);
      }
    });
  }

  /**
   * Custom validator to check if passwords match
   */
  private passwordMatchValidator(form: FormGroup): { [key: string]: boolean } | null {
    const newPassword = form.get('newPassword')?.value;
    const confirmPassword = form.get('confirmPassword')?.value;

    if (newPassword && confirmPassword && newPassword !== confirmPassword) {
      return { passwordMismatch: true };
    }
    return null;
  }

  /**
   * Get form field error message
   */
  getErrorMessage(fieldName: string): string {
    const field = this.passwordForm.get(fieldName);

    if (field?.hasError('required')) {
      return this.translate.instant('ERRORS.REQUIRED');
    }

    if (field?.hasError('minlength')) {
      return this.translate.instant('AUTH.PASSWORD_MIN_LENGTH');
    }

    if (fieldName === 'confirmPassword' && this.passwordForm.hasError('passwordMismatch')) {
      return this.translate.instant('ERRORS.PASSWORDS_MISMATCH');
    }

    return '';
  }

  /**
   * Mark all form fields as touched to trigger validation messages
   */
  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }

  /**
   * Get role display name
   */
  getRoleDisplayName(role: string): string {
    const roleKeys: Record<string, string> = {
      ADMIN: 'USERS.ROLES.ADMIN',
      FLEET_MANAGER: 'USERS.ROLES.FLEET_MANAGER',
      DRIVER: 'USERS.ROLES.DRIVER',
      DISPATCHER: 'USERS.ROLES.DISPATCHER',
      VIEWER: 'USERS.ROLES.VIEWER'
    };
    const key = roleKeys[role];
    return key ? this.translate.instant(key) : role;
  }

  /**
   * Show success message
   */
  private showSuccess(message: string): void {
    this.toast.success(message);
  }

  /**
   * Show error message
   */
  private showError(message: string): void {
    this.toast.error(message);
  }
}
