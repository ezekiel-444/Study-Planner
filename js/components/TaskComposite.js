/**
 * Composite Pattern
 * Treats individual tasks and groups of tasks (by subject) uniformly.
 * Both TaskLeaf and TaskGroup share the same interface: { getItems(), getCount() }
 * This lets the renderer work with a single task or a whole subject group identically.
 */

// Leaf: wraps a single task
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
}

// Composite: a named group of tasks (e.g., all tasks for "Math")
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
    // Recursively collect all tasks from children
    return this._children.flatMap(c => c.getItems());
  }

  getCount() {
    return this._children.reduce((sum, c) => sum + c.getCount(), 0);
  }

  getLabel() {
    return this.label;
  }
}

/**
 * Builds a composite tree grouped by subject from a flat task array.
 * Returns an array of TaskGroup nodes (one per subject).
 */
export function buildSubjectTree(tasks) {
  const map = new Map();

  for (const task of tasks) {
    const subject = task.subject || 'Other';
    if (!map.has(subject)) map.set(subject, new TaskGroup(subject));
    map.get(subject).add(new TaskLeaf(task));
  }

  return [...map.values()];
}