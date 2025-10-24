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

  // Nếu có token, coi như đã đăng nhập
  if (token) {
    // Tùy chọn: Có thể thêm logic kiểm tra token hết hạn ở đây
    // Ví dụ: decode JWT và kiểm tra exp
    return true; // Cho phép truy cập
  }

  // Nếu không có token, chuyển hướng đến trang login
  return router.createUrlTree(['/login']);
};