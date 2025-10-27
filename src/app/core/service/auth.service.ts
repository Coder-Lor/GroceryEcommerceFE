import { inject, Injectable, PLATFORM_ID } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { tap, catchError, finalize, map, filter, take, switchMap } from 'rxjs/operators';
import {
  AuthClient,
  LoginCommand,
  LoginResponse,
  LogoutCommand,
  RegisterCommand,
  RegisterResponse,
  ResultOfBoolean,
  ResultOfLoginResponse,
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

  // URL API của bạn (chỉ cần phần base, ví dụ /api/auth)
  private apiUrl = '/api/auth';

  // khai báo biến inject authClient từ system-admin
  private authClient = inject(AuthClient);

  // 1. Quản lý State: Dùng BehaviorSubject để lưu trữ user hiện tại
  // private: Chỉ service này được phép .next() (phát) giá trị mới
  private currentUserSubject: BehaviorSubject<User | null>;
  // public: Các component khác có thể .subscribe() để lắng nghe
  public currentUser: Observable<User | null>;

  // 2. In-memory Token: Lưu accessToken trong một biến private
  private accessToken: string | null = null;

  // 3. Refresh Logic: Cờ để tránh gọi refresh nhiều lần cùng lúc
  private isRefreshing = false;
  private refreshTokenSubject: BehaviorSubject<any> = new BehaviorSubject<any>(null);

  constructor(private http: HttpClient, private router: Router) {
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

        const data = result.data;
        const user: User = {
          id: data.userId ?? '',
          username: data.username ?? '',
          email: data.email ?? '',
        };
        this.setAuthState(data.token ?? '', user);
        this.saveAuthToLocalStorage(data);
        return data;
      })
    );
  }

  /**
   * API Đăng ký (Đăng ký xong sẽ tự động đăng nhập)
   */
  public register(registerData: RegisterCommand): Observable<RegisterResponse> {
    // Dùng method của AuthClient bạn đã có, hoặc gọi http trực tiếp
    return this.authClient.registerAccount(registerData).pipe(
      map((respone: ResultOfRegisterResponse) => {
        if (!respone.isSuccess || !respone.data) {
          throw new Error(respone.errorMessage || 'Đăng ký thất bại');
        }

        const data = respone.data;
        const user: User = {
          id: data.userId ?? '',
          username: data.username ?? '',
          email: data.email ?? '',
        };
        this.setAuthState(data.token ?? '', user);
        this.saveAuthToLocalStorage(data);
        return data;
      })
    );
  }

  /**
   * Đăng xuất
   */
  public logout(request: LogoutCommand): Observable<ResultOfBoolean> {
    // 1. Gọi API để backend xóa HttpOnly Cookie
    // Gửi kèm cookie để backend biết cái nào cần xóa
    // this.http
    //   .post(`${this.apiUrl}/logout`, {}, { withCredentials: true })
    //   .pipe(
    //     // Dù API thành công hay thất bại, frontend cũng phải clear state
    //     finalize(() => {
    //       this.clearAuthState();
    //       this.router.navigate(['/login']);
    //     })
    //   )
    //   .subscribe();
    return this.authClient.logout(request).pipe(
      finalize(() => {
        this.clearAuthState();
      })
    );
  }

  // --- 3. Logic Refresh Token (Quan trọng nhất) ---

  /**
   * HÀM (1): Được gọi bởi APP_INITIALIZER khi F5 (tải lại trang)
   * Cố gắng "đăng nhập thầm lặng" bằng HttpOnly Cookie
   */
  public refreshOnLoad(): Observable<any> {
    return this.http
      .post<AuthResponse>(`${this.apiUrl}/refresh`, {}, { withCredentials: true })
      .pipe(
        tap((response) => {
          // Thành công: Lưu accessToken mới và thông tin user
          this.setAuthState(response.token, response.user);
        }),
        catchError(() => {
          // Thất bại (cookie hết hạn, không có cookie):
          // Xóa state và trả về `of(null)` để ứng dụng tiếp tục chạy
          this.clearAuthState();
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
      // --- Lần gọi ĐẦU TIÊN ---
      this.isRefreshing = true;
      this.refreshTokenSubject.next(null); // Báo cho các request khác "đang refresh"

      return this.http
        .post<AuthResponse>(`${this.apiUrl}/refresh`, {}, { withCredentials: true })
        .pipe(
          tap((response) => {
            // 1. Lưu state mới
            this.setAuthState(response.token, response.user);
            // 2. Phát accessToken MỚI cho các request đang chờ
            this.refreshTokenSubject.next(response.token);
          }),
          map((response) => response.token), // Trả về token mới cho Interceptor
          catchError((error) => {
            // Refresh thất bại (HttpOnly cookie hết hạn)
            // Đăng xuất người dùng
            this.clearAuthState();
            this.router.navigate(['/login']);
            return throwError(() => new Error('Phiên đăng nhập hết hạn'));
          }),
          finalize(() => {
            // Dù thành công hay thất bại, đánh dấu là đã refresh xong
            this.isRefreshing = false;
          })
        );
    } else {
      // --- Các request sau (trong khi đang refresh) ---
      // Sẽ bị "treo" lại, chờ refreshTokenSubject phát ra giá trị
      return this.refreshTokenSubject.pipe(
        filter((token) => token != null), // Chỉ chạy khi nhận được token (không phải null)
        take(1) // Lấy giá trị token mới 1 lần rồi unsubscribe
      );
    }
  }

  // --- 4. Các hàm Helper (private) ---

  /**
   * Hàm private để LƯU accessToken và User (tránh lặp code)
   */
  private setAuthState(token: string, user: User): void {
    this.accessToken = token;
    this.currentUserSubject.next(user);
  }

  /**
   * Hàm private để XÓA state khi logout hoặc refresh thất bại
   */
  private clearAuthState(): void {
    this.accessToken = null;
    this.currentUserSubject.next(null);
  }

  /**
   * ✅ Lưu token và user vào localStorage
   */
  private saveAuthToLocalStorage(data: LoginResponse): void {
    if (isPlatformBrowser(this.platformId)) {
      try {
        localStorage.setItem('currentUser', JSON.stringify(data));
        console.log('💾 Auth data saved to localStorage');
      } catch (error) {
        console.error('❌ Không thể lưu vào localStorage:', error);
      }
    }
  }

  /**
   * hàm private lấy user khi F5
   */
  private restoreAuthState(): void {
    const user = localStorage.getItem('currentUser');

    if (user) {
      try {
        const data: LoginResponse = JSON.parse(user);
        const userInfo: User = {
          id: data.userId!,
          email: data.email!,
          username: data.username!,
        };
        this.accessToken = data.token!;
        this.currentUserSubject.next(userInfo);
      } catch (e) {
        console.error('❌ Không thể parse user từ localStorage:', e);
        this.clearAuthState();
      }
    } else {
      console.log('ℹ️ Chưa có user trong localStorage');
    }
  }
}
