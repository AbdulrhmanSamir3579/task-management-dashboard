import type { HttpResourceRef } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { type Observable, map } from 'rxjs';
import { HttpBaseService } from '../../../core/http/http-base.service';
import type {
  CreateTaskPayload,
  TaskDto,
  TasksResponse,
  UpdateTaskPayload,
} from '../../../core/models';

/** HTTP endpoints for tasks. Components never call this directly; they go through TasksStore. */
@Injectable({ providedIn: 'root' })
export class TasksApi {
  private readonly http = inject(HttpBaseService);

  /** `GET /tasks` as an `httpResource`. Must be called in an injection context. */
  listResource(): HttpResourceRef<TasksResponse | undefined> {
    return this.http.resource<TasksResponse>(() => ({ endpoint: 'tasks' }));
  }

  /**
   * `GET /tasks?search=` as an `httpResource`: it searches again when `query()` changes,
   * cancels the request for an older query, and sends nothing while `query()` is
   * `undefined`. Must be called in an injection context.
   */
  searchResource(
    query: () => string | undefined,
    limit: number,
  ): HttpResourceRef<TasksResponse | undefined> {
    return this.http.resource<TasksResponse>(() => {
      const search = query();
      return search === undefined ? undefined : { endpoint: 'tasks', params: { search, limit } };
    });
  }

  /** Tasks whose title or description contains `query`, title matches first. */
  search(query: string, limit: number): Observable<TaskDto[]> {
    return this.http
      .get<TasksResponse>('tasks', { params: { search: query, limit } })
      .pipe(map((response) => response.tasks));
  }

  create(payload: CreateTaskPayload): Observable<TaskDto> {
    return this.http.post<TaskDto>('tasks', payload);
  }

  update(id: string, changes: UpdateTaskPayload): Observable<TaskDto> {
    return this.http.patch<TaskDto>(`tasks/${id}`, changes);
  }

  remove(id: string): Observable<void> {
    return this.http.delete(`tasks/${id}`);
  }
}
