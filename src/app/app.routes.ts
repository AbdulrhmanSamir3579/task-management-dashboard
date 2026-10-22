import type { Routes } from '@angular/router';
import { Shell } from './core/layout/shell';

/** Every page is lazy loaded, so the initial bundle only holds the shell. Titles are translation keys. */
export const routes: Routes = [
  {
    path: '',
    component: Shell,
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      {
        path: 'dashboard',
        title: 'NAV.DASHBOARD',
        loadComponent: () =>
          import('./features/dashboard/dashboard.page').then((m) => m.DashboardPage),
      },
      {
        path: 'tasks',
        title: 'NAV.TASKS',
        loadComponent: () => import('./features/tasks/tasks.page').then((m) => m.TasksPage),
      },
      {
        path: 'calendar',
        title: 'NAV.CALENDAR',
        loadComponent: () =>
          import('./features/calendar/calendar.page').then((m) => m.CalendarPage),
      },
      {
        path: 'analytics',
        title: 'NAV.ANALYTICS',
        loadComponent: () =>
          import('./features/analytics/analytics.page').then((m) => m.AnalyticsPage),
      },
      {
        path: 'team',
        title: 'NAV.TEAM',
        loadComponent: () => import('./features/team/team.page').then((m) => m.TeamPage),
      },
      {
        path: 'settings',
        title: 'NAV.SETTINGS',
        loadComponent: () =>
          import('./features/settings/settings.page').then((m) => m.SettingsPage),
      },
      {
        path: '**',
        title: 'NAV.NOT_FOUND',
        loadComponent: () =>
          import('./core/layout/not-found/not-found.page').then((m) => m.NotFoundPage),
      },
    ],
  },
];
