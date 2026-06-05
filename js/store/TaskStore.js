/**
 * TaskStore — Singleton + Observer Pattern
 * Manages tasks in memory; persistence delegated to Repository.
 */
import { TaskFactory } from '../models/Task.js';
import { LocalStorageRepository } from '../persistence/LocalStorageRepository.js';
import { TaskMemento } from '../persistence/TaskMemento.js';
import { StatsContext, StatsStrategies } from '../strategies/StatsStrategy.js';

class TaskStore {
  constructor(repository = new LocalStorageRepository()) {
    if (TaskStore._instance) return TaskStore._instance;
    TaskStore._instance = this;

    this._repository = repository;
    this._tasks = [];
    this._listeners = [];
    this._lastMemento = null;
    this._statsContext = new StatsContext(StatsStrategies.overview);
    this._subjectStatsContext = new StatsContext(StatsStrategies.bySubject);

    this._load();
  }

  subscribe(listener) {
    this._listeners.push(listener);
    return () => {
      this._listeners = this._listeners.filter(l => l !== listener);
    };
  }

  _notify() {
    this._listeners.forEach(fn => fn());
  }

  _load() {
    try {
      const data = this._repository.load();
      this._tasks = data.map(t => TaskFactory.restore(t));
    } catch {
      this._tasks = [];
    }
  }

  _persist() {
    this._repository.save(this._tasks.map(t => t.toJSON()));
  }

  getAll() {
    return [...this._tasks];
  }

  add(taskData) {
    const task = TaskFactory.create(taskData);
    this._tasks.push(task);
    this._persist();
    this._notify();
    return task;
  }

  update(id, changes) {
    const idx = this._tasks.findIndex(t => t.id === id);
    if (idx === -1) return;

    Object.assign(this._tasks[idx], changes);
    this._persist();
    this._notify();
  }

  remove(id) {
    this._lastMemento = TaskMemento.capture(this._tasks);
    this._tasks = this._tasks.filter(t => t.id !== id);
    this._persist();
    this._notify();
  }

  undoLastRemove() {
    if (!this._lastMemento) return false;
    this._tasks = this._lastMemento.restore();
    this._lastMemento = null;
    this._persist();
    this._notify();
    return true;
  }

  toggle(id) {
    const task = this._tasks.find(t => t.id === id);
    if (!task) return;

    task.status = task.status === 'done' ? 'pending' : 'done';
    this._persist();
    this._notify();
  }

  getStats() {
    return this._statsContext.compute(this._tasks);
  }

  getSubjectStats() {
    return this._subjectStatsContext.compute(this._tasks);
  }

  getSubjects() {
    return [...new Set(this._tasks.map(t => t.subject).filter(Boolean))];
  }

  createMemento() {
    return TaskMemento.capture(this._tasks);
  }

  restoreMemento(memento) {
    this._tasks = memento.restore();
    this._persist();
    this._notify();
  }

  exportBackup() {
    return this._repository.exportJson(this._tasks.map(t => t.toJSON()));
  }

  importBackup(json) {
    const data = this._repository.importJson(json);
    this._tasks = data.map(t => TaskFactory.restore(t));
    this._persist();
    this._notify();
  }
}

export const taskStore = new TaskStore();
