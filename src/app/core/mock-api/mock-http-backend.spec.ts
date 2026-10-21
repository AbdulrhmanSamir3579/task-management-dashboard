import { HttpClient, HttpErrorResponse, provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import type { TasksResponse } from '../models';
import { type MockApiOptions, failureRateFromUrl, provideMockApi } from './provide-mock-api';

function setup(options: Partial<MockApiOptions>): HttpClient {
  TestBed.configureTestingModule({
    providers: [provideHttpClient(), provideMockApi({ delay: 0, ...options })],
  });
  return TestBed.inject(HttpClient);
}

describe('MockHttpBackend failure simulation', () => {
  it('fails API requests with 503 when the random draw is below the rate', async () => {
    const http = setup({ failureRate: 0.3, random: () => 0.1 });

    const request = firstValueFrom(http.get('api/tasks'));

    await expect(request).rejects.toBeInstanceOf(HttpErrorResponse);
    await expect(request).rejects.toMatchObject({
      status: 503,
      url: 'api/tasks',
      error: { message: expect.stringContaining('Simulated') },
    });
  });

  it('lets requests through when the random draw is above the rate', async () => {
    const http = setup({ failureRate: 0.3, random: () => 0.9 });

    const response = await firstValueFrom(http.get<TasksResponse>('api/tasks'));

    expect(response.tasks.length).toBeGreaterThan(0);
  });

  it('never fails with the default rate of 0', async () => {
    const http = setup({ random: () => 0 });

    await expect(firstValueFrom(http.get('api/users'))).resolves.toBeDefined();
  });
});

describe('failureRateFromUrl', () => {
  it.each([
    ['?chaos=0.3', 0.3],
    ['?chaos=1', 1],
    ['?chaos=5', 1],
    ['?chaos=-1', 0],
    ['?chaos=abc', 0],
    ['?other=1', 0],
    ['', 0],
  ])('reads %j as %d', (search, expected) => {
    expect(failureRateFromUrl(search)).toBe(expected);
  });
});
