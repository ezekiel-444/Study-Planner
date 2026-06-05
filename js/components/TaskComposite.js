/**
 * Composite Pattern
 * Treats individual tasks and groups of tasks (by subject) uniformly.
 * Both TaskLeaf and TaskGroup share the same interface for traversal and stats.
 */

export class TaskLeaf {
  constructor(task) {
    this.task = task;
  }

  getItems() {
    return [this.task];
  }

  getCount() {
    return 1;
  }

  getLabel() {
    return this.task.title;
  }

  getCompletedCount() {
    return this.task.isDone() ? 1 : 0;
  }

  getOverdueCount() {
    return this.task.isOverdue() ? 1 : 0;
  }

  getPendingCount() {
    return this.task.isDone() ? 0 : 1;
  }

  getCompletionRate() {
    return this.task.isDone() ? 100 : 0;
  }
}

export class TaskGroup {
  constructor(label) {
    this.label = label;
    this._children = [];
  }

  add(child) {
    this._children.push(child);
    return this;
  }

  getItems() {
    return this._children.flatMap(c => c.getItems());
  }

  getCount() {
    return this._children.reduce((sum, c) => sum + c.getCount(), 0);
  }

  getLabel() {
    return this.label;
  }

  getCompletedCount() {
    return this._children.reduce((sum, c) => sum + c.getCompletedCount(), 0);
  }

  getOverdueCount() {
    return this._children.reduce((sum, c) => sum + c.getOverdueCount(), 0);
  }

  getPendingCount() {
    return this._children.reduce((sum, c) => sum + c.getPendingCount(), 0);
  }

  getCompletionRate() {
    const total = this.getCount();
    return total ? Math.round((this.getCompletedCount() / total) * 100) : 0;
  }
}

export function buildSubjectTree(tasks) {
  const map = new Map();

  for (const task of tasks) {
    const subject = task.subject || 'Other';
    if (!map.has(subject)) map.set(subject, new TaskGroup(subject));
    map.get(subject).add(new TaskLeaf(task));
  }

  return [...map.values()];
}

export function sortTasksForDisplay(tasks) {
  return [...tasks].sort((a, b) => {
    const aOverdue = a.isOverdue() ? 0 : 1;
    const bOverdue = b.isOverdue() ? 0 : 1;
    if (aOverdue !== bOverdue) return aOverdue - bOverdue;

    const aDone = a.isDone() ? 1 : 0;
    const bDone = b.isDone() ? 1 : 0;
    if (aDone !== bDone) return aDone - bDone;

    return (a.deadline || '').localeCompare(b.deadline || '');
  });
}
