import { HttpErrorResponse } from '@angular/common/http';
import { ApiError, errorKindFor, toApiError } from './api-error';

const httpError = (status: number, error: unknown = null) =>
  new HttpErrorResponse({ status, error, url: 'api/tasks' });

describe('errorKindFor', () => {
  it.each([
    [0, 'network'],
    [400, 'validation'],
    [401, 'unauthorized'],
    [403, 'forbidden'],
    [404, 'not_found'],
    [409, 'conflict'],
    [422, 'validation'],
    [429, 'rate_limited'],
    [500, 'server'],
    [503, 'server'],
    [418, 'unknown'],
  ])('maps %d to %s', (status, kind) => {
    expect(errorKindFor(status)).toBe(kind);
  });
});

describe('toApiError', () => {
  it('keeps the server message for client errors', () => {
    const error = toApiError(httpError(422, { message: 'Title is required.' }));

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({
      kind: 'validation',
      message: 'Title is required.',
      status: 422,
      url: 'api/tasks',
      name: 'ApiError',
    });
  });

  it('hides technical server messages behind a generic one', () => {
    const error = toApiError(httpError(500, { message: 'NullPointerException at line 42' }));
    expect(error.message).toBe('Something went wrong on our side. Please try again.');
  });

  it.each([
    ['no body', null],
    ['a blank message', { message: '   ' }],
    ['a non-string message', { message: 42 }],
    ['a body without message', { detail: 'x' }],
  ])('falls back to the default message for %s', (_, body) => {
    expect(toApiError(httpError(404, body)).message).toBe('The requested item could not be found.');
  });
});

describe('ApiError.retryable', () => {
  it.each([
    [0, true],
    [429, true],
    [503, true],
    [404, false],
    [422, false],
  ])('for status %d is %s', (status, retryable) => {
    expect(toApiError(httpError(status)).retryable).toBe(retryable);
  });
});
