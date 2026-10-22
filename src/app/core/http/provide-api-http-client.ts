import { provideHttpClient, withInterceptors } from '@angular/common/http';
import type { EnvironmentProviders } from '@angular/core';
import { errorInterceptor } from './error.interceptor';
import { languageInterceptor } from './language.interceptor';
import { retryInterceptor } from './retry.interceptor';

/**
 * HttpClient with the app's interceptors, in this order:
 *
 *   error → language → retry → backend
 *
 * Retries sit closest to the network, so the error interceptor only sees final failures.
 * The language interceptor adds `Accept-Language` to every request, retries included.
 * Loaded data is kept in the NgRx stores, not in an HTTP cache.
 */
export function provideApiHttpClient(): EnvironmentProviders {
  return provideHttpClient(
    withInterceptors([errorInterceptor, languageInterceptor, retryInterceptor]),
  );
}
