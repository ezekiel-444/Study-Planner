/**
 * TaskStore handles all task operations in the application.
 * It stores tasks, updates them, removes them,
 * and saves data in localStorage.
 */

import { TaskFactory } from '../models/Task.js';

// localStorage key for saving tasks
const STORAGE_KEY = 'planner_tasks';

class TaskStore {

  constructor() {

    // Reuse existing store instance
    if (TaskStore._instance) return TaskStore._instance;

    // Save current instance
    TaskStore._instance = this;

    // Array for storing tasks
    this._tasks = [];

    // Functions that listen for updates
    this._listeners = [];

    // Load saved tasks when app starts
    this._load();
  }

  // Add listener function
  subscribe(listener) {

    // Store listener
    this._listeners.push(listener);

    // Remove listener if needed
    return () => {
      this._listeners =
        this._listeners.filter(l => l !== listener);
    };
  }

  // Run all listener functions after updates
  _notify() {
    this._listeners.forEach(fn => fn(this._tasks));
  }

  // Save tasks into localStorage
  _save() {

    // Convert tasks into JSON text
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(this._tasks)
    );
  }

  // Load tasks from localStorage
  _load() {

    try {

      // Get saved data
      const raw = localStorage.getItem(STORAGE_KEY);

      // Convert JSON into objects
      const data = raw ? JSON.parse(raw) : [];

      // Restore task objects
      this._tasks = data.map(t =>
        TaskFactory.restore(t)
      );

    } catch {

      // Reset tasks if loading fails
      this._tasks = [];
    }
  }

  // Return all tasks safely
  getAll() {
    return [...this._tasks];
  }

  // Add new task
  add(taskData) {

    // Create task object
    const task = TaskFactory.create(taskData);

    // Store task
    this._tasks.push(task);

    // Save changes and notify listeners
    this._save();
    this._notify();

    return task;
  }

  // Update task data
  update(id, changes) {

    // Find task position
    const idx =
      this._tasks.findIndex(t => t.id === id);

    // Stop if task does not exist
    if (idx === -1) return;

    // Apply changes
    Object.assign(this._tasks[idx], changes);

    // Save changes and notify listeners
    this._save();
    this._notify();
  }

  // Remove task from store
  remove(id) {

    // Keep all tasks except selected one
    this._tasks =
      this._tasks.filter(t => t.id !== id);

    // Save changes and notify listeners
    this._save();
    this._notify();
  }

  // Change task status
  toggle(id) {

    // Find task by ID
    const task =
      this._tasks.find(t => t.id === id);

    if (!task) return;

    // Switch between done and pending
    task.status =
      task.status === 'done'
        ? 'pending'
        : 'done';

    // Save changes and notify listeners
    this._save();
    this._notify();
  }

  // Generate task statistics
  getStats() {

    // Total task count
    const total = this._tasks.length;

    // Completed task count
    const completed =
      this._tasks.filter(t => t.isDone()).length;

    // Overdue task count
    const overdue =
      this._tasks.filter(t => t.isOverdue()).length;

    return {
      total,
      completed,
      overdue
    };
  }

  // Get unique subjects
  getSubjects() {

    return [
      ...new Set(
        this._tasks
          .map(t => t.subject)
          .filter(Boolean)
      )
    ];
  }
}

// Export shared TaskStore
export const taskStore = new TaskStore();

