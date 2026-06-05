/**
 * Repository Pattern — contract for task persistence.
 * TaskStore depends on this abstraction, not on localStorage directly (DIP).
 */
export class ITaskRepository {
  load() {
    throw new Error('ITaskRepository.load() must be implemented');
  }

  save(tasks) {
    throw new Error('ITaskRepository.save() must be implemented');
  }

  exportJson(tasks) {
    throw new Error('ITaskRepository.exportJson() must be implemented');
  }

  importJson(json) {
    throw new Error('ITaskRepository.importJson() must be implemented');
  }
}
