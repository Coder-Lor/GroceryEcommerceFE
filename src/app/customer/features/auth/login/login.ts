import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '@core/service/auth.service';
import { AuthClient, LoginCommand, LoginResponse } from '@core/service/system-admin.service';
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
      next: (response: LoginResponse) => {
        console.log('in next');
        this.isSubmitting = false;

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
      },
      error: (error: any) => {
        this.isSubmitting = false;
        this.errorMessage = 'Có lỗi xảy ra. Vui lòng thử lại sau.';
        console.error('Login error:', error);

        let detailMessage = 'Đăng nhập thất bại. Vui lòng thử lại sau.';
        let specificErrorMessage: string | null = null;

        // 🧩 Trường hợp đặc biệt: lỗi từ NSwag (ApiException)
        if (error?.response) {
          try {
            const parsed = JSON.parse(error.response);
            if (parsed?.errorMessage) {
              specificErrorMessage = parsed.errorMessage;
            }
          } catch (e) {
            console.warn('Không thể parse error.response:', e);
          }
        }

        // 🧩 Ưu tiên thông báo cụ thể
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
