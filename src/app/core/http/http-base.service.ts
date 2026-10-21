import {
  HttpClient,
  type HttpContext,
  type HttpHeaders,
  HttpParams,
  type HttpResourceOptions,
  type HttpResourceRef,
  HttpUrlEncodingCodec,
  httpResource,
} from '@angular/common/http';
import { Injectable, InjectionToken, inject } from '@angular/core';
import type { Observable } from 'rxjs';

/** Base path of the API. Relative, so it keeps working under any `<base href>`. */
export const API_BASE_URL = new InjectionToken<string>('API_BASE_URL', {
  providedIn: 'root',
  factory: () => 'api',
});

type ParamPrimitive = string | number | boolean;
export type ParamValue =
  ParamPrimitive | null | undefined | readonly (ParamPrimitive | null | undefined)[];
export type QueryParams = Readonly<Record<string, ParamValue>>;

export interface RequestOptions {
  /** Empty values are skipped; arrays repeat the key (`?tag=a&tag=b`). */
  params?: QueryParams;
  headers?: HttpHeaders | Record<string, string | string[]>;
  /** Per-request metadata read by interceptors. */
  context?: HttpContext;
}

/** A GET request described by endpoint and options, as used by `resource()`. */
export interface ResourceRequest extends RequestOptions {
  endpoint: string;
}

/**
 * Keeps `[` and `]` readable in keys such as `filter[status]` and fully encodes values
 * (Angular's default codec leaves characters like `+` and `/` unencoded).
 */
class ApiParameterCodec extends HttpUrlEncodingCodec {
  override encodeKey(key: string): string {
    return encodeURIComponent(key).replace(/%5B/g, '[').replace(/%5D/g, ']');
  }

  override encodeValue(value: string): string {
    return encodeURIComponent(value);
  }
}

/**
 * The single entry point for HTTP in the app. Services inject this instead of
 * `HttpClient` (enforced by ESLint), so the base URL, parameter serialisation and
 * request options are handled in one place. Errors are left to the error interceptor.
 */
@Injectable({ providedIn: 'root' })
export class HttpBaseService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);
  private readonly encoder = new ApiParameterCodec();

  get<T>(endpoint: string, options: RequestOptions = {}): Observable<T> {
    return this.http.get<T>(this.createUrl(endpoint), this.toHttpOptions(options));
  }

  post<T, B = unknown>(endpoint: string, body: B, options: RequestOptions = {}): Observable<T> {
    return this.http.post<T>(this.createUrl(endpoint), body, this.toHttpOptions(options));
  }

  put<T, B = unknown>(endpoint: string, body: B, options: RequestOptions = {}): Observable<T> {
    return this.http.put<T>(this.createUrl(endpoint), body, this.toHttpOptions(options));
  }

  patch<T, B = unknown>(endpoint: string, body: B, options: RequestOptions = {}): Observable<T> {
    return this.http.patch<T>(this.createUrl(endpoint), body, this.toHttpOptions(options));
  }

  delete<T = void>(endpoint: string, options: RequestOptions = {}): Observable<T> {
    return this.http.delete<T>(this.createUrl(endpoint), this.toHttpOptions(options));
  }

  /** DELETE with a request body, e.g. bulk deletes with `{ ids: string[] }`. */
  deleteWithBody<T = void, B = unknown>(
    endpoint: string,
    body: B,
    options: RequestOptions = {},
  ): Observable<T> {
    return this.http.delete<T>(this.createUrl(endpoint), { ...this.toHttpOptions(options), body });
  }

  /**
   * Signal-based GET built on `httpResource`. Signals read inside `request` are tracked:
   * when they change, the request is sent again. Return `undefined` to skip the request.
   * Must be called in an injection context, e.g. a field initializer.
   */
  resource<T>(
    request: () => ResourceRequest | undefined,
    options: HttpResourceOptions<T, unknown> & { defaultValue: NoInfer<T> },
  ): HttpResourceRef<T>;
  resource<T>(
    request: () => ResourceRequest | undefined,
    options?: HttpResourceOptions<T, unknown>,
  ): HttpResourceRef<T | undefined>;
  resource<T>(
    request: () => ResourceRequest | undefined,
    options?: HttpResourceOptions<T, unknown>,
  ): HttpResourceRef<T | undefined> {
    return httpResource<T>(() => {
      const current = request();
      return current && { url: this.createUrl(current.endpoint), ...this.toHttpOptions(current) };
    }, options);
  }

  protected toHttpOptions({ params, headers, context }: RequestOptions) {
    return { params: this.createParams(params), headers, context };
  }

  protected createUrl(endpoint: string): string {
    if (/^https?:\/\//i.test(endpoint)) {
      return endpoint;
    }
    const base = this.baseUrl.replace(/\/+$/, '');
    const path = endpoint.replace(/^\/+/, '');
    return base ? `${base}/${path}` : `/${path}`;
  }

  private createParams(params: QueryParams = {}): HttpParams {
    let httpParams = new HttpParams({ encoder: this.encoder });
    for (const [key, value] of Object.entries(params)) {
      const values: readonly ParamValue[] = Array.isArray(value) ? value : [value];
      for (const item of values) {
        if (item !== null && item !== undefined && item !== '') {
          httpParams = httpParams.append(key, String(item));
        }
      }
    }
    return httpParams;
  }
}
