import { CommonModule } from '@angular/common';
import { Component, inject, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { AuthService } from '@core/service/auth.service';
import { LoginCommand, LoginResponse } from '@core/service/system-admin.service';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login implements OnDestroy {
  private router = inject(Router);
  private authService = inject(AuthService);
  private fb = inject(FormBuilder);
  private messageService = inject(MessageService);

  loginForm: FormGroup;
  showPassword = false;
  isSubmitting = false;
  errorMessage = '';
  private destroy$ = new Subject<void>(); // ✅ Dùng để cleanup subscription
  private redirectTimeout: any; // ✅ Giữ id của setTimeout

  constructor() {
    this.loginForm = this.fb.group({
      emailOrUsername: ['', [Validators.required]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  exitLoginForm() {
    this.router.navigate(['/home']);
  }

  onSubmit() {
    if (this.loginForm.invalid) {
      Object.keys(this.loginForm.controls).forEach((key) => {
        this.loginForm.get(key)?.markAsTouched();
      });
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';

    const loginCommand = new LoginCommand({
      emailOrUsername: this.loginForm.value.emailOrUsername,
      password: this.loginForm.value.password,
    });

    this.authService
      .login(loginCommand)
      .pipe(takeUntil(this.destroy$)) // ✅ Tự động unsubscribe khi destroy
      .subscribe({
        next: (response: LoginResponse) => {
          this.isSubmitting = false;
          this.messageService.add({
            severity: 'success',
            summary: 'Thành công',
            detail: 'Đăng nhập thành công!',
            life: 1000,
          });

          // ✅ Giữ timeout id để clear khi destroy
          this.redirectTimeout = setTimeout(() => {
            this.router.navigate(['/home']);
          }, 300);
        },
        error: (error: any) => {
          this.isSubmitting = false;
          this.errorMessage = 'Có lỗi xảy ra. Vui lòng thử lại sau.';
          console.error('Login error:', error);

          let detailMessage = 'Đăng nhập thất bại. Vui lòng thử lại sau.';
          let specificErrorMessage: string | null = null;

          if (error?.response) {
            try {
              const parsed = JSON.parse(error.response);
              if (parsed?.errorMessage) specificErrorMessage = parsed.errorMessage;
            } catch {
              console.warn('Không thể parse error.response');
            }
          }

          if (specificErrorMessage === 'Invalid credentials') {
            detailMessage = 'Tài khoản hoặc mật khẩu không đúng. Vui lòng kiểm tra lại.';
          } else if (specificErrorMessage) {
            detailMessage = specificErrorMessage;
          } else if (error.status === 400 || error.status === 401) {
            detailMessage = 'Yêu cầu không hợp lệ hoặc không được phép.';
          }

          this.errorMessage = detailMessage;
          this.messageService.add({
            severity: 'error',
            summary: 'Lỗi',
            detail: detailMessage,
            life: 2000,
          });
        },
      });
  }

  // ✅ Cleanup để tránh memory leak
  ngOnDestroy(): void {
    // Hủy mọi subscription đang mở
    this.destroy$.next();
    this.destroy$.complete();

    // Clear timeout nếu chưa chạy
    if (this.redirectTimeout) {
      clearTimeout(this.redirectTimeout);
    }
  }

  hasError(fieldName: string, errorType?: string): boolean {
    const field = this.loginForm.get(fieldName);
    if (!field) return false;
    return errorType
      ? field.hasError(errorType) && (field.dirty || field.touched)
      : field.invalid && (field.dirty || field.touched);
  }

  getErrorMessage(fieldName: string): string {
    const field = this.loginForm.get(fieldName);
    if (!field || !field.errors) return '';
    if (field.hasError('required')) return 'Trường này là bắt buộc';
    if (field.hasError('minlength')) {
      const minLength = field.errors['minlength'].requiredLength;
      return `Tối thiểu ${minLength} ký tự`;
    }
    return '';
  }
}
