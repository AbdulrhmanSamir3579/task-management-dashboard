import type { TasksResponse } from '../models';
import tasksJson from '../../../../data-fetching/tasks.json';

/** Output of `npm run data:generate`. Loaded lazily so it stays out of the initial bundle. */
export const seed = tasksJson as TasksResponse;
