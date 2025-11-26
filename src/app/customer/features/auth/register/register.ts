import { CommonModule } from '@angular/common';
import { Component, inject, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { AuthService, AuthPublicResponse } from '@core/service/auth.service';
import { RegisterCommand } from '@core/service/system-admin.service';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  templateUrl: './register.html',
  styleUrl: './register.scss',
})
export class Register implements OnDestroy {
  private router = inject(Router);
  private authService = inject(AuthService);
  private fb = inject(FormBuilder);
  private messageService = inject(MessageService);

  registerForm: FormGroup;
  showPassword = false;
  isSubmitting = false;
  errorMessage = '';

  private destroy$ = new Subject<void>();
  private redirectTimeout: any;

  constructor() {
    this.registerForm = this.fb.group(
      {
        email: ['', [Validators.required, Validators.email]],
        username: ['', [Validators.required, Validators.minLength(3)]],
        password: ['', [Validators.required, Validators.minLength(6)]],
        confirmPassword: ['', [Validators.required]],
      },
      { validators: this.passwordMatchValidator }
    );
  }

  passwordMatchValidator(form: FormGroup) {
    const password = form.get('password')?.value;
    const confirmPassword = form.get('confirmPassword')?.value;

    if (password !== confirmPassword) {
      form.get('confirmPassword')?.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }
    return null;
  }

  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  exitLoginForm() {
    this.router.navigate(['/home']);
  }

  onSubmit() {
    if (this.registerForm.invalid) {
      Object.keys(this.registerForm.controls).forEach((key) => {
        this.registerForm.get(key)?.markAsTouched();
      });
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';

    const registerCommand = new RegisterCommand({
      email: this.registerForm.value.email,
      username: this.registerForm.value.username,
      password: this.registerForm.value.password,
    });

    this.authService
      .register(registerCommand)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (_response: AuthPublicResponse) => {
          this.isSubmitting = false;

          this.messageService.add({
            severity: 'success',
            summary: 'Thành công',
            detail: 'Đăng ký thành công!',
            life: 1000,
          });

          this.redirectTimeout = setTimeout(() => {
            this.router.navigate(['/home']);
          }, 800);
        },
        error: (err) => {
          this.isSubmitting = false;
          console.error('Register error:', err);
          this.messageService.add({
            severity: 'error',
            summary: 'Lỗi',
            detail: err.message || 'Đăng ký không thành công.',
            life: 1000,
          });
        },
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();

    if (this.redirectTimeout) {
      clearTimeout(this.redirectTimeout);
    }
  }

  hasError(fieldName: string, errorType?: string): boolean {
    const field = this.registerForm.get(fieldName);
    if (!field) return false;

    return errorType
      ? field.hasError(errorType) && (field.dirty || field.touched)
      : field.invalid && (field.dirty || field.touched);
  }

  getErrorMessage(fieldName: string): string {
    const field = this.registerForm.get(fieldName);
    if (!field || !field.errors) return '';

    if (field.hasError('required')) return 'Trường này là bắt buộc';
    if (field.hasError('email')) return 'Email không hợp lệ';
    if (field.hasError('minlength')) {
      const minLength = field.errors['minlength'].requiredLength;
      return `Tối thiểu ${minLength} ký tự`;
    }
    if (field.hasError('passwordMismatch')) return 'Mật khẩu không khớp';

    return '';
  }
}
