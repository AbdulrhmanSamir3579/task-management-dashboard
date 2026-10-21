import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ApplicationRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { render, screen, within } from '@testing-library/angular';
import { buildTaskDto } from '../../../testing/builders';
import { ConfirmService } from '../../shared/ui/confirm/confirm.service';
import { NotificationService } from '../../shared/ui/notifications/notification.service';
import { DashboardPage } from './dashboard.page';

describe('DashboardPage', () => {
  async function setup() {
    await render(DashboardPage, {
      routes: [{ path: '**', children: [] }],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ConfirmService, useValue: { confirm: vi.fn() } },
        { provide: NotificationService, useValue: { success: vi.fn(), error: vi.fn() } },
      ],
    });
    return TestBed.inject(HttpTestingController);
  }

  it('shows skeleton statistics until the tasks arrive', async () => {
    await setup();
    expect(screen.getAllByRole('status', { name: 'Loading statistics' })).toHaveLength(4);
  });

  it('shows statistics computed from the tasks above the board', async () => {
    const httpTesting = await setup();
    TestBed.tick();
    httpTesting.expectOne('api/tasks').flush({
      tasks: [
        buildTaskDto({ id: 'a', status: 'todo', dueDate: '2000-01-01' }),
        buildTaskDto({ id: 'b', status: 'in_progress', dueDate: '2999-01-01' }),
        buildTaskDto({ id: 'c', status: 'done', completedAt: '2000-01-01T09:00:00.000Z' }),
      ],
      meta: { totalCount: 3, lastUpdated: '' },
    });
    await TestBed.inject(ApplicationRef).whenStable();

    const stats = screen.getByRole('region', { name: 'Task statistics' });
    const value = (title: string) => within(stats).getByRole('article', { name: title });
    expect(value('Total Tasks')).toHaveTextContent('3');
    expect(value('Completed')).toHaveTextContent('1');
    expect(value('In Progress')).toHaveTextContent('1');
    expect(value('Overdue')).toHaveTextContent('1');
    expect(screen.getByRole('region', { name: 'To Do' })).toBeInTheDocument();
  });
});
