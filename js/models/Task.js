/**
 * Task Model
 * Factory Pattern: TaskFactory creates Task instances consistently.
 * Single Responsibility (SOLID): only defines/creates task data.
 */
import { isBeforeToday, isToday, isWithinDays, parseDeadline, startOfToday, daysBetween } from '../utils/dateUtils.js';

//This class holds internal state and takes its own backups
export class Task {
  constructor({ id, subject, title, deadline, status = 'pending', notes = '', createdAt }) {
    this.id = id;
    this.subject = subject;
    this.title = title;
    this.deadline = deadline;
    this.status = status; // 'pending' | 'done'
    this.notes = notes;
    this.createdAt = createdAt ?? new Date().toISOString();
  }

  isOverdue() {
    if (this.status === 'done') return false;
    return isBeforeToday(this.deadline);
  }

  isDueToday() {
    if (this.status === 'done') return false;
    return isToday(this.deadline);
  }

  isDueThisWeek() {
    if (this.status === 'done') return false;
    return isWithinDays(this.deadline, 7);
  }

  isDone() {
    return this.status === 'done';
  }

  daysOverdue() {
    if (!this.isOverdue()) return 0;
    const deadline = parseDeadline(this.deadline);
    return daysBetween(deadline, startOfToday());
  }

  //Saves current state snapshot as clean text data
  toJSON() {
    return {
      id: this.id,
      subject: this.subject,
      title: this.title,
      deadline: this.deadline,
      status: this.status,
      notes: this.notes,
      createdAt: this.createdAt
    };
  }

  // Rebuilds instance back safely from a text snapshot
  static fromJSON(data) {
    return new Task(data);
  }
}

//Centralized location to validate entries and create valid tasks safely
export const TaskFactory = {
  create(data) {
    const errors = this.validate(data); // Implements validation rules before building
    if (errors.length) throw new Error(errors.join(', '));
    return new Task({ ...data, id: crypto.randomUUID() }); // Securely injects Unique ID
  },

  restore(data) {
    return Task.fromJSON(data);
  },

  validate(data) {
    const errors = [];
    if (!data.subject?.trim()) errors.push('Subject is required');
    if (!data.title?.trim()) errors.push('Task title is required');
    if (!data.deadline) errors.push('Deadline is required');
    return errors;
  }
};