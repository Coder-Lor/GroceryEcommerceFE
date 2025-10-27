import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '@core/service/auth.service';
import { AuthClient, LoginCommand } from '@core/service/system-admin.service';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {
  router: Router = inject(Router);
  private authService = inject(AuthService);
  private fb = inject(FormBuilder);

  loginForm: FormGroup;
  showPassword = false;
  isSubmitting = false;
  errorMessage = '';

  constructor(private messageService: MessageService) {
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
    console.log(this.loginForm);
    if (this.loginForm.invalid) {
      // Đánh dấu tất cả các field là đã touched để hiển thị lỗi
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

    this.authService.login(loginCommand).subscribe({
      next: (response: any) => {
        console.log('in next');
        this.isSubmitting = false;
        if (response.isSuccess) {
          // Lưu token vào localStorage
          if (response.data?.token) {
            localStorage.setItem('accessToken', response.data.token);
          }

          // Lưu refresh token nếu có
          if (response.data?.refreshToken) {
            localStorage.setItem('refreshToken', response.data.refreshToken);
          }

          // Lưu userId nếu có
          if (response.data?.userId) {
            localStorage.setItem('userId', response.data.userId);
          }

          // Lưu thời gian hết hạn nếu có
          if (response.data?.expiresAt) {
            localStorage.setItem('tokenExpiresAt', response.data.expiresAt);
          }

          // Đăng nhập thành công, chuyển đến trang home
          this.messageService.add({
            severity: 'success',
            summary: 'Thành công',
            detail: 'Đăng nhập thành công!',
            life: 1000,
          });
          setTimeout(() => {
            this.router.navigate(['/home']);
          }, 300);
        } else {
          // Hiển thị lỗi từ server
          this.errorMessage = response.errorMessage || 'Đăng nhập thất bại. Vui lòng thử lại.';
          this.messageService.add({
            severity: 'error',
            summary: 'Lỗi',
            detail: 'Tài khoản hoặc mật khẩu không đúng!',
            life: 1000,
          });
        }
      },
      error: (error: any) => {
        this.isSubmitting = false;
        this.errorMessage = 'Có lỗi xảy ra. Vui lòng thử lại sau.';
        console.error('Login error:', error);

        this.messageService.add({
          severity: 'error',
          summary: 'Lỗi',
          detail: 'Đăng nhập thất bại. Vui lòng thử lại.',
          life: 1000,
        });
      },
    });
  }

  // Helper methods để kiểm tra lỗi trong template
  hasError(fieldName: string, errorType?: string): boolean {
    const field = this.loginForm.get(fieldName);
    if (!field) return false;

    if (errorType) {
      return field.hasError(errorType) && (field.dirty || field.touched);
    }
    return field.invalid && (field.dirty || field.touched);
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
