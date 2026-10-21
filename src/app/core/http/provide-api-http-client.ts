import { provideHttpClient, withInterceptors } from '@angular/common/http';
import type { EnvironmentProviders } from '@angular/core';
import { errorInterceptor } from './error.interceptor';
import { retryInterceptor } from './retry.interceptor';

/**
 * HttpClient with the app's interceptors, in this order:
 *
 *   error → retry → backend
 *
 * Retries sit closest to the network, so the error interceptor only sees final failures.
 * Loaded data is kept in the NgRx stores, not in an HTTP cache.
 */
export function provideApiHttpClient(): EnvironmentProviders {
  return provideHttpClient(withInterceptors([errorInterceptor, retryInterceptor]));
}
