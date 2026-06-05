/**
 * Memento Pattern — captures and restores TaskStore state for undo/backup.
 */
import { TaskFactory } from '../models/Task.js';

export class TaskMemento {
  constructor(snapshot) {
    this._snapshot = snapshot;
  }

  static capture(tasks) {
    const snapshot = tasks.map(task => task.toJSON());
    return new TaskMemento(snapshot);
  }

  restore() {
    return this._snapshot.map(data => TaskFactory.restore(data));
  }
}
