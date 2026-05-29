/**
 * Task Model
 * Factory Pattern: TaskFactory creates Task instances consistently.
 * Single Responsibility (SOLID): only defines/creates task data.
 */

export class Task {
  constructor({ id, subject, title, deadline, status = 'pending', notes = '' }) {
    this.id = id;
    this.subject = subject;
    this.title = title;
    this.deadline = deadline;
    this.status = status; // 'pending' | 'done'
    this.notes = notes;
    this.createdAt = new Date().toISOString();
  }

  isOverdue() {
    if (this.status === 'done') return false;
    return this.deadline && new Date(this.deadline) < new Date();
  }

  isDone() {
    return this.status === 'done';
  }
}

// Factory Pattern: centralizes creation logic, validates, assigns IDs
export const TaskFactory = {
  create(data) {
    const errors = this.validate(data);
    if (errors.length) throw new Error(errors.join(', '));
    return new Task({ ...data, id: crypto.randomUUID() });
  },

  // Used when restoring from localStorage (already have IDs)
  restore(data) {
    return new Task(data);
  },

  validate(data) {
    const errors = [];
    if (!data.subject?.trim()) errors.push('Subject is required');
    if (!data.title?.trim()) errors.push('Task title is required');
    if (!data.deadline) errors.push('Deadline is required');
    return errors;
  }
};