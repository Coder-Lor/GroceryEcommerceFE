import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '@core/service/auth.service';
import { AuthClient, RegisterCommand } from '@core/service/system-admin.service';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  templateUrl: './register.html',
  styleUrl: './register.scss',
})
export class Register {
  router: Router = inject(Router);
  private authService = inject(AuthService);
  private fb = inject(FormBuilder);

  registerForm: FormGroup;
  showPassword = false;
  isSubmitting = false;
  errorMessage = '';

  constructor(private messageService: MessageService) {
    this.registerForm = this.fb.group(
      {
        email: ['', [Validators.required, Validators.email]],
        username: ['', [Validators.required, Validators.minLength(3)]],
        password: ['', [Validators.required, Validators.minLength(6)]],
        confirmPassword: ['', [Validators.required]],
      },
      {
        validators: this.passwordMatchValidator,
      }
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
    console.log(this.registerForm);
    if (this.registerForm.invalid) {
      // Đánh dấu tất cả các field là đã touched để hiển thị lỗi
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

    this.authService.register(registerCommand).subscribe({
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

          // Đăng ký thành công, chuyển đến trang đăng nhập
          // alert('Đăng ký thành công! Vui lòng đăng nhập.');
          this.messageService.add({
            severity: 'success',
            summary: 'Thành công',
            detail: 'Đăng ký thành công.',
            life: 1000,
          });
          this.router.navigate(['/login']);
        } else {
          // Hiển thị lỗi từ server
          // this.errorMessage = response.errorMessage || 'Đăng ký thất bại. Vui lòng thử lại.';
          this.messageService.add({
            severity: 'error',
            summary: 'Lỗi',
            detail: 'Đăng ký không thành công.',
            life: 1000,
          });
        }
      },
      error: (error: any) => {
        this.isSubmitting = false;
        this.errorMessage = 'Có lỗi xảy ra. Vui lòng thử lại sau.';
        console.error('Register error:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Lỗi',
          detail: 'Đăng ký không thành công.',
          life: 1000,
        });
      },
    });
  }

  // Helper methods để kiểm tra lỗi trong template
  hasError(fieldName: string, errorType?: string): boolean {
    const field = this.registerForm.get(fieldName);
    if (!field) return false;

    if (errorType) {
      return field.hasError(errorType) && (field.dirty || field.touched);
    }
    return field.invalid && (field.dirty || field.touched);
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
