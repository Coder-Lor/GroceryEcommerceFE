import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpResponse,
} from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class ResponseTransformInterceptor implements HttpInterceptor {
  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Kiểm tra nếu request đến API (code gen NSwag thường dùng blob responseType)
    const isApiRequest = request.url.includes('/api/');
    
    return next.handle(request).pipe(
      map((event: HttpEvent<any>) => {
        // Chỉ xử lý HttpResponse thành công cho API requests
        if (event instanceof HttpResponse && isApiRequest) {
          const response = event;
          const body = response.body;
          
          // Xử lý khi body là object (không phải Blob) - trường hợp với withFetch()
          // Khi dùng withFetch() và responseType blob, Angular có thể parse thành object
          if (body && typeof body === 'object' && !(body instanceof Blob) && !(body instanceof ArrayBuffer)) {
            try {
              // Convert object thành Blob với JSON string
              const jsonString = JSON.stringify(body);
              const blob = new Blob([jsonString], { type: 'application/json' });
              
              // Tạo HttpResponse mới với Blob
              return response.clone({
                body: blob
              });
            } catch (error) {
              console.error('ResponseTransformInterceptor - Error converting object to Blob:', error, body);
              return event;
            }
          }
          
          // Xử lý trường hợp body là string "[object Object]"
          if (typeof body === 'string' && body === '[object Object]') {
            const blob = new Blob(['null'], { type: 'application/json' });
            return response.clone({
              body: blob
            });
          }
          
          // Xử lý trường hợp body là string nhưng không phải JSON hợp lệ
          if (typeof body === 'string' && body.startsWith('[object')) {
            console.warn('ResponseTransformInterceptor - Invalid string response:', body);
            const blob = new Blob(['null'], { type: 'application/json' });
            return response.clone({
              body: blob
            });
          }
        }
        
        return event;
      })
    );
  }
}

