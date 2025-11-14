# Tối ưu Auth Service - Tóm tắt

## ✅ Các cải tiến đã thực hiện

### 1. **Loại bỏ import không sử dụng**

- Xóa `switchMap` không dùng đến
- Giữ lại các operators cần thiết: `tap`, `catchError`, `finalize`, `map`, `filter`, `take`

### 2. **Tối ưu code duplicate**

- Tạo method `handleAuthSuccess()` để xử lý chung cho login và register
- Giảm code lặp lại từ ~15 dòng xuống còn 1 dòng gọi method

### 3. **Cải thiện localStorage operations**

- Tách `clearLocalStorage()` riêng để dễ quản lý
- Thêm error handling cho tất cả localStorage operations
- Thêm logging rõ ràng cho từng thao tác

### 4. **Cải thiện error handling**

- Thêm `catchError` cho login và register
- Thêm logging chi tiết cho mọi lỗi
- Xử lý lỗi nhất quán trong logout

### 5. **Tối ưu refresh token logic**

- Thêm logging để debug dễ hơn
- Đảm bảo clearLocalStorage() được gọi khi refresh thất bại
- Giữ nguyên cơ chế queue requests

### 6. **Cải thiện code readability**

- Thêm comments rõ ràng hơn
- Tách các helper methods logic hơn
- Sử dụng early return trong `restoreAuthState()`

## 📊 So sánh trước và sau

### Trước:

```typescript
// Login và Register có code duplicate
const user: User = {
  id: data.userId ?? '',
  username: data.username ?? '',
  email: data.email ?? '',
};
this.setAuthState(data.token ?? '', user);
this.saveAuthToLocalStorage(data);
```

### Sau:

```typescript
// Gọn gàng, dễ maintain
this.handleAuthSuccess(result.data);
```

## 🎯 Lợi ích

1. **Dễ maintain**: Code ngắn gọn, logic rõ ràng
2. **Dễ debug**: Logging chi tiết ở mọi bước
3. **An toàn hơn**: Error handling đầy đủ
4. **Performance**: Không thay đổi, vẫn giữ nguyên hiệu suất
5. **Type safety**: Loại bỏ các warning không cần thiết

## 🔍 Các method chính

### Public Methods (API cho components)

- `login()` - Đăng nhập
- `register()` - Đăng ký
- `logout()` - Đăng xuất
- `refreshOnLoad()` - Refresh khi F5
- `handleRefresh()` - Refresh khi 401

### Private Helper Methods

- `handleAuthSuccess()` - Xử lý thành công auth
- `setAuthState()` - Lưu state vào memory
- `clearAuthState()` - Xóa state khỏi memory
- `saveAuthToLocalStorage()` - Lưu vào localStorage
- `clearLocalStorage()` - Xóa khỏi localStorage
- `restoreAuthState()` - Khôi phục từ localStorage

## 📝 Ghi chú

- Tất cả localStorage operations đều có platform check
- Error handling đầy đủ với try-catch
- Logging rõ ràng với emoji để dễ đọc
- Code tuân thủ Angular best practices

## 🔧 FIX: Lỗi Logout trả về 400

### Vấn đề phát hiện

- Backend API `/api/Auth/logout` yêu cầu `refreshToken` trong request body
- `LogoutCommand` có field `refreshToken?: string`
- Trước đây không gửi refreshToken → Backend trả về 400 Bad Request

### Nguyên nhân

- Service chỉ lưu `accessToken` trong memory
- Không lưu `refreshToken` từ LoginResponse/RegisterResponse
- Khi logout gửi `refreshToken: undefined` hoặc `''`

### Giải pháp đã áp dụng

#### 1. Lưu refreshToken vào memory

```typescript
private accessToken: string | null = null;
private refreshToken: string | null = null; // ✅ Thêm mới
```

#### 2. Cập nhật setAuthState()

```typescript
private setAuthState(token: string, refreshToken: string, user: User): void {
  this.accessToken = token;
  this.refreshToken = refreshToken; // ✅ Lưu refreshToken
  this.currentUserSubject.next(user);
}
```

#### 3. Cập nhật logout()

```typescript
public logout(): Observable<ResultOfBoolean> {
  const logoutCommand = new LogoutCommand({
    refreshToken: this.refreshToken ?? '', // ✅ Gửi refreshToken
  });

  return this.authClient.logout(logoutCommand).pipe(
    // ... xử lý response
    finalize(() => {
      this.clearAuthState(); // Clear cả accessToken và refreshToken
      this.clearLocalStorage();
    })
  );
}
```

#### 4. Khôi phục refreshToken từ localStorage

```typescript
private restoreAuthState(): void {
  const data: LoginResponse = JSON.parse(userData);
  this.accessToken = data.token ?? '';
  this.refreshToken = data.refreshToken ?? ''; // ✅ Khôi phục refreshToken
  // ...
}
```

### Kết quả

- ✅ Logout API nhận đúng refreshToken
- ✅ Backend có thể revoke/invalidate token
- ✅ Không còn lỗi 400
- ✅ User có thể logout thành công

### Lưu ý bảo mật

- RefreshToken được lưu trong localStorage (có thể bị XSS)
- Nếu cần bảo mật cao hơn, backend nên:
  - Lưu refreshToken trong HttpOnly Cookie
  - Lấy refreshToken từ cookie thay vì request body
  - Không yêu cầu client gửi refreshToken

---

## 🔐 CẢI TIẾN BẢO MẬT V2: Không lưu tokens vào localStorage

### Vấn đề bảo mật của phiên bản cũ

- ❌ Lưu `accessToken` và `refreshToken` vào localStorage
- ❌ Dễ bị tấn công XSS (Cross-Site Scripting)
- ❌ Tokens có thể bị đánh cắp qua JavaScript malicious

### Giải pháp mới (An toàn hơn)

#### 1. Tokens CHỈ tồn tại trong memory

```typescript
// Chỉ lưu trong biến private, KHÔNG localStorage
private accessToken: string | null = null;
private refreshToken: string | null = null;
```

#### 2. localStorage CHỈ lưu user info (không nhạy cảm)

```typescript
private saveAuthToLocalStorage(data: LoginResponse): void {
  const userInfo = {
    userId: data.userId,
    username: data.username,
    email: data.email,
    role: data.role,
    // ✅ KHÔNG lưu token và refreshToken
  };
  localStorage.setItem('currentUser', JSON.stringify(userInfo));
}
```

#### 3. Khi F5 (reload page)

- ✅ User info được restore từ localStorage
- ⚠️ Tokens bị mất (vì chỉ ở memory)
- 🔄 Gọi `refreshOnLoad()` với refreshToken từ memory
- ❌ Nếu không có refreshToken → User phải login lại

#### 4. Sử dụng API refreshToken từ backend

```typescript
public refreshOnLoad(): Observable<any> {
  if (!this.refreshToken) {
    return of(null); // Không có token, cần login lại
  }

  const refreshCommand = new RefreshTokenCommand({
    refreshToken: this.refreshToken,
  });

  return this.authClient.refreshToken(refreshCommand).pipe(
    tap((response: RefreshTokenResponse) => {
      // Cập nhật cả accessToken và refreshToken mới
      this.setAuthState(
        response.accessToken ?? '',
        response.refreshToken ?? '',
        currentUser
      );
    })
  );
}
```

#### 5. Logout gửi refreshToken để revoke

```typescript
public logout(): Observable<ResultOfBoolean> {
  const logoutCommand = new LogoutCommand({
    refreshToken: this.refreshToken ?? '',
  });

  return this.authClient.logout(logoutCommand).pipe(
    finalize(() => {
      this.clearAuthState(); // Clear memory
      this.clearLocalStorage(); // Clear user info
    })
  );
}
```

### So sánh

| Tính năng        | Phiên bản cũ    | Phiên bản mới   |
| ---------------- | --------------- | --------------- |
| Lưu accessToken  | localStorage ❌ | Memory only ✅  |
| Lưu refreshToken | localStorage ❌ | Memory only ✅  |
| Lưu user info    | localStorage ✅ | localStorage ✅ |
| Bảo mật XSS      | Thấp ❌         | Cao ✅          |
| Khi F5           | Giữ tokens ✅   | Mất tokens ⚠️   |
| Logout           | Gửi token ✅    | Gửi token ✅    |

### Ưu điểm

- ✅ **An toàn hơn**: Tokens không thể bị đánh cắp qua XSS
- ✅ **Tự động expire**: Tokens mất khi đóng tab/browser
- ✅ **Vẫn có refresh**: Dùng API refreshToken để gia hạn
- ✅ **Logout đúng**: Backend có thể revoke token

### Nhược điểm

- ⚠️ **User phải login lại** khi F5 (nếu refreshToken đã mất từ memory)
- ⚠️ **Không "remember me"** được lâu dài

### Khuyến nghị cho production

Để UX tốt hơn, có thể kết hợp:

1. **Session ngắn** (hiện tại): Tokens trong memory
2. **Remember me**: Backend lưu refreshToken trong HttpOnly Cookie
3. **Khi F5**: Gọi API refresh với cookie để lấy token mới
4. **2FA**: Thêm xác thực 2 lớp cho bảo mật cao

### Lưu ý khi deploy

- Đảm bảo HTTPS để tránh man-in-the-middle
- Set CORS đúng để chỉ domain của bạn gọi được API
- Implement rate limiting cho API refresh và login
- Log các hoạt động refresh/logout để phát hiện bất thường

---

## 🔧 FIX CRITICAL: Lỗi 401 sau một thời gian sử dụng

### Vấn đề phát hiện

- ❌ Sau một thời gian, mọi request đều trả về 401
- ❌ Logout cũng bị 401
- ❌ UI vẫn hiển thị đã login nhưng không thể thực hiện action nào
- ❌ Khi F5, tokens bị mất hoàn toàn

### Nguyên nhân gốc rễ

#### 1. Tokens không được restore khi F5

```typescript
// ❌ TRƯỚC: Chỉ restore user info, không có tokens
private restoreAuthState(): void {
  const user = JSON.parse(localStorage.getItem('currentUser'));
  this.currentUserSubject.next(user); // ✅ User info OK
  // ❌ accessToken = null
  // ❌ refreshToken = null
}
```

#### 2. Không có Auth Interceptor

- ❌ Không thêm Authorization header vào request
- ❌ Không xử lý lỗi 401 để tự động refresh
- ❌ Chỉ có CredentialInterceptor (chỉ set withCredentials)

#### 3. RefreshToken không được lưu

- ❌ Chỉ lưu user info vào localStorage
- ❌ RefreshToken bị mất khi F5
- ❌ Không thể refresh để lấy accessToken mới

### Giải pháp đã áp dụng

#### 1. ✅ Lưu refreshToken vào localStorage

```typescript
private saveAuthToLocalStorage(data: LoginResponse): void {
  const authData = {
    userId: data.userId,
    username: data.username,
    email: data.email,
    role: data.role,
    refreshToken: data.refreshToken, // ✅ Lưu để có thể refresh khi F5
  };
  localStorage.setItem('currentUser', JSON.stringify(authData));
}
```

#### 2. ✅ Tự động refresh khi restore

```typescript
private restoreAuthState(): void {
  const data = JSON.parse(localStorage.getItem('currentUser'));

  // Restore user và refreshToken
  this.refreshToken = data.refreshToken;
  this.currentUserSubject.next(user);

  // ✅ Tự động gọi refresh để lấy accessToken mới
  if (this.refreshToken) {
    this.refreshOnLoad().subscribe({
      next: () => console.log('✅ Đã refresh accessToken'),
      error: () => this.clearAuthState(), // Clear nếu refresh thất bại
    });
  }
}
```

#### 3. ✅ Tạo AuthInterceptor đầy đủ

```typescript
@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  intercept(request: HttpRequest<any>, next: HttpHandler) {
    // 1. Thêm Authorization header
    const token = this.authService.currentAccessToken;
    if (token) {
      request = request.clone({
        setHeaders: { Authorization: `Bearer ${token}` },
      });
    }

    // 2. Xử lý lỗi 401
    return next.handle(request).pipe(
      catchError((error) => {
        if (error.status === 401) {
          return this.handle401Error(request, next);
        }
        return throwError(() => error);
      })
    );
  }

  // 3. Tự động refresh khi gặp 401
  private handle401Error(request, next) {
    return this.authService.handleRefresh().pipe(
      switchMap((newToken) => {
        // Retry request với token mới
        return next.handle(this.addToken(request, newToken));
      })
    );
  }
}
```

#### 4. ✅ Đăng ký interceptor trong app.config

```typescript
providers: [
  { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },
  { provide: HTTP_INTERCEPTORS, useClass: CredentialInterceptor, multi: true },
];
```

### Flow hoạt động mới

#### Khi Login

1. User login → Nhận `accessToken` và `refreshToken`
2. Lưu vào memory: `this.accessToken`, `this.refreshToken`
3. Lưu vào localStorage: user info + `refreshToken`

#### Khi F5 (Reload)

1. Restore user info và `refreshToken` từ localStorage
2. Tự động gọi `refreshOnLoad()` với `refreshToken`
3. Nhận `accessToken` mới từ backend
4. Lưu vào memory, sẵn sàng sử dụng

#### Khi gọi API

1. AuthInterceptor thêm `Authorization: Bearer {accessToken}`
2. Nếu nhận 401 → Tự động gọi `handleRefresh()`
3. Lấy `accessToken` mới
4. Retry request với token mới

#### Khi Logout

1. Gửi `refreshToken` để backend revoke
2. Clear memory và localStorage
3. Redirect về login

### Kết quả

- ✅ Không còn lỗi 401 bất ngờ
- ✅ Tự động refresh khi token hết hạn
- ✅ F5 không mất session
- ✅ Logout hoạt động đúng
- ✅ UX mượt mà, không bị gián đoạn

### Lưu ý bảo mật

#### RefreshToken trong localStorage

- ⚠️ Vẫn có rủi ro XSS
- ✅ Nhưng tốt hơn là mất session hoàn toàn
- ✅ AccessToken ngắn hạn (vài phút) → Giảm rủi ro
- ✅ RefreshToken có thể revoke từ backend

#### Khuyến nghị production

1. **HTTPS bắt buộc** - Tránh MITM
2. **CSP (Content Security Policy)** - Chống XSS
3. **HttpOnly Cookie cho refreshToken** - An toàn nhất (nếu backend hỗ trợ)
4. **Short-lived accessToken** - 5-15 phút
5. **Refresh token rotation** - Mỗi lần refresh, cấp refreshToken mới
6. **Rate limiting** - Giới hạn số lần refresh
7. **Audit log** - Theo dõi hoạt động refresh/logout bất thường

### So sánh trước và sau

| Tính năng            | Trước             | Sau                 |
| -------------------- | ----------------- | ------------------- |
| Authorization header | ❌ Không có       | ✅ Tự động thêm     |
| Xử lý 401            | ❌ Không          | ✅ Auto refresh     |
| F5 giữ session       | ❌ Mất hẳn        | ✅ Tự động restore  |
| RefreshToken         | ❌ Không lưu      | ✅ Lưu localStorage |
| Logout               | ❌ Lỗi 401        | ✅ Hoạt động đúng   |
| UX                   | ❌ Phải login lại | ✅ Mượt mà          |
