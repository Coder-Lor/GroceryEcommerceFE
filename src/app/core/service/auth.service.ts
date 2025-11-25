import { inject, Injectable, PLATFORM_ID } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { tap, catchError, finalize, map, filter, take } from 'rxjs/operators';
import { AuthClient, LoginCommand, LogoutCommand, RegisterCommand, ResultOfBoolean } from './system-admin.service';
import { isPlatformBrowser } from '@angular/common';

export interface User {
  id: string;
  username: string;
  email: string;
}

export interface AuthPublicResponse {
  userId?: string;
  username?: string;
  role?: string;
  email?: string;
  token?: string;
  expiresAt?: Date;
}

export interface AccessTokenPublicResponse {
  accessToken?: string;
  expiresAt?: Date;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private platformId = inject(PLATFORM_ID);
  private authClient = inject(AuthClient);

  private currentUserSubject: BehaviorSubject<User | null>;
  public currentUser: Observable<User | null>;

  private accessToken: string | null = null;
  private isRefreshing = false;
  private refreshTokenSubject: BehaviorSubject<any> = new BehaviorSubject<any>(null);

  constructor(private router: Router) {
    this.currentUserSubject = new BehaviorSubject<User | null>(null);
    this.currentUser = this.currentUserSubject.asObservable();
    if (isPlatformBrowser(this.platformId)) {
      this.restoreAuthState();
    }
  }

  public get currentAccessToken(): string | null {
    return this.accessToken;
  }

  public get isAuthenticated$(): Observable<boolean> {
    return this.currentUser.pipe(map((user) => !!user));
  }

  public get isAuthenticated(): boolean {
    return this.currentUserSubject.value !== null;
  }

  public get currentUserValue(): User | null {
    return this.currentUserSubject.value;
  }

  public login(command: LoginCommand): Observable<AuthPublicResponse> {
    return this.authClient.login(command).pipe(
      map((result: any) => {
        const data = result?.data as AuthPublicResponse | undefined;
        if (!result?.isSuccess || !data) {
          throw new Error(result?.errorMessage || 'Dang nhap that bai');
        }
        this.handleAuthSuccess(data);
        return data;
      }),
      catchError((err) => {
        console.error('Login error:', err);
        return throwError(() => err);
      })
    );
  }

  public register(registerData: RegisterCommand): Observable<AuthPublicResponse> {
    return this.authClient.registerAccount(registerData).pipe(
      map((response: any) => {
        const data = response?.data as AuthPublicResponse | undefined;
        if (!response?.isSuccess || !data) {
          throw new Error(response?.errorMessage || 'Dang ky that bai');
        }
        this.handleAuthSuccess(data);
        return data;
      }),
      catchError((err) => {
        console.error('Register error:', err);
        return throwError(() => err);
      })
    );
  }

  public logout(): Observable<ResultOfBoolean> {
    const logoutCommand = new LogoutCommand({ refreshToken: '' });

    return this.authClient.logout(logoutCommand).pipe(
      catchError((err) => {
        console.error('Logout error:', err);
        return of({ isSuccess: false, errorMessage: 'Loi dang xuat' } as ResultOfBoolean);
      }),
      finalize(() => {
        this.clearAuthState();
        this.clearLocalStorage();
      })
    );
  }

  // Refresh token on reload
  public refreshOnLoad(): Observable<any> {
    const currentUser = this.currentUserSubject.value;
    if (!currentUser) {
      return of(null);
    }

    return this.authClient.refreshToken().pipe(
      map((result: any) => {
        const data = result?.data as AccessTokenPublicResponse | undefined;
        if (!result?.isSuccess || !data) {
          throw new Error(result?.errorMessage || 'Refresh token failed');
        }
        return data;
      }),
      tap((response: AccessTokenPublicResponse) => {
        const user = this.currentUserSubject.value;
        if (user) {
          const newAccessToken = response.accessToken ?? '';
          this.setAuthState(newAccessToken, user);
        }
      }),
      catchError((err) => {
        console.error('Refresh token failed:', err?.message || err);
        // Giữ user state, chỉ trả null để không xóa localStorage (tránh auto logout khi cookie thiếu)
        return of(null);
      })
    );
  }

  // Refresh when 401
  public handleRefresh(): Observable<string> {
    if (!this.isRefreshing) {
      this.isRefreshing = true;
      this.refreshTokenSubject.next(null);

      return this.authClient.refreshToken().pipe(
        map((result: any) => {
          const data = result?.data as AccessTokenPublicResponse | undefined;
          if (!result?.isSuccess || !data) {
            throw new Error(result?.errorMessage || 'Refresh failed');
          }
          return data;
        }),
        tap((response: AccessTokenPublicResponse) => {
          const currentUser = this.currentUserSubject.value;
          if (currentUser) {
            this.setAuthState(response.accessToken ?? '', currentUser);
          }
          this.refreshTokenSubject.next(response.accessToken);
        }),
        map((response: AccessTokenPublicResponse) => response.accessToken ?? ''),
        catchError((err) => {
          console.error('Session expired:', err?.message || err);
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

  private handleAuthSuccess(data: AuthPublicResponse): void {
    const user: User = {
      id: data.userId ?? '',
      username: data.username ?? '',
      email: data.email ?? '',
    };
    this.setAuthState(data.token ?? '', user);
    this.saveAuthToLocalStorage(data);
  }

  private setAuthState(token: string, user: User): void {
    this.accessToken = token;
    this.currentUserSubject.next(user);
  }

  private clearAuthState(): void {
    this.accessToken = null;
    this.currentUserSubject.next(null);
  }

  private saveAuthToLocalStorage(data: AuthPublicResponse): void {
    if (!isPlatformBrowser(this.platformId)) return;

    try {
      const authData = {
        userId: data.userId,
        username: data.username,
        email: data.email,
        role: data.role,
      };
      localStorage.setItem('currentUser', JSON.stringify(authData));
    } catch (err) {
      console.error('Failed to save to localStorage:', err);
    }
  }

  private clearLocalStorage(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    try {
      localStorage.removeItem('currentUser');
    } catch (err) {
      console.error('Failed to clear localStorage:', err);
    }
  }

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

      this.currentUserSubject.next(user);

      this.refreshOnLoad().subscribe({
        next: (result) => {
          if (!result) {
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
