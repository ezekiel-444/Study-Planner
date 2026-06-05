/**
 * Strategy Pattern — different rules for classifying task deadlines.
 */
import { isBeforeToday, isToday, isWithinDays } from '../utils/dateUtils.js';

export const DeadlineStrategies = {
  overdue: {
    matches(task) {
      return task.status !== 'done' && isBeforeToday(task.deadline);
    }
  },

  dueToday: {
    matches(task) {
      return task.status !== 'done' && isToday(task.deadline);
    }
  },

  dueThisWeek: {
    matches(task) {
      return task.status !== 'done' && isWithinDays(task.deadline, 7);
    }
  }
};

export class DeadlineContext {
  constructor(strategy = DeadlineStrategies.overdue) {
    this._strategy = strategy;
  }

  setStrategy(strategy) {
    this._strategy = strategy;
  }

  matches(task) {
    return this._strategy.matches(task);
  }

  filter(tasks) {
    return tasks.filter(task => this.matches(task));
  }
}
