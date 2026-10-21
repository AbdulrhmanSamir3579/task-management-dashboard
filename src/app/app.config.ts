import { provideHttpClient } from '@angular/common/http';
import { type ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { failureRateFromUrl, provideMockApi } from './core/mock-api/provide-mock-api';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(),
    // Must come after provideHttpClient(): it replaces the default backend.
    provideMockApi({ failureRate: failureRateFromUrl(window.location.search) }),
  ],
};
