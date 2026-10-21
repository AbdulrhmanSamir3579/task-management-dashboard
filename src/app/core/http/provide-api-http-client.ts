import { provideHttpClient, withInterceptors } from '@angular/common/http';
import type { EnvironmentProviders } from '@angular/core';
import { cacheInterceptor } from './cache.interceptor';
import { errorInterceptor } from './error.interceptor';
import { retryInterceptor } from './retry.interceptor';

/**
 * HttpClient with the app's interceptors. Requests pass through them in this order:
 *
 *   error → cache → retry → backend
 *
 * - the cache answers first, before any network work or retries;
 * - retries sit closest to the network, so one cached or shared call covers all attempts;
 * - the error interceptor only sees final failures, once retries are exhausted.
 */
export function provideApiHttpClient(): EnvironmentProviders {
  return provideHttpClient(
    withInterceptors([errorInterceptor, cacheInterceptor, retryInterceptor]),
  );
}
