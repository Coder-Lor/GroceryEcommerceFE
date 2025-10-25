import { inject } from '@angular/core';
import { Router, CanActivateFn, UrlTree } from '@angular/router';

/**
 * Auth Guard - Kiểm tra token trong localStorage
 * Không cần phụ thuộc vào AuthService
 */
export const authGuard: CanActivateFn = (route, state): boolean | UrlTree => {
  const router = inject(Router);

  // Lấy token từ localStorage
  const token = localStorage.getItem('accessToken');
  
  // Debug: Log chi tiết
  console.log('🔐 Auth Guard - Checking authentication');
  console.log('Token from localStorage:', token);
  console.log('Token type:', typeof token);
  console.log('Token length:', token?.length);
  console.log('All localStorage keys:', Object.keys(localStorage));
  console.log('Attempting to access:', state.url);
  
  // Kiểm tra token: phải tồn tại VÀ không phải chuỗi rỗng
  if (token && token.trim().length > 0) {
    console.log('✅ Access granted');
    // Tùy chọn: Có thể thêm logic kiểm tra token hết hạn ở đây
    // Ví dụ: decode JWT và kiểm tra exp
    return true; // Cho phép truy cập
  }

  // Nếu không có token hoặc token rỗng, chuyển hướng đến trang login
  console.log('❌ Access denied - Redirecting to login');
  return router.createUrlTree(['/login']);
};