import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { provideMockApi } from '../mock-api/provide-mock-api';
import type { User } from '../models';
import { ApiError } from './api-error';
import { HttpBaseService } from './http-base.service';
import { provideApiHttpClient } from './provide-api-http-client';
import { RETRY_CONFIG } from './retry.interceptor';

/**
 * The whole chain against the in-memory API. Each backend call draws one random number:
 * below 0.5 it fails with 503, so `draws` scripts the failures.
 */
describe('provideApiHttpClient', () => {
  let http: HttpBaseService;
  let draws: number[];
  let backendCalls: number;

  beforeEach(() => {
    draws = [];
    backendCalls = 0;
    TestBed.configureTestingModule({
      providers: [
        provideApiHttpClient(),
        provideMockApi({
          delay: 0,
          failureRate: 0.5,
          random: () => {
            backendCalls++;
            return draws.shift() ?? 0.9;
          },
        }),
        { provide: RETRY_CONFIG, useValue: { maxRetries: 3, baseDelayMs: 0 } },
      ],
    });
    http = TestBed.inject(HttpBaseService);
  });

  it('recovers from transient server failures by retrying', async () => {
    draws = [0.1, 0.1];

    const users = await firstValueFrom(http.get<User[]>('users'));

    expect(users.length).toBeGreaterThan(0);
    expect(backendCalls).toBe(3);
  });

  it('reports a failure that outlasts every retry as an ApiError', async () => {
    draws = [0.1, 0.1, 0.1, 0.1];

    const request = firstValueFrom(http.get('users'));

    await expect(request).rejects.toBeInstanceOf(ApiError);
    await expect(request).rejects.toMatchObject({ kind: 'server', retryable: true });
    expect(backendCalls).toBe(4);
  });
});
