# HttpOnly Cookie Architecture - Auth Service

## Tổng quan

Auth service đã được cập nhật để sử dụng **HttpOnly Cookie** cho refreshToken - đây là cách an toàn nhất để lưu trữ refresh tokens.

## Kiến trúc mới

### Frontend (Angular)

- ✅ **AccessToken**: Lưu trong memory (biến private)
- ✅ **RefreshToken**: KHÔNG lưu (backend quản lý qua HttpOnly Cookie)
- ✅ **User Info**: Lưu trong localStorage (không nhạy cảm)

### Backend

- ✅ **RefreshToken**: Lưu trong HttpOnly Cookie
- ✅ **Cookie Settings**: HttpOnly, Secure, SameSite=Strict
- ✅ **Auto-send**: Browser tự động gửi cookie với mọi request

## So sánh với kiến trúc cũ

| Tính năng         | Cũ (localStorage) | Mới (HttpOnly Cookie) |
| ----------------- | ----------------- | --------------------- |
| Lưu refreshToken  | localStorage ❌   | HttpOnly Cookie ✅    |
| Bảo mật XSS       | Thấp ❌           | Cao ✅                |
| JavaScript access | Có ❌             | Không ✅              |
| Auto-send         | Không             | Có ✅                 |
| CSRF protection   | Không             | Cần SameSite ✅       |

## Flow hoạt động

### 1. Login

```typescript
// Frontend gọi API login
this.authService.login({ username, password }).subscribe((result) => {
  // Backend response:
  // - Body: { accessToken, userId, username, email }
  // - Set-Cookie: refreshToken=xxx; HttpOnly; Secure; SameSite=Strict
  // Frontend lưu:
  // - accessToken → memory
  // - user info → localStorage
  // - refreshToken → KHÔNG lưu (đã có trong cookie)
});
```

**Backend (C#/.NET):**

```csharp
[HttpPost("login")]
public async Task<IActionResult> Login(LoginCommand request)
{
    var user = await ValidateUser(request);
    var accessToken = GenerateAccessToken(user);
    var refreshToken = GenerateRefreshToken(user.Id);

    // Lưu refreshToken vào database
    await _db.RefreshTokens.AddAsync(refreshToken);
    await _db.SaveChangesAsync();

    // Set HttpOnly Cookie
    Response.Cookies.Append("refreshToken", refreshToken.Token, new CookieOptions
    {
        HttpOnly = true,      // ✅ JavaScript không thể access
        Secure = true,        // ✅ Chỉ gửi qua HTTPS
        SameSite = SameSiteMode.Strict, // ✅ Chống CSRF
        Expires = refreshToken.ExpiresAt,
        Path = "/",
        Domain = null // Same domain only
    });

    return Ok(new LoginResponse
    {
        AccessToken = accessToken,
        UserId = user.Id,
        Username = user.Username,
        Email = user.Email
        // KHÔNG trả refreshToken trong body
    });
}
```

### 2. Refresh Token (F5 hoặc 401)

```typescript
// Frontend gọi API refresh
this.authService.refreshOnLoad().subscribe((result) => {
  // Request tự động gửi cookie (withCredentials: true)
  // Backend lấy refreshToken từ cookie
  // Response: { accessToken }
});
```

**Backend:**

```csharp
[HttpPost("refresh-token")]
public async Task<IActionResult> RefreshToken()
{
    // Lấy refreshToken từ cookie
    var refreshToken = Request.Cookies["refreshToken"];

    if (string.IsNullOrEmpty(refreshToken))
        return Unauthorized("No refresh token");

    var token = await _db.RefreshTokens
        .Include(x => x.User)
        .FirstOrDefaultAsync(x => x.Token == refreshToken);

    if (token == null || token.ExpiresAt < DateTime.UtcNow || token.IsRevoked)
        return Unauthorized("Invalid refresh token");

    // Tạo accessToken mới
    var newAccessToken = GenerateAccessToken(token.User);

    // Optional: Rotate refreshToken (tạo mới)
    if (ShouldRotateRefreshToken(token))
    {
        token.IsRevoked = true;
        var newRefreshToken = GenerateRefreshToken(token.UserId);
        await _db.RefreshTokens.AddAsync(newRefreshToken);
        await _db.SaveChangesAsync();

        // Update cookie với token mới
        Response.Cookies.Append("refreshToken", newRefreshToken.Token, new CookieOptions
        {
            HttpOnly = true,
            Secure = true,
            SameSite = SameSiteMode.Strict,
            Expires = newRefreshToken.ExpiresAt
        });
    }

    return Ok(new RefreshTokenResponse
    {
        AccessToken = newAccessToken
    });
}
```

### 3. Logout

```typescript
// Frontend gọi API logout
this.authService.logout().subscribe(() => {
  // Backend xóa cookie
  // Frontend clear memory và localStorage
});
```

**Backend:**

```csharp
[HttpPost("logout")]
public async Task<IActionResult> Logout()
{
    var refreshToken = Request.Cookies["refreshToken"];

    if (!string.IsNullOrEmpty(refreshToken))
    {
        // Revoke token trong database
        var token = await _db.RefreshTokens
            .FirstOrDefaultAsync(x => x.Token == refreshToken);

        if (token != null)
        {
            token.IsRevoked = true;
            token.RevokedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();
        }
    }

    // Xóa cookie
    Response.Cookies.Delete("refreshToken", new CookieOptions
    {
        HttpOnly = true,
        Secure = true,
        SameSite = SameSiteMode.Strict,
        Path = "/"
    });

    return Ok(new { success = true });
}
```

## Frontend Code Changes

### Auth Service

```typescript
// ❌ CŨ: Lưu refreshToken vào localStorage
private saveAuthToLocalStorage(data: LoginResponse): void {
  const authData = {
    userId: data.userId,
    username: data.username,
    email: data.email,
    refreshToken: data.refreshToken // ❌ Không an toàn
  };
  localStorage.setItem('currentUser', JSON.stringify(authData));
}

// ✅ MỚI: KHÔNG lưu refreshToken
private saveAuthToLocalStorage(data: LoginResponse): void {
  const authData = {
    userId: data.userId,
    username: data.username,
    email: data.email
    // ✅ Không lưu refreshToken
  };
  localStorage.setItem('currentUser', JSON.stringify(authData));
}
```

### Refresh Token

```typescript
// ❌ CŨ: Gửi refreshToken trong body
public refreshOnLoad(): Observable<any> {
  const refreshCommand = new RefreshTokenCommand({
    refreshToken: this.refreshToken // ❌ Từ localStorage
  });
  return this.authClient.refreshToken(refreshCommand);
}

// ✅ MỚI: Backend lấy từ cookie
public refreshOnLoad(): Observable<any> {
  const refreshCommand = new RefreshTokenCommand({
    refreshToken: '' // ✅ Backend lấy từ cookie
  });
  return this.authClient.refreshToken(refreshCommand);
}
```

### System Admin Service

```typescript
// Đảm bảo withCredentials: true để gửi cookie
refreshToken(request: RefreshTokenCommand): Observable<ResultOfRefreshTokenResponse> {
  let options_ : any = {
    body: content_,
    observe: 'response',
    responseType: 'blob',
    withCredentials: true, // ✅ Quan trọng!
    headers: new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    })
  };

  return this.http.request('post', url_, options_);
}
```

## CORS Configuration

### Backend CORS Settings

```csharp
// Startup.cs hoặc Program.cs
services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", builder =>
    {
        builder
            .WithOrigins("http://localhost:4200") // Frontend URL
            .AllowCredentials() // ✅ Quan trọng cho cookies
            .AllowAnyMethod()
            .AllowAnyHeader();
    });
});

app.UseCors("AllowFrontend");
```

### Frontend Interceptor

```typescript
// Đảm bảo mọi request đều có withCredentials
@Injectable()
export class CredentialInterceptor implements HttpInterceptor {
  intercept(request: HttpRequest<any>, next: HttpHandler) {
    request = request.clone({
      withCredentials: true, // ✅ Tự động gửi cookies
    });
    return next.handle(request);
  }
}
```

## Security Best Practices

### 1. Cookie Settings

```csharp
new CookieOptions
{
    HttpOnly = true,      // ✅ Chống XSS
    Secure = true,        // ✅ Chỉ HTTPS
    SameSite = SameSiteMode.Strict, // ✅ Chống CSRF
    Expires = DateTime.UtcNow.AddDays(30),
    Path = "/",
    Domain = null // Same domain only
}
```

### 2. RefreshToken Rotation

```csharp
// Mỗi lần refresh, tạo token mới và revoke token cũ
private bool ShouldRotateRefreshToken(RefreshToken token)
{
    // Rotate nếu token đã dùng > 1 ngày
    return (DateTime.UtcNow - token.CreatedAt).TotalDays > 1;
}
```

### 3. Token Expiry

```csharp
// AccessToken: Ngắn hạn (5-15 phút)
var accessToken = new JwtSecurityToken(
    expires: DateTime.UtcNow.AddMinutes(15)
);

// RefreshToken: Dài hạn (7-30 ngày)
var refreshToken = new RefreshToken
{
    ExpiresAt = DateTime.UtcNow.AddDays(30)
};
```

### 4. Audit Logging

```csharp
// Log mọi hoạt động refresh/logout
await _auditLog.LogAsync(new AuditLog
{
    UserId = user.Id,
    Action = "RefreshToken",
    IpAddress = HttpContext.Connection.RemoteIpAddress?.ToString(),
    UserAgent = Request.Headers["User-Agent"],
    Timestamp = DateTime.UtcNow
});
```

## Testing

### Test Login

```typescript
it('should login and set cookie', async () => {
  const response = await request(app)
    .post('/api/Auth/login')
    .send({ username: 'test', password: 'test123' });

  expect(response.status).toBe(200);
  expect(response.body.accessToken).toBeDefined();
  expect(response.headers['set-cookie']).toBeDefined();
  expect(response.headers['set-cookie'][0]).toContain('refreshToken');
  expect(response.headers['set-cookie'][0]).toContain('HttpOnly');
});
```

### Test Refresh

```typescript
it('should refresh token using cookie', async () => {
  // Login first
  const loginRes = await request(app)
    .post('/api/Auth/login')
    .send({ username: 'test', password: 'test123' });

  const cookie = loginRes.headers['set-cookie'];

  // Refresh with cookie
  const refreshRes = await request(app).post('/api/Auth/refresh-token').set('Cookie', cookie);

  expect(refreshRes.status).toBe(200);
  expect(refreshRes.body.accessToken).toBeDefined();
});
```

## Troubleshooting

### 1. Cookie không được gửi

**Vấn đề**: Request không có cookie

**Giải pháp**:

- ✅ Check `withCredentials: true` trong Angular
- ✅ Check CORS `AllowCredentials()` trong backend
- ✅ Check domain/path của cookie

### 2. CORS Error

**Vấn đề**: "Access-Control-Allow-Credentials" error

**Giải pháp**:

```csharp
// Backend phải có
.AllowCredentials()
.WithOrigins("http://localhost:4200") // Không dùng "*"
```

### 3. Cookie bị xóa khi đóng browser

**Vấn đề**: Session cookie thay vì persistent

**Giải pháp**:

```csharp
// Phải set Expires
Expires = DateTime.UtcNow.AddDays(30)
```

## Migration từ localStorage

### Bước 1: Update Backend

1. Thêm cookie handling trong Login/Refresh/Logout
2. Update CORS settings
3. Test với Postman

### Bước 2: Update Frontend

1. Remove refreshToken từ localStorage
2. Update refresh methods
3. Test login/logout/refresh

### Bước 3: Clear old data

```typescript
// Trong migration script hoặc app init
if (localStorage.getItem('currentUser')) {
  const data = JSON.parse(localStorage.getItem('currentUser'));
  if (data.refreshToken) {
    // Remove old refreshToken
    delete data.refreshToken;
    localStorage.setItem('currentUser', JSON.stringify(data));
  }
}
```

## Kết luận

HttpOnly Cookie là cách **AN TOÀN NHẤT** để lưu refreshToken:

- ✅ Chống XSS (JavaScript không thể access)
- ✅ Tự động gửi với mọi request
- ✅ Browser quản lý expiry
- ✅ Có thể set Secure (HTTPS only)
- ✅ Có thể set SameSite (chống CSRF)

Frontend giờ đơn giản hơn, chỉ cần:

- Lưu accessToken trong memory
- Lưu user info trong localStorage
- Backend lo phần còn lại!
