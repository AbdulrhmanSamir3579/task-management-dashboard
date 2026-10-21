import { Injectable } from '@angular/core';
import {
  type InMemoryDbService,
  type RequestInfo,
  type ResponseOptions,
  STATUS,
} from 'angular-in-memory-web-api';
import type { Observable } from 'rxjs';
import type {
  Activity,
  CreateTaskPayload,
  TaskDto,
  TasksResponse,
  UpdateTaskPayload,
} from '../models';
import { moveOnBoard, removeFromBoard } from '../../shared/utils/board-order';
import { rankByText } from '../../shared/utils/text-search';
import { type MockDb, createMockDb, nextTaskId } from './mock-db';

/** Name shown in the activity feed for changes made through the app. */
export const CURRENT_USER_NAME = 'You';

/**
 * In-memory "server" for the demo. angular-in-memory-web-api serves the collections;
 * the overrides below add what a real backend would own: the tasks envelope,
 * validation, server-side timestamps, column ordering and the activity log.
 * Returning `undefined` from an override falls back to the library's default handling.
 */
@Injectable()
export class InMemoryDataService implements InMemoryDbService {
  createDb(): Promise<MockDb> {
    // Dynamic import keeps the seed JSON out of the initial bundle.
    return import('./seed').then(({ seed }) => createMockDb(seed, new Date()));
  }

  get(reqInfo: RequestInfo): Observable<unknown> | undefined {
    if (reqInfo.collectionName !== 'tasks' || reqInfo.id) {
      return undefined;
    }
    return reqInfo.utils.createResponse$(() => {
      // Optional `?search=` (title and description) and `?limit=` query parameters.
      const matches = rankByText(this.db(reqInfo).tasks, reqInfo.query.get('search')?.[0] ?? '');
      const limit = Number(reqInfo.query.get('limit')?.[0]);
      const page = limit > 0 ? matches.slice(0, limit) : matches;
      const body: TasksResponse = {
        tasks: structuredClone(page),
        meta: { totalCount: matches.length, lastUpdated: new Date().toISOString() },
      };
      return { status: STATUS.OK, body };
    });
  }

  post(reqInfo: RequestInfo): Observable<unknown> {
    return reqInfo.utils.createResponse$(() => {
      if (reqInfo.collectionName !== 'tasks') {
        return this.readOnly(reqInfo);
      }

      const db = this.db(reqInfo);
      const payload = this.body<CreateTaskPayload>(reqInfo);
      const assignee = db.users.find((user) => user.id === payload.assigneeId);
      if (!payload.title?.trim() || !assignee) {
        return this.error(STATUS.UNPROCESSABLE_ENTRY, 'A task needs a title and a known assignee.');
      }

      const timestamp = new Date().toISOString();
      const task: TaskDto = {
        id: nextTaskId(db.tasks),
        title: payload.title.trim(),
        description: payload.description ?? '',
        status: payload.status,
        priority: payload.priority,
        dueDate: payload.dueDate,
        tags: payload.tags ?? [],
        assignee,
        completedAt: payload.status === 'done' ? (payload.completedAt ?? timestamp) : null,
        position: db.tasks.filter((existing) => existing.status === payload.status).length,
        createdAt: timestamp,
        updatedAt: timestamp,
      };

      db.tasks.push(task);
      this.log(db, { type: 'created', taskId: task.id, taskTitle: task.title, timestamp });
      return { status: STATUS.CREATED, body: structuredClone(task) };
    });
  }

  patch(reqInfo: RequestInfo): Observable<unknown> {
    return reqInfo.utils.createResponse$(() => {
      if (reqInfo.collectionName !== 'tasks') {
        return this.readOnly(reqInfo);
      }

      const db = this.db(reqInfo);
      const current = db.tasks.find((task) => task.id === reqInfo.id);
      if (!current) {
        return this.error(STATUS.NOT_FOUND, `Task ${reqInfo.id} was not found.`);
      }

      const {
        assigneeId,
        position,
        status,
        completedAt: requestedCompletedAt,
        ...fields
      } = this.body<UpdateTaskPayload>(reqInfo);
      const assignee =
        assigneeId === undefined
          ? current.assignee
          : db.users.find((user) => user.id === assigneeId);
      if (!assignee) {
        return this.error(STATUS.UNPROCESSABLE_ENTRY, `Assignee ${assigneeId} does not exist.`);
      }

      const timestamp = new Date().toISOString();
      const nextStatus = status ?? current.status;
      const statusChanged = nextStatus !== current.status;
      const updated: TaskDto = {
        ...current,
        ...fields,
        assignee,
        updatedAt: timestamp,
        // Done tasks keep a completion date: the one sent, the current one, or now.
        completedAt:
          nextStatus === 'done'
            ? (requestedCompletedAt ??
              (statusChanged ? timestamp : (current.completedAt ?? timestamp)))
            : null,
      };

      db.tasks = moveOnBoard(
        db.tasks.map((task) => (task.id === updated.id ? updated : task)),
        updated.id,
        nextStatus,
        position ?? (statusChanged ? undefined : current.position),
      );

      const base = { taskId: updated.id, taskTitle: updated.title, timestamp };
      if (statusChanged) {
        this.log(db, {
          ...base,
          type: 'status_changed',
          fromStatus: current.status,
          toStatus: nextStatus,
        });
      } else if (
        Object.keys(fields).length > 0 ||
        assigneeId !== undefined ||
        requestedCompletedAt !== undefined
      ) {
        this.log(db, { ...base, type: 'updated' });
      }

      return {
        status: STATUS.OK,
        body: structuredClone(db.tasks.find((task) => task.id === updated.id)),
      };
    });
  }

  delete(reqInfo: RequestInfo): Observable<unknown> {
    return reqInfo.utils.createResponse$(() => {
      if (reqInfo.collectionName !== 'tasks') {
        return this.readOnly(reqInfo);
      }

      const db = this.db(reqInfo);
      const task = db.tasks.find((existing) => existing.id === reqInfo.id);
      if (!task) {
        return this.error(STATUS.NOT_FOUND, `Task ${reqInfo.id} was not found.`);
      }

      db.tasks = removeFromBoard(db.tasks, task.id);
      this.log(db, {
        type: 'deleted',
        taskId: task.id,
        taskTitle: task.title,
        timestamp: new Date().toISOString(),
      });
      return { status: STATUS.NO_CONTENT };
    });
  }

  private db(reqInfo: RequestInfo): MockDb {
    return reqInfo.utils.getDb() as MockDb;
  }

  private body<T>(reqInfo: RequestInfo): T {
    return reqInfo.utils.getJsonBody(reqInfo.req) as T;
  }

  private log(db: MockDb, entry: Omit<Activity, 'id' | 'actor'>): void {
    db.activities.unshift({
      id: `activity-${db.activities.length + 1}`,
      actor: CURRENT_USER_NAME,
      ...entry,
    });
  }

  private readOnly(reqInfo: RequestInfo): ResponseOptions {
    return this.error(
      STATUS.METHOD_NOT_ALLOWED,
      `The ${reqInfo.collectionName} collection is read-only.`,
    );
  }

  private error(status: number, message: string): ResponseOptions {
    return { status, body: { message } };
  }
}
