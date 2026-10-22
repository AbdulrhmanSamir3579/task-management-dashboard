import { computed, inject } from '@angular/core';
import { signalStore, withComputed, withMethods, withProps } from '@ngrx/signals';
import type { SelectOption } from '../../shared/ui/ui.types';
import { HttpBaseService } from '../http/http-base.service';
import type { User } from '../models';

/** Team members, loaded once and shared by the task form, filters and the Team page. */
export const UsersStore = signalStore(
  { providedIn: 'root' },
  withProps(() => ({
    _resource: inject(HttpBaseService).resource<User[]>(() => ({ endpoint: 'users' })),
  })),
  withComputed(({ _resource }) => {
    const users = computed(() => (_resource.hasValue() ? (_resource.value() ?? []) : []));
    return {
      users,
      isLoading: computed(() => _resource.isLoading()),
      hasLoaded: computed(() => _resource.hasValue()),
      hasError: computed(() => _resource.status() === 'error'),
      /** Users as options for selects, sorted by name. */
      options: computed<SelectOption<string>[]>(() =>
        [...users()]
          .sort((a, b) => a.name.localeCompare(b.name))
          .map((user) => ({ label: user.name, value: user.id })),
      ),
    };
  }),
  withMethods((store) => ({
    reload(): void {
      store._resource.reload();
    },
  })),
);
