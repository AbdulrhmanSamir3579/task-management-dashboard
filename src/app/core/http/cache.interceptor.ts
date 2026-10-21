import {
  HttpContext,
  HttpContextToken,
  type HttpInterceptorFn,
  HttpResponse,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { of, tap } from 'rxjs';
import { API_BASE_URL } from './http-base.service';
import { HttpCacheService } from './http-cache.service';

export interface CacheOptions {
  /** How long a response stays fresh, in milliseconds. */
  ttlMs: number;
}

export const DEFAULT_CACHE_TTL_MS = 30_000;

/** Set on a GET request to cache its response. Unset requests are never cached. */
export const CACHE = new HttpContextToken<CacheOptions | null>(() => null);

/** Extra collections a mutation makes stale, besides its own. */
export const INVALIDATES = new HttpContextToken<readonly string[]>(() => []);

/** Opts a GET request into caching: `context: withCache({ ttlMs: 60_000 })`. */
export function withCache(
  options: Partial<CacheOptions> = {},
  context = new HttpContext(),
): HttpContext {
  return context.set(CACHE, { ttlMs: DEFAULT_CACHE_TTL_MS, ...options });
}

/**
 * Declares related collections a mutation makes stale, e.g. a task change also adds
 * an entry to the activity feed: `context: invalidates(['activities'])`.
 */
export function invalidates(
  collections: readonly string[],
  context = new HttpContext(),
): HttpContext {
  return context.set(INVALIDATES, collections);
}

/** `api` → `api/`, `https://x.dev/v1/` → `https://x.dev/v1/`, `''` → `/`. */
function apiPrefix(baseUrl: string): string {
  return baseUrl ? `${baseUrl.replace(/\/+$/, '')}/` : '/';
}

/** Collection a URL belongs to: `api/tasks/task-001?x=1` → `api/tasks`. */
export function collectionOf(url: string, baseUrl: string): string {
  const prefix = apiPrefix(baseUrl);
  const path = url.split('?')[0] ?? url;
  if (!path.startsWith(prefix)) {
    return path;
  }
  const [collection = ''] = path.slice(prefix.length).split('/');
  return `${prefix}${collection}`;
}

/**
 * - GET with `withCache()`: served from memory while fresh; concurrent identical
 *   requests share one network call; only successful responses are stored.
 * - Successful POST/PUT/PATCH/DELETE: clears its collection plus any `invalidates([...])`,
 *   so the next read fetches fresh data.
 */
export const cacheInterceptor: HttpInterceptorFn = (req, next) => {
  const cache = inject(HttpCacheService);

  if (req.method !== 'GET') {
    const baseUrl = inject(API_BASE_URL);
    const stale = [
      collectionOf(req.url, baseUrl),
      ...req.context.get(INVALIDATES).map((name) => `${apiPrefix(baseUrl)}${name}`),
    ];
    return next(req).pipe(
      tap((event) => {
        if (event instanceof HttpResponse) {
          stale.forEach((collection) => cache.invalidate(collection));
        }
      }),
    );
  }

  const options = req.context.get(CACHE);
  if (!options) {
    return next(req);
  }

  const key = req.urlWithParams;
  const cached = cache.get(key);
  if (cached) {
    return of(cached);
  }

  return cache.dedupe(
    key,
    next(req).pipe(
      tap((event) => {
        if (event instanceof HttpResponse) {
          cache.set(key, event, options.ttlMs);
        }
      }),
    ),
  );
};
