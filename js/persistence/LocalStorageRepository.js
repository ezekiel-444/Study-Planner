/**
 * Repository Pattern — this is for localStorage implementation with schema versioning.
 */
import { ITaskRepository } from './ITaskRepository.js';

export const STORAGE_VERSION = 1;
const DEFAULT_KEY = 'planner_tasks';

export class LocalStorageRepository extends ITaskRepository {
  constructor(key = DEFAULT_KEY) {
    super();
    this._key = key;
  }

  load() {
    try {
      const raw = localStorage.getItem(this._key);
      if (!raw) return [];

      const parsed = JSON.parse(raw);

      // Legacy format: plain array of tasks
      if (Array.isArray(parsed)) return parsed;

      if (parsed.version === STORAGE_VERSION && Array.isArray(parsed.tasks)) {
        return parsed.tasks;
      }

      return [];
    } catch {
      return [];
    }
  }

  save(tasks) {
    localStorage.setItem(this._key, JSON.stringify({
      version: STORAGE_VERSION,
      tasks
    }));
  }

  exportJson(tasks) {
    return JSON.stringify({ version: STORAGE_VERSION, tasks }, null, 2);
  }

  importJson(json) {
    const parsed = JSON.parse(json);

    if (Array.isArray(parsed)) return parsed;

    if (parsed.version && Array.isArray(parsed.tasks)) {
      return parsed.tasks;
    }

    throw new Error('Invalid backup file format');
  }
}
