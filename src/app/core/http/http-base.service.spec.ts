import { HttpContext, HttpContextToken, provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
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
});
