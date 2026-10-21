import { HttpContext, HttpContextToken, provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ApplicationRef, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { API_BASE_URL, HttpBaseService } from './http-base.service';

describe('HttpBaseService', () => {
  let service: HttpBaseService;
  let httpTesting: HttpTestingController;

  function setup(baseUrl?: string): void {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        ...(baseUrl === undefined ? [] : [{ provide: API_BASE_URL, useValue: baseUrl }]),
      ],
    });
    service = TestBed.inject(HttpBaseService);
    httpTesting = TestBed.inject(HttpTestingController);
  }

  afterEach(() => httpTesting.verify());

  describe('urls', () => {
    it('prefixes endpoints with the default api base', () => {
      setup();
      service.get('tasks').subscribe();
      httpTesting.expectOne('api/tasks');
    });

    it('normalises slashes between base and endpoint', () => {
      setup('https://example.com/v1/');
      service.get('/tasks').subscribe();
      httpTesting.expectOne('https://example.com/v1/tasks');
    });

    it('uses a root-relative path when there is no base', () => {
      setup('');
      service.get('tasks').subscribe();
      httpTesting.expectOne('/tasks');
    });

    it('leaves absolute urls untouched', () => {
      setup();
      service.get('https://cdn.example.com/data.json').subscribe();
      httpTesting.expectOne('https://cdn.example.com/data.json');
    });
  });

  describe('query params', () => {
    it('skips empty values, repeats arrays and stringifies primitives', () => {
      setup();
      service
        .get('tasks', {
          params: {
            status: ['todo', 'done', null],
            search: '',
            assignee: undefined,
            archived: false,
            page: 2,
          },
        })
        .subscribe();

      const { request } = httpTesting.expectOne((req) => req.url === 'api/tasks');
      expect(request.params.getAll('status')).toEqual(['todo', 'done']);
      expect(request.params.has('search')).toBe(false);
      expect(request.params.has('assignee')).toBe(false);
      expect(request.params.get('archived')).toBe('false');
      expect(request.params.get('page')).toBe('2');
    });

    it('keeps brackets readable in keys and encodes values', () => {
      setup();
      service.get('tasks', { params: { 'filter[q]': 'a&b+c/d' } }).subscribe();

      const { request } = httpTesting.expectOne((req) => req.url === 'api/tasks');
      expect(request.urlWithParams).toBe('api/tasks?filter[q]=a%26b%2Bc%2Fd');
    });
  });

  describe('methods', () => {
    it('returns the response body', async () => {
      setup();
      const response = firstValueFrom(service.get<{ ok: boolean }>('health'));
      httpTesting.expectOne('api/health').flush({ ok: true });
      expect(await response).toEqual({ ok: true });
    });

    it.each([
      ['POST', (s: HttpBaseService) => s.post('tasks', { title: 'A' })],
      ['PUT', (s: HttpBaseService) => s.put('tasks/1', { title: 'A' })],
      ['PATCH', (s: HttpBaseService) => s.patch('tasks/1', { title: 'A' })],
      ['DELETE', (s: HttpBaseService) => s.deleteWithBody('tasks', { title: 'A' })],
    ])('sends %s with a body', (method, send) => {
      setup();
      send(service).subscribe();

      const { request } = httpTesting.expectOne((req) => req.method === method);
      expect(request.body).toEqual({ title: 'A' });
    });

    it('sends DELETE without a body', () => {
      setup();
      service.delete('tasks/1').subscribe();

      const { request } = httpTesting.expectOne('api/tasks/1');
      expect(request.method).toBe('DELETE');
      expect(request.body).toBeNull();
    });

    it('forwards headers and context to interceptors', () => {
      setup();
      const TRACE = new HttpContextToken(() => false);
      service
        .post(
          'tasks',
          {},
          { headers: { 'X-Trace': 'on' }, context: new HttpContext().set(TRACE, true) },
        )
        .subscribe();

      const { request } = httpTesting.expectOne('api/tasks');
      expect(request.headers.get('X-Trace')).toBe('on');
      expect(request.context.get(TRACE)).toBe(true);
    });
  });

  describe('resource', () => {
    const settle = () => TestBed.inject(ApplicationRef).whenStable();

    it('fetches through httpResource with the same url and params handling', async () => {
      setup();
      const ref = TestBed.runInInjectionContext(() =>
        service.resource<{ total: number }>(() => ({
          endpoint: 'tasks',
          params: { status: ['todo', 'done'] },
        })),
      );
      TestBed.tick();

      const req = httpTesting.expectOne((request) => request.url === 'api/tasks');
      expect(req.request.params.getAll('status')).toEqual(['todo', 'done']);

      req.flush({ total: 3 });
      await settle();

      expect(ref.value()).toEqual({ total: 3 });
      expect(ref.isLoading()).toBe(false);
    });

    it('sends the request again when a signal it reads changes', () => {
      setup();
      const id = signal('task-001');
      TestBed.runInInjectionContext(() => service.resource(() => ({ endpoint: `tasks/${id()}` })));
      TestBed.tick();
      httpTesting.expectOne('api/tasks/task-001').flush({});

      id.set('task-002');
      TestBed.tick();

      httpTesting.expectOne('api/tasks/task-002').flush({});
    });

    it('skips the request when the request function returns undefined', () => {
      setup();
      const ref = TestBed.runInInjectionContext(() =>
        service.resource<string[]>(() => undefined, { defaultValue: [] }),
      );
      TestBed.tick();

      httpTesting.expectNone(() => true);
      expect(ref.value()).toEqual([]);
    });

    it('exposes errors through the resource state', async () => {
      setup();
      const ref = TestBed.runInInjectionContext(() =>
        service.resource(() => ({ endpoint: 'tasks' })),
      );
      TestBed.tick();

      httpTesting
        .expectOne('api/tasks')
        .flush({ message: 'Down' }, { status: 503, statusText: 'Service Unavailable' });
      await settle();

      expect(ref.error()).toBeTruthy();
      expect(ref.status()).toBe('error');
    });
  });
});
