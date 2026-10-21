import { HttpBackend } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { appConfig } from './app.config';
import { MockHttpBackend } from './core/mock-api/mock-http-backend';

describe('appConfig', () => {
  it('serves HTTP requests from the in-memory mock backend', () => {
    TestBed.configureTestingModule({ providers: appConfig.providers });

    expect(TestBed.inject(HttpBackend)).toBeInstanceOf(MockHttpBackend);
  });
});
