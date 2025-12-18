import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { ShopClient, CreateShopCommand } from '@core/service/system-admin.service';
import { AuthService } from '@core/service/auth.service';
import { take } from 'rxjs';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-shop-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, ToastModule],
  providers: [MessageService],
  templateUrl: './shop-register.html',
  styleUrl: './shop-register.scss',
})
export class ShopRegisterPage {
  name: string = '';
  slug: string = '';
  description: string = '';
  logoFile: File | null = null;
  logoPreview: string | null = null;
  isSubmitting = false;

  constructor(
    private readonly shopClient: ShopClient,
    private readonly authService: AuthService,
    private readonly messageService: MessageService,
    private readonly router: Router,
    private readonly http: HttpClient
  ) {}

  private slugify(value?: string | null): string | undefined {
    if (!value) return undefined;
    return value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-');
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        this.messageService.add({
          severity: 'error',
          summary: 'Định dạng không hợp lệ',
          detail: 'Chỉ chấp nhận file JPG, PNG, WEBP',
        });
        return;
      }

      // Validate file size (10MB)
      if (file.size > 10 * 1024 * 1024) {
        this.messageService.add({
          severity: 'error',
          summary: 'File quá lớn',
          detail: 'Kích thước file không được vượt quá 10MB',
        });
        return;
      }

      this.logoFile = file;
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        this.logoPreview = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  removeLogo(): void {
    this.logoFile = null;
    this.logoPreview = null;
  }

  handleDrop(event: DragEvent): void {
    event.preventDefault();
    if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
      const file = event.dataTransfer.files[0];
      const input = document.createElement('input');
      input.type = 'file';
      input.files = event.dataTransfer.files;
      const fakeEvent = { target: input } as any;
      this.onFileSelected(fakeEvent);
    }
  }

  submit(): void {
    if (!this.name || !this.name.trim()) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Thiếu tên shop',
        detail: 'Vui lòng nhập tên shop',
      });
      return;
    }

    this.authService.currentUser.pipe(take(1)).subscribe((user) => {
      if (!user?.id) {
        this.messageService.add({
          severity: 'warn',
          summary: 'Cần đăng nhập',
          detail: 'Vui lòng đăng nhập để đăng ký shop',
        });
        return;
      }

      this.isSubmitting = true;

      // Create FormData for multipart/form-data
      const formData = new FormData();
      formData.append('Name', this.name.trim());
      if (this.slug && this.slug.trim()) {
        formData.append('Slug', this.slugify(this.slug) || '');
      }
      if (this.description && this.description.trim()) {
        formData.append('Description', this.description.trim());
      }
      formData.append('Status', '1');
      formData.append('OwnerUserId', user.id);
      
      if (this.logoFile) {
        formData.append('LogoFile', this.logoFile);
      }

      // Use default base URL (same as ShopClient)
      const baseUrl = 'https://localhost:44394';
      const apiUrl = `${baseUrl}/api/Shop/register-with-file`;

      // Backend sử dụng HTTP-only cookies, không cần thêm Authorization header
      // Chỉ cần withCredentials: true để gửi cookies
      this.http.post<any>(apiUrl, formData, { 
        withCredentials: true 
      }).subscribe({
        next: (result) => {
          if (result?.isSuccess) {
            this.messageService.add({
              severity: 'success',
              summary: 'Đăng ký thành công',
              detail: 'Shop đã được tạo thành công',
            });
            // Reset form
            this.name = '';
            this.slug = '';
            this.description = '';
            this.logoFile = null;
            this.logoPreview = null;
            // Navigate to my-shop page
            this.router.navigate(['/my-shop']);
          } else {
            this.messageService.add({
              severity: 'warn',
              summary: 'Không thể đăng ký',
              detail: result?.errorMessage || 'Vui lòng thử lại',
            });
          }
          this.isSubmitting = false;
        },
        error: (err) => {
          console.error('Lỗi đăng ký shop', err);
          this.isSubmitting = false;
          const errorMsg = err?.error?.errorMessage || err?.message || 'Không thể đăng ký shop';
          this.messageService.add({
            severity: 'error',
            summary: 'Lỗi',
            detail: errorMsg,
          });
        },
      });
    });
  }
}

