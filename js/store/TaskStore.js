/**
 * TaskStore
 * Singleton Pattern: one shared store for the entire app.
 * Observer Pattern: components subscribe to changes instead of polling.
 * Open/Closed (SOLID): add new subscribers without changing store logic.
 */

import { TaskFactory } from '../models/Task.js';

const STORAGE_KEY = 'planner_tasks';

class TaskStore {
  constructor() {
    if (TaskStore._instance) return TaskStore._instance;
    TaskStore._instance = this;

    this._tasks = [];
    this._listeners = [];
    this._load();
  }

  // Observer Pattern: subscribe to state changes
  subscribe(listener) {
    this._listeners.push(listener);
    return () => { this._listeners = this._listeners.filter(l => l !== listener); };
  }

  _notify() {
    this._listeners.forEach(fn => fn(this._tasks));
  }

  // DRY: one save method called after every mutation
  _save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this._tasks));
  }

  _load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const data = raw ? JSON.parse(raw) : [];
      this._tasks = data.map(t => TaskFactory.restore(t));
    } catch {
      this._tasks = [];
    }
  }

  getAll() {
    return [...this._tasks];
  }

  add(taskData) {
    const task = TaskFactory.create(taskData);
    this._tasks.push(task);
    this._save();
    this._notify();
    return task;
  }

  update(id, changes) {
    const idx = this._tasks.findIndex(t => t.id === id);
    if (idx === -1) return;
    Object.assign(this._tasks[idx], changes);
    this._save();
    this._notify();
  }

  remove(id) {
    this._tasks = this._tasks.filter(t => t.id !== id);
    this._save();
    this._notify();
  }

  toggle(id) {
    const task = this._tasks.find(t => t.id === id);
    if (!task) return;
    task.status = task.status === 'done' ? 'pending' : 'done';
    this._save();
    this._notify();
  }

  getStats() {
    const total = this._tasks.length;
    const completed = this._tasks.filter(t => t.isDone()).length;
    const overdue = this._tasks.filter(t => t.isOverdue()).length;
    return { total, completed, overdue };
  }

  getSubjects() {
    return [...new Set(this._tasks.map(t => t.subject).filter(Boolean))];
  }
}

// Singleton export
export const taskStore = new TaskStore();