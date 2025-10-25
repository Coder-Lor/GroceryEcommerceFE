import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthClient, LoginCommand } from '@core/service/system-admin.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {
  router: Router = inject(Router);
  private authClient = inject(AuthClient);
  private fb = inject(FormBuilder);

  loginForm: FormGroup;
  showPassword = false;
  isSubmitting = false;
  errorMessage = '';

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

    this.authClient.login(loginCommand).subscribe({
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
          alert('Đăng nhập thành công!');
          this.router.navigate(['/home']);
        } else {
          // Hiển thị lỗi từ server
          this.errorMessage = response.errorMessage || 'Đăng nhập thất bại. Vui lòng thử lại.';
        }
      },
      error: (error: any) => {
        this.isSubmitting = false;
        this.errorMessage = 'Có lỗi xảy ra. Vui lòng thử lại sau.';
        console.error('Login error:', error);
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
