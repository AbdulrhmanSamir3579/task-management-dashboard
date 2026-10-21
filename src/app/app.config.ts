import { type ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import {
  PreloadAllModules,
  TitleStrategy,
  provideRouter,
  withComponentInputBinding,
  withInMemoryScrolling,
  withPreloading,
  withViewTransitions,
} from '@angular/router';
import { routes } from './app.routes';
import { provideApiHttpClient } from './core/http/provide-api-http-client';
import { AppTitleStrategy } from './core/layout/app-title.strategy';
import { failureRateFromUrl, provideMockApi } from './core/mock-api/provide-mock-api';
import { provideUi } from './shared/ui/provide-ui';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(
      routes,
      withComponentInputBinding(),
      withViewTransitions(),
      withInMemoryScrolling({ scrollPositionRestoration: 'top' }),
      // Lazy pages are fetched in the background after start-up, so navigation is instant.
      withPreloading(PreloadAllModules),
    ),
    { provide: TitleStrategy, useClass: AppTitleStrategy },
    provideUi(),
    provideApiHttpClient(),
    // Must come after provideApiHttpClient(): it replaces the default backend.
    provideMockApi({ failureRate: failureRateFromUrl(window.location.search) }),
  ],
};
