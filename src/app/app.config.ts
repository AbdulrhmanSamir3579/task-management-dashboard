import { type ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { provideApiHttpClient } from './core/http/provide-api-http-client';
import { failureRateFromUrl, provideMockApi } from './core/mock-api/provide-mock-api';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideApiHttpClient(),
    // Must come after provideApiHttpClient(): it replaces the default backend.
    provideMockApi({ failureRate: failureRateFromUrl(window.location.search) }),
  ],
};
