/**
 * Strategy Pattern — different ways to filter the task list.
 */
import { DeadlineStrategies } from './DeadlineStrategy.js';

export const FilterStrategies = {
  all: {
    apply: (tasks) => tasks
  },

  pending: {
    apply: (tasks) => tasks.filter(t => t.status === 'pending')
  },

  done: {
    apply: (tasks) => tasks.filter(t => t.isDone())
  },

  overdue: {
    apply: (tasks) => tasks.filter(t => DeadlineStrategies.overdue.matches(t))
  },

  dueToday: {
    apply: (tasks) => tasks.filter(t => DeadlineStrategies.dueToday.matches(t))
  },

  dueThisWeek: {
    apply: (tasks) => tasks.filter(t => DeadlineStrategies.dueThisWeek.matches(t))
  },

  bySubject: (subject) => ({
    apply: (tasks) => tasks.filter(t => t.subject === subject)
  })
};

export class FilterContext {
  constructor(strategy = FilterStrategies.all) {
    this._strategy = strategy;
  }

  setStrategy(strategy) {
    this._strategy = strategy;
  }

  apply(tasks) {
    return this._strategy.apply(tasks);
  }
}
