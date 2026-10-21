import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { render } from '@testing-library/angular';
import { ConfirmService } from '../../shared/ui/confirm/confirm.service';
import { NotificationService } from '../../shared/ui/notifications/notification.service';
import { TasksStore } from './data-access/tasks.store';
import { TasksPage } from './tasks.page';

describe('TasksPage', () => {
  it('uses the search from the url as the board filter', async () => {
    const { fixture } = await render(TasksPage, {
      inputs: { q: 'budget' },
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ConfirmService, useValue: { confirm: vi.fn() } },
        { provide: NotificationService, useValue: { success: vi.fn(), error: vi.fn() } },
      ],
    });
    const store = TestBed.inject(TasksStore);
    TestBed.tick();
    TestBed.inject(HttpTestingController)
      .expectOne('api/tasks')
      .flush({ tasks: [], meta: { totalCount: 0, lastUpdated: '' } });

    expect(store.filters().search).toBe('budget');

    fixture.componentRef.setInput('q', undefined);
    TestBed.tick();
    expect(store.filters().search).toBe('');
  });
});
