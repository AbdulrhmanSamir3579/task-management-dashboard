import {
  type ApplicationConfig,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import {
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
import { IdlePreloadingStrategy } from './core/routing/idle-preloading.strategy';
import { failureRateFromUrl, provideMockApi } from './core/mock-api/provide-mock-api';
import { ThemeService } from './core/theme/theme.service';
import { provideUi } from './shared/ui/provide-ui';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(
      routes,
      withComponentInputBinding(),
      withViewTransitions(),
      withInMemoryScrolling({ scrollPositionRestoration: 'top' }),
      // Lazy pages are fetched in the background once the browser is idle, so navigation is
      // instant without slowing the first page.
      withPreloading(IdlePreloadingStrategy),
    ),
    { provide: TitleStrategy, useClass: AppTitleStrategy },
    provideUi(),
    // Applies the saved theme and keeps following it (and the device, for "system").
    provideAppInitializer(() => {
      inject(ThemeService);
    }),
    provideApiHttpClient(),
    // Must come after provideApiHttpClient(): it replaces the default backend.
    provideMockApi({ failureRate: failureRateFromUrl(window.location.search) }),
  ],
};
