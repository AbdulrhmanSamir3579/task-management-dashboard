import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { ApiError } from './api-error';
import { errorInterceptor } from './error.interceptor';

describe('errorInterceptor', () => {
  let http: HttpClient;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([errorInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    http = TestBed.inject(HttpClient);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpTesting.verify());

  it('passes successful responses through untouched', async () => {
    const response = firstValueFrom(http.get('api/tasks'));
    httpTesting.expectOne('api/tasks').flush({ tasks: [] });
    expect(await response).toEqual({ tasks: [] });
  });

  it('turns HTTP failures into ApiError', async () => {
    const response = firstValueFrom(http.delete('api/tasks/task-999'));
    httpTesting
      .expectOne('api/tasks/task-999')
      .flush({ message: 'Task task-999 was not found.' }, { status: 404, statusText: 'Not Found' });

    await expect(response).rejects.toBeInstanceOf(ApiError);
    await expect(response).rejects.toMatchObject({
      kind: 'not_found',
      message: 'Task task-999 was not found.',
    });
  });

  it('reports a lost connection as a network error', async () => {
    const response = firstValueFrom(http.get('api/tasks'));
    httpTesting.expectOne('api/tasks').error(new ProgressEvent('error'));

    await expect(response).rejects.toMatchObject({ kind: 'network', status: 0, retryable: true });
  });
});
