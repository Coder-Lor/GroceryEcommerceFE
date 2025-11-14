import { inject, Injectable, PLATFORM_ID } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { tap, catchError, finalize, map, filter, take } from 'rxjs/operators';
import {
  AuthClient,
  LoginCommand,
  LoginResponse,
  LogoutCommand,
  RefreshTokenCommand,
  RefreshTokenResponse,
  RegisterCommand,
  RegisterResponse,
  ResultOfBoolean,
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

  // 1. Quản lý State: Dùng BehaviorSubject để lưu trữ user hiện tại
  // private: Chỉ service này được phép .next() (phát) giá trị mới
  private currentUserSubject: BehaviorSubject<User | null>;
  // public: Các component khác có thể .subscribe() để lắng nghe
  public currentUser: Observable<User | null>;

  // 2. In-memory Token: Lưu accessToken và refreshToken trong biến private
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
   */
  public logout(): Observable<ResultOfBoolean> {
    const logoutCommand = new LogoutCommand({
      refreshToken: this.refreshToken ?? '',
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
   * Sử dụng refreshToken từ memory để lấy accessToken mới
   */
  public refreshOnLoad(): Observable<any> {
    if (!this.refreshToken) {
      this.clearAuthState();
      return of(null);
    }

    const refreshCommand = new RefreshTokenCommand({
      refreshToken: this.refreshToken,
    });

    return this.authClient.refreshToken(refreshCommand).pipe(
      map((result: ResultOfRefreshTokenResponse) => {
        if (!result.isSuccess || !result.data) {
          throw new Error(result.errorMessage || 'Refresh token failed');
        }
        return result.data;
      }),
      tap((response: RefreshTokenResponse) => {
        const currentUser = this.currentUserSubject.value;
        if (currentUser) {
          const newAccessToken = response.accessToken ?? '';
          const newRefreshToken = response.refreshToken ?? this.refreshToken ?? '';

          this.setAuthState(newAccessToken, newRefreshToken, currentUser);

          // Cập nhật localStorage với refreshToken mới (nếu có)
          if (response.refreshToken && response.refreshToken !== this.refreshToken) {
            this.saveAuthToLocalStorage({
              userId: currentUser.id,
              username: currentUser.username,
              email: currentUser.email,
              token: newAccessToken,
              refreshToken: newRefreshToken,
            } as LoginResponse);
          }
        }
      }),
      catchError((err) => {
        console.error('Refresh token failed:', err.message || err);
        this.clearAuthState();
        this.clearLocalStorage();
        return of(null);
      })
    );
  }

  /**
   * HÀM (2): Được gọi bởi AuthInterceptor khi nhận lỗi 401
   * Xử lý việc refresh token và queue các request
   */
  public handleRefresh(): Observable<string> {
    if (!this.isRefreshing) {
      this.isRefreshing = true;
      this.refreshTokenSubject.next(null);

      if (!this.refreshToken) {
        this.clearAuthState();
        this.clearLocalStorage();
        this.router.navigate(['/login']);
        this.isRefreshing = false;
        return throwError(() => new Error('No refresh token'));
      }

      const refreshCommand = new RefreshTokenCommand({
        refreshToken: this.refreshToken,
      });

      return this.authClient.refreshToken(refreshCommand).pipe(
        map((result: ResultOfRefreshTokenResponse) => {
          if (!result.isSuccess || !result.data) {
            throw new Error(result.errorMessage || 'Refresh failed');
          }
          return result.data;
        }),
        tap((response: RefreshTokenResponse) => {
          const currentUser = this.currentUserSubject.value;
          if (currentUser) {
            this.setAuthState(response.accessToken ?? '', response.refreshToken ?? '', currentUser);
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
    this.setAuthState(data.token ?? '', data.refreshToken ?? '', user);
    this.saveAuthToLocalStorage(data);
  }

  /**
   * Lưu accessToken, refreshToken và User vào memory
   */
  private setAuthState(token: string, refreshToken: string, user: User): void {
    this.accessToken = token;
    this.refreshToken = refreshToken;
    this.currentUserSubject.next(user);
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
   * Lưu user info và refreshToken vào localStorage
   */
  private saveAuthToLocalStorage(data: LoginResponse | RegisterResponse): void {
    if (!isPlatformBrowser(this.platformId)) return;

    try {
      const authData = {
        userId: data.userId,
        username: data.username,
        email: data.email,
        role: data.role,
        refreshToken: data.refreshToken,
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
   */
  private restoreAuthState(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    try {
      const userData = localStorage.getItem('currentUser');
      if (!userData) return;

      const data = JSON.parse(userData);

      if (!data.userId || !data.refreshToken) {
        this.clearLocalStorage();
        return;
      }

      const user: User = {
        id: data.userId,
        email: data.email ?? '',
        username: data.username ?? '',
      };

      this.refreshToken = data.refreshToken;

      this.refreshOnLoad().subscribe({
        next: (result) => {
          if (result) {
            this.currentUserSubject.next(user);
          } else {
            this.clearAuthState();
            this.clearLocalStorage();
          }
        },
        error: () => {
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
}
