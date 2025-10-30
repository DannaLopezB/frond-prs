import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { routes } from './app/app.routes';
import { appConfig } from './app/app.config';
import { LOCALE_ID } from '@angular/core';
import { registerLocaleData } from '@angular/common';
import localeEs from '@angular/common/locales/es';

registerLocaleData(localeEs, 'es');

bootstrapApplication(AppComponent, {
  providers: [
    provideHttpClient(withFetch()),  // ✅ Aquí se habilita fetch
    provideRouter(routes),
    { provide: LOCALE_ID, useValue: 'es' },
    ...appConfig.providers
  ]
})
.catch(err => console.error(err));
