import { Injectable, inject } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse,
} from '@angular/common/http';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError, filter, take, switchMap } from 'rxjs/operators';
import { AuthService } from './auth.service';
import { Router } from '@angular/router';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private authService = inject(AuthService);
  private router = inject(Router);

  private isRefreshing = false;
  private refreshTokenSubject: BehaviorSubject<string | null> = new BehaviorSubject<string | null>(
    null
  );

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // 1. Thêm accessToken vào header nếu có
    const token = this.authService.currentAccessToken;
    if (token) {
      request = this.addToken(request, token);
    }

    // 2. Luôn gắn withCredentials
    request = request.clone({ withCredentials: true });

    // 3. Xử lý request và bắt lỗi 401
    return next.handle(request).pipe(
      catchError((error) => {
        if (error instanceof HttpErrorResponse && error.status === 401) {
          return this.handle401Error(request, next);
        }
        return throwError(() => error);
      })
    );
  }

  /**
   * Thêm Authorization header với Bearer token
   */
  private addToken(request: HttpRequest<any>, token: string): HttpRequest<any> {
    return request.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  /**
   * Xử lý lỗi 401: Thử refresh token
   */
  private handle401Error(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Nếu request là login/register/refresh, không retry
    if (
      request.url.includes('/login') ||
      request.url.includes('/register') ||
      request.url.includes('/refresh-token')
    ) {
      return throwError(() => new HttpErrorResponse({ status: 401 }));
    }

    if (!this.isRefreshing) {
      this.isRefreshing = true;
      this.refreshTokenSubject.next(null);

      return this.authService.handleRefresh().pipe(
        switchMap((newToken: string) => {
          this.isRefreshing = false;
          this.refreshTokenSubject.next(newToken);
          // Retry request với token mới
          return next.handle(this.addToken(request, newToken));
        }),
        catchError((err) => {
          this.isRefreshing = false;
          // Refresh thất bại, chuyển về login
          this.authService.logout().subscribe();
          this.router.navigate(['/login']);
          return throwError(() => err);
        })
      );
    } else {
      // Đang refresh, chờ token mới
      return this.refreshTokenSubject.pipe(
        filter((token) => token != null),
        take(1),
        switchMap((token) => {
          return next.handle(this.addToken(request, token!));
        })
      );
    }
  }
}
