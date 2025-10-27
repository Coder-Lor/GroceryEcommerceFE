import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import { appRouter } from './app/app.routes';

bootstrapApplication(App, {
  ...appConfig,
  providers: [...(appConfig.providers || []), appRouter],
}).catch((err) => console.error(err));
