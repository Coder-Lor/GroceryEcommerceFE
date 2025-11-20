import { inject, Injectable, PLATFORM_ID } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { tap, catchError, finalize, map, filter, take } from 'rxjs/operators';
import {
  AuthClient,
  LoginCommand,
  LoginResponse,
  LogoutCommand,
  RefreshTokenClient,
  RefreshTokenResponse,
  RegisterCommand,
  RegisterResponse,
  ResultOfBoolean,
  ResultOfListOfRefreshToken,
  ResultOfLoginResponse,
  ResultOfRefreshTokenResponse,
  ResultOfRegisterResponse,
} from './system-admin.service';
import { isPlatformBrowser } from '@angular/common';

// --- ĐỊNH NGHĨA CÁC INTERFACE (NÊN ĐẶT Ở FILE RIÊNG) ---

/**
 * Interface cho đối tượng người dùng
 */
export interface User {
  id: string;
  username: string;
  email: string;
  // ... (thêm các trường khác)
}

/**
 * Interface cho phản hồi từ API login/register/refresh
 * Backend CHỈ trả về accessToken. RefreshToken nằm trong HttpOnly Cookie.
 */
export interface AuthResponse {
  token: string; // Đây là AccessToken
  user: User;
}

// --- AUTH SERVICE ---

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private platformId = inject(PLATFORM_ID);
  private authClient = inject(AuthClient);
  private refreshTokenClient = inject(RefreshTokenClient);

  // 1. Quản lý State: Dùng BehaviorSubject để lưu trữ user hiện tại
  private currentUserSubject: BehaviorSubject<User | null>;
  public currentUser: Observable<User | null>;

  // 2. In-memory Tokens: Lưu cả accessToken và refreshToken trong memory
  private accessToken: string | null = null;
  private refreshToken: string | null = null;

  // 3. Refresh Logic: Cờ để tránh gọi refresh nhiều lần cùng lúc
  private isRefreshing = false;
  private refreshTokenSubject: BehaviorSubject<any> = new BehaviorSubject<any>(null);

  constructor(private router: Router) {
    // Khởi tạo state: Mặc định là null (chưa đăng nhập)
    this.currentUserSubject = new BehaviorSubject<User | null>(null);
    this.currentUser = this.currentUserSubject.asObservable();
    if (isPlatformBrowser(this.platformId)) {
      this.restoreAuthState();
    }
  }

  // --- 1. Getters (Hàm truy cập) ---

  /**
   * Getter để Interceptor lấy accessToken
   */
  public get currentAccessToken(): string | null {
    return this.accessToken;
  }

  /**
   * Observable trả về true/false, cho biết đã đăng nhập hay chưa
   */
  public get isAuthenticated$(): Observable<boolean> {
    return this.currentUser.pipe(map((user) => !!user));
  }

  /**
   * Getter đồng bộ để check nhanh trạng thái đăng nhập
   */
  public get isAuthenticated(): boolean {
    return this.currentUserSubject.value !== null && this.accessToken !== null;
  }

  /**
   * Getter để lấy thông tin user hiện tại
   */
  public get currentUserValue(): User | null {
    return this.currentUserSubject.value;
  }

  // --- 2. Hàm xử lý Auth chính (Login, Register, Logout) ---

  /**
   * API Đăng nhập
   */
  public login(command: LoginCommand): Observable<LoginResponse> {
    return this.authClient.login(command).pipe(
      map((result: ResultOfLoginResponse) => {
        if (!result.isSuccess || !result.data) {
          throw new Error(result.errorMessage || 'Đăng nhập thất bại');
        }
        this.handleAuthSuccess(result.data);
        return result.data;
      }),
      catchError((err) => {
        console.error('❌ Lỗi đăng nhập:', err);
        return throwError(() => err);
      })
    );
  }

  /**
   * API Đăng ký (Đăng ký xong sẽ tự động đăng nhập)
   */
  public register(registerData: RegisterCommand): Observable<RegisterResponse> {
    return this.authClient.registerAccount(registerData).pipe(
      map((response: ResultOfRegisterResponse) => {
        if (!response.isSuccess || !response.data) {
          throw new Error(response.errorMessage || 'Đăng ký thất bại');
        }
        this.handleAuthSuccess(response.data);
        return response.data;
      }),
      catchError((err) => {
        console.error('❌ Lỗi đăng ký:', err);
        return throwError(() => err);
      })
    );
  }

  /**
   * Đăng xuất
   * Backend sẽ lấy refreshToken từ HttpOnly Cookie
   */
  public logout(): Observable<ResultOfBoolean> {
    const logoutCommand = new LogoutCommand({
      refreshToken: '', // Backend lấy từ cookie
    });

    return this.authClient.logout(logoutCommand).pipe(
      catchError((err) => {
        console.error('Logout error:', err);
        return of({ isSuccess: false, errorMessage: 'Lỗi đăng xuất' } as ResultOfBoolean);
      }),
      finalize(() => {
        this.clearAuthState();
        this.clearLocalStorage();
      })
    );
  }

  // --- 3. Logic Refresh Token (Quan trọng nhất) ---

  /**
   * HÀM (1): Được gọi khi khôi phục session (F5 hoặc mở lại tab)
   * Backend lấy refreshToken từ HttpOnly Cookie
   */
  public refreshOnLoad(): Observable<any> {
    // Backend TỰ ĐỘNG lấy refreshToken từ HttpOnly cookie
    // API không cần parameter, backend tự lấy từ cookie qua withCredentials
    console.log('🔄 refreshOnLoad - Backend will use HttpOnly cookie');

    return this.authClient.refreshToken().pipe(
      tap((result) => {
        console.log('🔄 Refresh token raw response:', result);
      }),
      map((result: ResultOfRefreshTokenResponse) => {
        if (!result.isSuccess || !result.data) {
          console.error('❌ Refresh token response not successful:', result);
          throw new Error(result.errorMessage || 'Refresh token failed');
        }
        console.log('✅ Refresh token successful');
        return result.data;
      }),
      tap((response: RefreshTokenResponse) => {
        const currentUser = this.currentUserSubject.value;
        if (currentUser) {
          // Chỉ cập nhật accessToken vào memory
          // refreshToken được backend quản lý qua HttpOnly cookie
          this.accessToken = response.accessToken ?? '';
        }
      }),
      catchError((err) => {
        console.error('❌ Refresh token failed:', err.message || err);
        this.clearAuthState();
        this.clearLocalStorage();
        return of(null);
      })
    );
  }

  /**
   * HÀM (2): Được gọi bởi AuthInterceptor khi nhận lỗi 401
   * Backend lấy refreshToken từ HttpOnly Cookie
   */
  public handleRefresh(): Observable<string> {
    if (!this.isRefreshing) {
      this.isRefreshing = true;
      this.refreshTokenSubject.next(null);

      // Backend TỰ ĐỘNG lấy refreshToken từ HttpOnly cookie
      // API không cần parameter
      return this.authClient.refreshToken().pipe(
        map((result: ResultOfRefreshTokenResponse) => {
          if (!result.isSuccess || !result.data) {
            throw new Error(result.errorMessage || 'Refresh failed');
          }
          return result.data;
        }),
        tap((response: RefreshTokenResponse) => {
          const currentUser = this.currentUserSubject.value;
          if (currentUser) {
            // Chỉ cập nhật accessToken vào memory
            // refreshToken được backend quản lý qua HttpOnly cookie
            this.accessToken = response.accessToken ?? '';
          }
          this.refreshTokenSubject.next(response.accessToken);
        }),
        map((response) => response.accessToken ?? ''),
        catchError((err) => {
          console.error('Session expired:', err.message || err);
          this.clearAuthState();
          this.clearLocalStorage();
          this.router.navigate(['/login']);
          return throwError(() => new Error('Session expired'));
        }),
        finalize(() => {
          this.isRefreshing = false;
        })
      );
    } else {
      return this.refreshTokenSubject.pipe(
        filter((token) => token != null),
        take(1)
      );
    }
  }

  // --- 4. Các hàm Helper (private) ---

  /**
   * Xử lý thành công khi login/register
   */
  private handleAuthSuccess(data: LoginResponse | RegisterResponse): void {
    const user: User = {
      id: data.userId ?? '',
      username: data.username ?? '',
      email: data.email ?? '',
    };
    // Chỉ lưu accessToken vào memory
    // refreshToken được backend quản lý qua HttpOnly cookie
    this.accessToken = data.token ?? '';
    this.currentUserSubject.next(user);
    // Lưu user info vào localStorage (KHÔNG lưu tokens)
    this.saveAuthToLocalStorage(data);
  }

  /**
   * Xóa state trong memory
   */
  private clearAuthState(): void {
    this.accessToken = null;
    this.refreshToken = null;
    this.currentUserSubject.next(null);
  }

  /**
   * Lưu ONLY user info vào localStorage
   * Tokens được quản lý bởi backend qua HttpOnly cookie
   */
  private saveAuthToLocalStorage(data: LoginResponse | RegisterResponse): void {
    if (!isPlatformBrowser(this.platformId)) return;

    try {
      const authData = {
        userId: data.userId,
        username: data.username,
        email: data.email,
        role: data.role,
        // KHÔNG lưu tokens - backend quản lý qua HttpOnly cookie
      };

      localStorage.setItem('currentUser', JSON.stringify(authData));
    } catch (err) {
      console.error('Failed to save to localStorage:', err);
    }
  }

  /**
   * Xóa auth data khỏi localStorage
   */
  private clearLocalStorage(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    try {
      localStorage.removeItem('currentUser');
    } catch (err) {
      console.error('Failed to clear localStorage:', err);
    }
  }

  /**
   * Khôi phục auth state từ localStorage khi mở lại app
   * RefreshToken được lấy từ HttpOnly Cookie tự động
   */
  private restoreAuthState(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    try {
      const userData = localStorage.getItem('currentUser');
      if (!userData) return;

      const data = JSON.parse(userData);

      if (!data.userId) {
        this.clearLocalStorage();
        return;
      }

      const user: User = {
        id: data.userId,
        email: data.email ?? '',
        username: data.username ?? '',
      };

      // Set user trước để refreshOnLoad có thể dùng
      this.currentUserSubject.next(user);

      // Gọi refresh để lấy accessToken mới
      // Backend tự động lấy refreshToken từ HttpOnly Cookie
      console.log('🔄 Restoring auth state for user:', user.username);

      this.refreshOnLoad().subscribe({
        next: (result) => {
          if (!result) {
            // Refresh thất bại
            console.error('❌ Refresh failed, clearing auth state');
            this.clearAuthState();
            this.clearLocalStorage();
          } else {
            // Nếu thành công, accessToken đã được set trong refreshOnLoad()
            console.log('✅ Auth state restored successfully');
            console.log('✅ AccessToken:', this.accessToken ? 'SET' : 'NULL');
            console.log('✅ User:', this.currentUserValue?.username);
          }
        },
        error: (err) => {
          console.error('❌ Refresh error:', err);
          this.clearAuthState();
          this.clearLocalStorage();
        },
      });
    } catch (err) {
      console.error('Failed to restore auth state:', err);
      this.clearAuthState();
      this.clearLocalStorage();
    }
  }

  // --- 5. Quản lý Refresh Tokens (Tính năng mới) ---

  /**
   * Lấy danh sách tất cả refresh tokens của user hiện tại
   */
  public getUserRefreshTokens(): Observable<ResultOfListOfRefreshToken> {
    const userId = this.currentUserValue?.id;
    if (!userId) {
      return throwError(() => new Error('User not logged in'));
    }
    return this.refreshTokenClient.getByUser(userId);
  }

  /**
   * Revoke một refresh token cụ thể
   */
  public revokeRefreshToken(tokenId: string): Observable<ResultOfBoolean> {
    return this.refreshTokenClient.revoke(tokenId);
  }

  /**
   * Revoke tất cả refresh tokens của user (logout khỏi tất cả devices)
   */
  public revokeAllRefreshTokens(): Observable<ResultOfBoolean> {
    const userId = this.currentUserValue?.id;
    if (!userId) {
      return throwError(() => new Error('User not logged in'));
    }
    return this.refreshTokenClient.revokeAll(userId).pipe(
      tap((result) => {
        if (result.isSuccess) {
          // Clear local state sau khi revoke all
          this.clearAuthState();
          this.clearLocalStorage();
        }
      })
    );
  }
}
