import type { HttpEvent, HttpResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { type Observable, finalize, share } from 'rxjs';
import { CLOCK } from '../time/clock';

interface CacheEntry {
  response: HttpResponse<unknown>;
  expiresAt: number;
}

/** In-memory store behind the cache interceptor. Keys are request URLs with params. */
@Injectable({ providedIn: 'root' })
export class HttpCacheService {
  private readonly now = inject(CLOCK);
  private readonly entries = new Map<string, CacheEntry>();
  private readonly inFlight = new Map<string, Observable<HttpEvent<unknown>>>();

  get size(): number {
    return this.entries.size;
  }

  /**
   * Returns a fresh entry, or `undefined` when missing or expired. Each caller gets its
   * own copy of the body, so one consumer mutating it cannot affect another.
   */
  get(key: string): HttpResponse<unknown> | undefined {
    const entry = this.entries.get(key);
    if (!entry) {
      return undefined;
    }
    if (entry.expiresAt <= this.now().getTime()) {
      this.entries.delete(key);
      return undefined;
    }
    return entry.response.clone({ body: structuredClone(entry.response.body) });
  }

  set(key: string, response: HttpResponse<unknown>, ttlMs: number): void {
    this.entries.set(key, { response, expiresAt: this.now().getTime() + ttlMs });
  }

  /**
   * Shares one in-flight request between concurrent callers with the same key,
   * so two components asking for the same data at once trigger a single request.
   */
  dedupe(key: string, request: Observable<HttpEvent<unknown>>): Observable<HttpEvent<unknown>> {
    const pending = this.inFlight.get(key);
    if (pending) {
      return pending;
    }
    const shared = request.pipe(
      finalize(() => this.inFlight.delete(key)),
      share(),
    );
    this.inFlight.set(key, shared);
    return shared;
  }

  /**
   * Removes entries for a collection: `api/tasks` clears `api/tasks`,
   * `api/tasks/1` and `api/tasks?x=1`, but not `api/tasks-archive`.
   */
  invalidate(collection: string): void {
    for (const key of this.entries.keys()) {
      if (
        key === collection ||
        key.startsWith(`${collection}/`) ||
        key.startsWith(`${collection}?`)
      ) {
        this.entries.delete(key);
      }
    }
  }

  clear(): void {
    this.entries.clear();
  }
}
