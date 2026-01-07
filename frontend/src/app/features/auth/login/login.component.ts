import { Component, inject, signal, effect, ChangeDetectionStrategy } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { StoreFacade } from '../../../store/store.facade';
import { LoginRequest } from '../../../core/models/auth.model';
import { ButtonComponent, InputComponent } from '../../../shared/components';
import { ToastService } from '../../../shared/components/toast/toast.service';

/**
 * Login Component - Handles user authentication
 * Provides email/password login form with validation
 * Migrated to Tailwind CSS components (Feature 020)
 */
@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    TranslateModule,
    ButtonComponent,
    InputComponent
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly facade = inject(StoreFacade);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  private readonly translate = inject(TranslateService);

  loginForm: FormGroup;
  hidePassword = signal(true);

  // Form field signals for two-way binding with Tailwind components
  email = signal('');
  password = signal('');

  // Use store signals for loading and authentication state
  isLoading = this.facade.authLoading;
  isAuthenticated = this.facade.isAuthenticated;
  authError = this.facade.authError;

  constructor() {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]]
    });

    // React to authentication success
    effect(() => {
      if (this.isAuthenticated()) {
        this.showSuccess(this.translate.instant('AUTH.WELCOME_BACK'));
        this.router.navigate(['/map']);
      }
    });

    // React to authentication errors
    effect(() => {
      const error = this.authError();
      if (error) {
        this.showError(error);
      }
    });
  }

  /**
   * Handle email value change from InputComponent
   */
  onEmailChange(value: string): void {
    this.email.set(value);
    this.loginForm.get('email')?.setValue(value);
    this.loginForm.get('email')?.markAsTouched();
  }

  /**
   * Handle password value change from InputComponent
   */
  onPasswordChange(value: string): void {
    this.password.set(value);
    this.loginForm.get('password')?.setValue(value);
    this.loginForm.get('password')?.markAsTouched();
  }

  /**
   * Handle form submission
   * Dispatches login action to NgRx store
   */
  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.markFormGroupTouched(this.loginForm);
      return;
    }

    const credentials: LoginRequest = {
      email: this.loginForm.value.email,
      password: this.loginForm.value.password
    };

    this.facade.login(credentials);
  }

  /**
   * Get form field error message
   */
  getEmailError(): string | null {
    const field = this.loginForm.get('email');
    if (!field?.touched) return null;

    if (field?.hasError('required')) {
      return this.translate.instant('AUTH.EMAIL_REQUIRED');
    }
    if (field?.hasError('email')) {
      return this.translate.instant('ERRORS.INVALID_EMAIL');
    }
    return null;
  }

  /**
   * Get password error message
   */
  getPasswordError(): string | null {
    const field = this.loginForm.get('password');
    if (!field?.touched) return null;

    if (field?.hasError('required')) {
      return this.translate.instant('AUTH.PASSWORD_REQUIRED');
    }
    if (field?.hasError('minlength')) {
      return this.translate.instant('AUTH.PASSWORD_MIN_LENGTH');
    }
    return null;
  }

  /**
   * Get password input type based on visibility toggle
   */
  getPasswordType(): 'text' | 'password' {
    return this.hidePassword() ? 'password' : 'text';
  }

  /**
   * Toggle password visibility
   */
  togglePasswordVisibility(): void {
    this.hidePassword.update(v => !v);
  }

  /**
   * Mark all form fields as touched to trigger validation messages
   */
  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();

      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
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

  /**
   * Fill login form with test user credentials
   * Feature: 008-rbac-permissions
   */
  fillCredentials(email: string, password: string): void {
    this.email.set(email);
    this.password.set(password);
    this.loginForm.patchValue({ email, password });
  }
}
