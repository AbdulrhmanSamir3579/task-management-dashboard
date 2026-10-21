import type { HttpResourceRef } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import type { Observable } from 'rxjs';
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
