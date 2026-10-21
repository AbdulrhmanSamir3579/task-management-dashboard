import { XhrFactory } from '@angular/common';
import { HttpBackend } from '@angular/common/http';
import { type EnvironmentProviders, inject, makeEnvironmentProviders } from '@angular/core';
import {
  InMemoryBackendConfig,
  type InMemoryBackendConfigArgs,
  InMemoryDbService,
} from 'angular-in-memory-web-api';
import { InMemoryDataService } from './in-memory-data.service';
import { MockHttpBackend } from './mock-http-backend';

export interface MockApiOptions {
  /** Simulated network latency in milliseconds. */
  delay: number;
  /** Share of API requests that fail with 503, from 0 to 1. */
  failureRate: number;
  /** Source of randomness for failures; replaced in tests. */
  random: () => number;
}

const DEFAULT_OPTIONS: MockApiOptions = { delay: 400, failureRate: 0, random: Math.random };

/**
 * Reads the failure rate from a `?chaos=0.3` query parameter, clamped to 0..1.
 * Lets anyone open the demo with failures enabled to see retry and error states.
 */
export function failureRateFromUrl(search: string): number {
  const rate = Number(new URLSearchParams(search).get('chaos'));
  return Number.isFinite(rate) ? Math.min(Math.max(rate, 0), 1) : 0;
}

/**
 * Serves `api/*` requests from the in-memory database instead of the network.
 * Must be listed after `provideHttpClient()` so it replaces the default backend.
 */
export function provideMockApi(options: Partial<MockApiOptions> = {}): EnvironmentProviders {
  const { delay, failureRate, random } = { ...DEFAULT_OPTIONS, ...options };
  const config: InMemoryBackendConfigArgs = {
    apiBase: 'api/',
    delay,
    // Anything outside `api/` (translations, assets) still goes to the real network.
    passThruUnknownUrl: true,
  };

  return makeEnvironmentProviders([
    { provide: InMemoryDbService, useClass: InMemoryDataService },
    { provide: InMemoryBackendConfig, useValue: config },
    {
      provide: HttpBackend,
      useFactory: () =>
        new MockHttpBackend(
          inject(InMemoryDbService),
          inject(InMemoryBackendConfig),
          inject(XhrFactory),
          { rate: failureRate, random },
        ),
    },
  ]);
}
