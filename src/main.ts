import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';

import { AppComponent } from './app/app.component';
import { routes } from './app/app.routes';
import { baseUrlInterceptor } from './app/core/interceptors/base-url.interceptor';
import { httpErrorInterceptor } from './app/core/interceptors/http-error.interceptor';
import { APP_CONFIG, appConfigFactory } from './app/core/config/app-config';

bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(routes),
    provideHttpClient(
      withInterceptors([baseUrlInterceptor, httpErrorInterceptor])
    ),
    provideAnimations(),
    {
      provide: APP_CONFIG,
      useFactory: appConfigFactory
    }
  ]
}).catch(err => console.error(err));
