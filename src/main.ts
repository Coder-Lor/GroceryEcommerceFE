import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import { appRouter } from './app/app.routes';

bootstrapApplication(App, {
  ...appConfig,
  providers: [
    ...(appConfig.providers || []),
    appRouter,
    // importProvidersFrom(HttpClientModule),
    // { provide: AppServices.API_BASE_URL, useValue: 'http://localhost:5026'},
    // AppServices.Service
  ]
})
  .catch((err) => console.error(err));
