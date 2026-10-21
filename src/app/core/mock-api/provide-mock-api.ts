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
}

const DEFAULT_OPTIONS: MockApiOptions = { delay: 400 };

/**
 * Serves `api/*` requests from the in-memory database instead of the network.
 * Must be listed after `provideHttpClient()` so it replaces the default backend.
 */
export function provideMockApi(options: Partial<MockApiOptions> = {}): EnvironmentProviders {
  const { delay } = { ...DEFAULT_OPTIONS, ...options };
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
        ),
    },
  ]);
}
