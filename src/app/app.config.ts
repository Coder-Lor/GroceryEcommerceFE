import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideZoneChangeDetection,
  LOCALE_ID,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideCharts, withDefaultRegisterables } from 'ng2-charts';

import { routes } from './app.routes';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';

import { providePrimeNG } from 'primeng/config';
import Aura from '@primeuix/themes/aura';
import { MessageService, ConfirmationService } from 'primeng/api';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideHttpClient, withFetch, HTTP_INTERCEPTORS } from '@angular/common/http';
import { AuthInterceptor } from './core/service/auth.interceptor';
import { ResponseTransformInterceptor } from './core/service/response-transform.interceptor';

import { registerLocaleData } from '@angular/common';
import localeVi from '@angular/common/locales/vi';

import { API_BASE_URL } from '@core/service/system-admin.service';
import { API_KEY } from './customer/shared/components/ai-chat/ai-chat.component';

registerLocaleData(localeVi);

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideClientHydration(withEventReplay()),
    provideAnimations(),
    providePrimeNG({
      theme: {
        preset: Aura,
        options: {
          prefix: 'p',
          darkModeSelector: 'system',
          cssLayer: false,
        },
      },
      ripple: true,
      inputVariant: 'filled',
    }),
    provideCharts(withDefaultRegisterables()),
    // Tạm thời bỏ withFetch() để test - có thể không tương thích với responseType blob
    // provideHttpClient(withFetch()),
    provideHttpClient(),
    { provide: HTTP_INTERCEPTORS, useClass: ResponseTransformInterceptor, multi: true },
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },
    { provide: LOCALE_ID, useValue: 'vi-VN' },
    MessageService,
    ConfirmationService,
    // { provide: API_BASE_URL, useValue: 'https://localhost:44394' },
    { provide: API_BASE_URL, useValue: "https://groceryecommercebe-bscbhpd4bgcma3gf.southeastasia-01.azurewebsites.net" },
    { provide: API_KEY, useValue: "AIzaSyBF8oMhqlgIExmjfNM4D41V8PWQJCbG25s" }
  ],
};
