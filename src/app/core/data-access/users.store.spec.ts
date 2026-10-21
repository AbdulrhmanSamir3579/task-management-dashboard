import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ApplicationRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { buildUser } from '../../../testing/builders';
import { UsersStore } from './users.store';

describe('UsersStore', () => {
  let httpTesting: HttpTestingController;
  const settle = () => TestBed.inject(ApplicationRef).whenStable();

  function createStore() {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    httpTesting = TestBed.inject(HttpTestingController);
    const store = TestBed.inject(UsersStore);
    TestBed.tick();
    return store;
  }

  afterEach(() => httpTesting.verify());

  it('loads users and offers them as sorted select options', async () => {
    const store = createStore();
    expect(store.isLoading()).toBe(true);
    expect(store.users()).toEqual([]);

    httpTesting
      .expectOne('api/users')
      .flush([
        buildUser({ id: 'u2', name: 'Sarah Smith' }),
        buildUser({ id: 'u1', name: 'John Doe' }),
      ]);
    await settle();

    expect(store.users()).toHaveLength(2);
    expect(store.options()).toEqual([
      { label: 'John Doe', value: 'u1' },
      { label: 'Sarah Smith', value: 'u2' },
    ]);
  });

  it('reports a failed load and loads again on reload', async () => {
    const store = createStore();
    httpTesting.expectOne('api/users').flush(null, { status: 500, statusText: 'Server Error' });
    await settle();

    expect(store.hasError()).toBe(true);
    expect(store.users()).toEqual([]);

    store.reload();
    TestBed.tick();
    httpTesting.expectOne('api/users').flush([buildUser()]);
    await settle();

    expect(store.hasError()).toBe(false);
    expect(store.users()).toHaveLength(1);
  });
});
